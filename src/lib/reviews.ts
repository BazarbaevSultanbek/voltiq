import "server-only";
import { Types } from "mongoose";
import { db } from "./db";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { notifyUser, emailCustomer } from "./notify";

/** Orders that count as a purchase (paid and not cancelled). */
const BOUGHT = ["paid", "processing", "shipped", "delivered"] as ("paid" | "processing" | "shipped" | "delivered")[];

export async function hasBought(userId: string, productId: string) {
  await db();
  return !!(await Order.exists({ user: userId, status: { $in: BOUGHT }, "items.product": productId }));
}

/** Public display name: "Aziz K." — never the full surname or email. */
export function publicName(name?: string | null, email?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length) return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  return (email || "Customer").split("@")[0].slice(0, 3) + "…";
}

/** Recalculate a product's average rating and review count. */
export async function refreshRating(productId: string) {
  const [s] = await Review.aggregate<{ avg: number; n: number }>([
    { $match: { product: new Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: productId }, { $set: { rating: s ? Math.round(s.avg * 10) / 10 : null, reviewsCount: s?.n ?? 0 } });
}

export async function upsertReview(userId: string, productId: string, rating: number, text: string) {
  await db();
  const u = await User.findById(userId).select("name email").lean();
  if (!u) throw Object.assign(new Error("unauthorized"), { code: "unauthorized", status: 401 });
  await Review.updateOne(
    { product: productId, user: userId },
    { $set: { rating, text, name: publicName(u.name, u.email) } },
    { upsert: true },
  );
  await refreshRating(productId);
}

export async function listReviews(productId: string, limit = 50) {
  await db();
  return Review.find({ product: productId }).sort({ createdAt: -1 }).limit(limit).select("rating text name createdAt updatedAt").lean();
}

/**
 * Ask the buyer to rate each item of a delivered order (in-site notification + email if configured).
 * Sent once per order.
 */
export async function askForReviews(orderId: string) {
  await db();
  const o = await Order.findOneAndUpdate({ _id: orderId, reviewAskedAt: null }, { $set: { reviewAskedAt: new Date() } }, { new: true }).lean();
  if (!o) return;
  const seen = new Set<string>();
  for (const i of o.items) {
    if (!i.product || seen.has(String(i.product))) continue;
    seen.add(String(i.product));
    await notifyUser(o.user, "notif.reviewAsk", { title: i.title }, `/p/${i.slug}#reviews`);
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  if (o.email && site) {
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    const links = o.items.filter((i) => i.slug).map((i) => `<li><a href="${site}/en/p/${i.slug}#reviews">${esc(i.title || "Your item")}</a></li>`).join("");
    await emailCustomer(o.email, `How was your order ${o.number}?`, `<h2>Your order ${esc(o.number || "")} was delivered.</h2><p>Tell other shoppers what you think — give it stars and leave a comment:</p><ul>${links}</ul><p>— KAUP</p>`);
  }
}
