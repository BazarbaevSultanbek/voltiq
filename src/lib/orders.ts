import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { quote, countryName, type MethodId } from "./shipping";
import { getSettings } from "./settings";
import { ALLOWED_BRANDS, detectBrand, luhn, validExpiry } from "./cards";
import { stripe, stripeEnabled } from "./stripe";
import { notifyUser, notifyOwner, emailCustomer } from "./notify";
import { after } from "next/server";
import { cjEnabled, cjSendOrder, cjAutoOrderOn } from "./cj";

export const AddressInput = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(5).max(30),
  country: z.string().length(2),
  region: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().min(1).max(80),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional().default(""),
  postal: z.string().trim().max(20).optional().default(""),
});

export const CheckoutInput = z.object({
  items: z.array(z.object({ id: z.string(), qty: z.number().int().min(1).max(20), color: z.string().optional() })).min(1).max(50),
  address: AddressInput,
  method: z.enum(["standard", "express", "priority"]),
  saveAddress: z.boolean().optional(),
  paymentMethodId: z.string().optional(),
  testCard: z.object({ number: z.string(), exp: z.string(), cvc: z.string(), name: z.string() }).optional(),
});

export class CheckoutError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}

const newNumber = () => "KP-" + crypto.randomBytes(4).toString("base64url").replace(/[-_]/g, "X").toUpperCase().slice(0, 6);

async function priceCart(items: z.infer<typeof CheckoutInput>["items"]) {
  const ids = [...new Set(items.map((i) => i.id))];
  const products = await Product.find({ _id: { $in: ids }, active: true }).lean();
  const map = new Map(products.map((p) => [String(p._id), p]));
  const lines = items.map((i) => {
    const p = map.get(i.id);
    if (!p) throw new CheckoutError("product_unavailable");
    if (p.stock < i.qty) throw new CheckoutError("out_of_stock");
    const colorIdx = Math.max(0, p.colors.findIndex((c) => c.name === i.color));
    return {
      product: p._id, slug: p.slug, title: p.title, image: p.images[colorIdx] || p.images[0],
      price: p.price, qty: i.qty, color: i.color || p.colors[0]?.name || "",
      vid: (p.variants?.find((v) => v.name === i.color) ?? p.variants?.[0])?.vid,
    };
  });
  const subtotal = Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return { lines, subtotal, count };
}

export async function createOrder(userId: string, input: z.infer<typeof CheckoutInput>) {
  await db();
  const user = await User.findById(userId);
  if (!user) throw new CheckoutError("unauthorized", 401);
  const settings = await getSettings();
  const { lines, subtotal, count } = await priceCart(input.items);
  const q = quote(input.address.country, count, subtotal, settings.freeShippingOver).find((m) => m.id === (input.method as MethodId))!;
  const total = Math.round((subtotal + q.price) * 100) / 100;

  const base = {
    number: newNumber(), user: user._id, email: user.email, items: lines, subtotal, shipping: q.price, total, currency: "USD",
    address: input.address,
    shippingMethod: { id: q.id, price: q.price, minDays: q.minDays, maxDays: q.maxDays },
    eta: { from: new Date(q.etaFrom), to: new Date(q.etaTo) },
    status: "pending_payment" as const,
    timeline: [{ status: "pending_payment", at: new Date(), note: "Order created" }],
  };

  if (input.saveAddress) {
    const exists = user.addresses.some((a) => a.line1 === input.address.line1 && a.city === input.address.city);
    if (!exists) {
      user.addresses.push({ ...input.address, isDefault: user.addresses.length === 0 });
    }
    if (!user.phone) user.phone = input.address.phone;
    await user.save();
  }

  // ── Real card payment via Stripe
  if (stripeEnabled()) {
    if (!input.paymentMethodId) throw new CheckoutError("payment_required");
    const s = stripe();
    const pm = await s.paymentMethods.retrieve(input.paymentMethodId);
    const brand = pm.card?.brand ?? "unknown";
    if (!ALLOWED_BRANDS.includes(brand as never)) throw new CheckoutError("brand_not_allowed");
    const order = await Order.create({ ...base, payment: { provider: "stripe", brand, last4: pm.card?.last4 } });
    const pi = await s.paymentIntents.create({
      amount: Math.round(total * 100), currency: "usd", payment_method: pm.id, automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      confirm: true, receipt_email: user.email, description: `KAUP order ${order.number}`,
      metadata: { orderId: String(order._id), number: order.number },
    }).catch(async (e) => {
      order.status = "cancelled"; order.timeline.push({ status: "cancelled", at: new Date(), note: "Payment declined" });
      await order.save();
      throw new CheckoutError(e?.code || "card_declined", 402);
    });
    order.payment!.intentId = pi.id;
    order.payment!.status = pi.status;
    await order.save();
    if (pi.status === "succeeded") return finalize(String(order._id));
    if (pi.status === "requires_action") return { order: null, requiresAction: true, clientSecret: pi.client_secret, orderId: String(order._id) };
    throw new CheckoutError("card_declined", 402);
  }

  // ── Test mode (no Stripe keys configured): validate card locally, no money moves.
  const c = input.testCard;
  if (!c) throw new CheckoutError("payment_required");
  const brand = detectBrand(c.number);
  if (!ALLOWED_BRANDS.includes(brand)) throw new CheckoutError("brand_not_allowed");
  if (!luhn(c.number) || !validExpiry(c.exp) || !/^\d{3,4}$/.test(c.cvc) || c.name.trim().length < 2) throw new CheckoutError("card_invalid");
  const order = await Order.create({ ...base, payment: { provider: "test", brand, last4: c.number.replace(/\D/g, "").slice(-4), status: "succeeded" } });
  return finalize(String(order._id));
}

/** After 3-D Secure, verify the PaymentIntent and finalize. */
export async function confirmOrder(userId: string, orderId: string) {
  await db();
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new CheckoutError("not_found", 404);
  if (order.status !== "pending_payment") return { order: order.toObject() };
  const pi = await stripe().paymentIntents.retrieve(order.payment!.intentId!);
  if (pi.status !== "succeeded" || pi.amount !== Math.round(order.total! * 100)) throw new CheckoutError("card_declined", 402);
  return finalize(orderId);
}

export async function finalize(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new CheckoutError("not_found", 404);
  if (order.status === "pending_payment") {
    order.status = "paid";
    order.payment!.status = "succeeded";
    order.timeline.push({ status: "paid", at: new Date(), note: "Payment received, order accepted" });
    await order.save();
    await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { sold: i.qty!, stock: -i.qty! } })));
    const eta = `${order.eta!.from!.toISOString().slice(0, 10)} – ${order.eta!.to!.toISOString().slice(0, 10)}`;
    await notifyUser(order.user, "notif.orderPlaced", { number: order.number, eta }, "/account/orders");
    const a = order.address!;
    await Promise.allSettled([
      notifyOwner(
        `🛒 <b>New order ${order.number}</b>${order.payment?.provider === "test" ? " (TEST)" : ""}\n` +
        `💵 $${order.total!.toFixed(2)} · ${order.items.reduce((s, i) => s + i.qty!, 0)} items · ${order.shippingMethod!.id}\n` +
        `👤 ${a.fullName} · ${a.phone} · ${order.email}\n📍 ${a.city}, ${countryName(a.country)}\n` +
        order.items.map((i) => `• ${i.qty}× ${i.title} (${i.color})`).join("\n"),
      ),
      emailCustomer(order.email!, `Order ${order.number} confirmed`,
        `<h2>Thanks for your order!</h2><p>Order <b>${order.number}</b> is accepted. Total: $${order.total!.toFixed(2)}.</p><p>Estimated delivery: ${eta}.</p>`),
    ]);
    // Auto-forward to CJ Dropshipping after the response is sent
    if (cjEnabled()) {
      const id = String(order._id);
      after(async () => {
        try {
          if (!(await cjAutoOrderOn())) return;
          const sent = await cjSendOrder(id);
          await notifyOwner(sent.supplier?.orderId ? `📦 ${sent.number} sent to CJ (${sent.supplier.logisticName})` : `⚠️ ${sent.number} NOT sent to CJ: ${sent.supplier?.error}`);
        } catch (e) { console.error("[cj] auto-order failed", e); }
      });
    }
  }
  return { order: order.toObject() };
}
