import "server-only";
import { db } from "./db";
import { Settings } from "@/models/Settings";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { CATEGORIES } from "./catalog";
import { priceProduct } from "./pricing";
import { getSettings } from "./settings";
import { countryName } from "./shipping";
import { notifyUser } from "./notify";

/**
 * CJ Dropshipping API v2 — https://developers.cjdropshipping.com
 * Rate limit: 1 request / second per account, so calls are serialized.
 */
const BASE = process.env.CJ_API_BASE || "https://developers.cjdropshipping.com/api2.0/v1";
export const cjEnabled = () => !!process.env.CJ_API_KEY;

type CjResp<T> = { code: number; result: boolean; message: string; data: T };

let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;
function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = 1100 - (Date.now() - lastCall);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
}

async function getToken(force = false): Promise<string> {
  await db();
  const s = await Settings.findOne({ key: "global" }).select("+cjAccessToken +cjRefreshToken cjTokenExpiry");
  if (!force && s?.cjAccessToken && s.cjTokenExpiry && s.cjTokenExpiry.getTime() > Date.now() + 864e5) return s.cjAccessToken;
  const res = await throttle(() =>
    fetch(`${BASE}/authentication/getAccessToken`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: process.env.CJ_API_KEY }), cache: "no-store",
    }).then((r) => r.json() as Promise<CjResp<{ accessToken: string; refreshToken: string; accessTokenExpiryDate: string }>>),
  );
  if (!res.result || !res.data?.accessToken) throw new Error(`CJ auth failed: ${res.message}`);
  const expiry = res.data.accessTokenExpiryDate ? new Date(res.data.accessTokenExpiryDate) : new Date(Date.now() + 170 * 864e5);
  await Settings.updateOne({ key: "global" }, { $set: { cjAccessToken: res.data.accessToken, cjRefreshToken: res.data.refreshToken, cjTokenExpiry: expiry } }, { upsert: true });
  return res.data.accessToken;
}

async function cj<T>(path: string, init: { method?: string; query?: Record<string, string | number | undefined>; body?: unknown } = {}, retry = true): Promise<T> {
  const token = await getToken();
  const qs = init.query ? "?" + new URLSearchParams(Object.entries(init.query).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
  const res = await throttle(() =>
    fetch(`${BASE}${path}${qs}`, {
      method: init.method || "GET",
      headers: { "CJ-Access-Token": token, "content-type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined, cache: "no-store",
    }).then((r) => r.json() as Promise<CjResp<T>>),
  );
  // 1600001 = invalid/expired token → refresh once
  if (!res.result && retry && /token/i.test(res.message || "")) { await getToken(true); return cj<T>(path, init, false); }
  if (!res.result) throw new Error(`CJ: ${res.message || res.code}`);
  return res.data;
}

// ───────────────────────── Products ─────────────────────────
type ListItem = { id: string; nameEn: string; sku: string; bigImage: string; sellPrice: string; threeCategoryName?: string };
export async function cjSearch(keyWord: string, size = 20, page = 1) {
  const d = await cj<{ totalRecords: number; content: { productList: ListItem[] }[] }>("/product/listV2", { query: { keyWord, size, page, features: "enable_category" } });
  return { total: d?.totalRecords ?? 0, items: (d?.content ?? []).flatMap((c) => c.productList ?? []) };
}

type Detail = {
  pid: string; productNameEn: string; productSku: string; bigImage: string; productImageSet?: string[] | string;
  description?: string; sellPrice: number | string; categoryName?: string;
  variants?: { vid: string; variantNameEn?: string; variantKey?: string; variantImage?: string; variantSellPrice: number | string; variantSku?: string }[];
};
export const cjDetail = (pid: string) => cj<Detail>("/product/query", { query: { pid } });

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
const stripHtml = (h = "") => h.replace(/<img[^>]*>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim().slice(0, 3000);
const cleanTitle = (t: string) => t.replace(/\s+/g, " ").trim().slice(0, 140);

export async function cjImportOne(pid: string, category: string, marginPct: number) {
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) throw new Error("Unknown category");
  const d = await cjDetail(pid);
  const set = Array.isArray(d.productImageSet) ? d.productImageSet : typeof d.productImageSet === "string" ? (() => { try { return JSON.parse(d.productImageSet as string); } catch { return [d.productImageSet]; } })() : [];
  const variants = (d.variants ?? []).slice(0, 12).map((v) => ({
    vid: v.vid, sku: v.variantSku, image: v.variantImage || d.bigImage, cost: Number(v.variantSellPrice) || Number(d.sellPrice) || 0,
    name: (v.variantKey || v.variantNameEn || "Default").replace(/\s+/g, " ").slice(0, 40),
  }));
  const cost = Math.max(...(variants.length ? variants.map((v) => v.cost) : [Number(d.sellPrice) || 0]));
  if (!cost) throw new Error("No price");
  const { price, compareAt } = priceProduct({ costPrice: cost, supplierCompareAt: 0 }, marginPct);
  const images = variants.length > 1 ? variants.map((v) => v.image) : [...new Set([d.bigImage, ...set].filter(Boolean))].slice(0, 8);
  const doc = {
    title: cleanTitle(d.productNameEn), description: stripHtml(d.description) || cleanTitle(d.productNameEn),
    category, group: cat.group, costPrice: cost, supplierCompareAt: 0, price, compareAt, images,
    colors: variants.length > 1 ? variants.map((v) => ({ name: v.name, hex: "#8a8f99" })) : [],
    variants, source: "cj" as const, sourceId: d.pid, sourceUrl: `https://cjdropshipping.com/product/-p-${d.pid}.html`,
    tags: [d.categoryName, ...cleanTitle(d.productNameEn).toLowerCase().split(/\s+/).slice(0, 8)].filter(Boolean) as string[],
    stock: 999, active: true,
  };
  const ex = await Product.findOne({ source: "cj", sourceId: d.pid });
  if (ex) { await Product.updateOne({ _id: ex._id }, { $set: doc }); return "updated" as const; }
  await Product.create({ ...doc, slug: `${slugify(doc.title)}-${d.pid.slice(-5).toLowerCase()}` });
  return "created" as const;
}

export async function cjImport(keyWord: string, category: string, count: number) {
  if (!cjEnabled()) throw new Error("Add CJ_API_KEY in Vercel first.");
  await db();
  const { marginPct } = await getSettings();
  const { items } = await cjSearch(keyWord, Math.min(count, 20));
  let created = 0, updated = 0, failed = 0;
  for (const it of items.slice(0, count)) {
    try { (await cjImportOne(it.id, category, marginPct)) === "created" ? created++ : updated++; } catch { failed++; }
  }
  return { found: items.length, created, updated, failed };
}

// ───────────────────────── Orders ─────────────────────────
type Freight = { logisticName: string; logisticPrice: number; logisticAging: string };
async function pickLogistic(country: string, zip: string | undefined, products: { vid: string; quantity: number }[], speed: string) {
  const opts = await cj<Freight[]>("/logistic/freightCalculate", { method: "POST", body: { startCountryCode: "CN", endCountryCode: country, zip, products } });
  if (!opts?.length) throw new Error("CJ cannot ship to this country");
  const maxDays = (a: string) => Number(String(a).split("-").pop()) || 99;
  const sorted = speed === "standard" ? [...opts].sort((a, b) => a.logisticPrice - b.logisticPrice) : [...opts].sort((a, b) => maxDays(a.logisticAging) - maxDays(b.logisticAging) || a.logisticPrice - b.logisticPrice);
  return sorted[0];
}

/** Send a paid order to CJ. Paid automatically from your CJ balance (payType 2). */
export async function cjSendOrder(orderId: string) {
  await db();
  const o = await Order.findById(orderId);
  if (!o) throw new Error("Order not found");
  if (o.supplier?.orderId) return o;
  const ids = o.items.map((i) => i.product);
  const prods = new Map((await Product.find({ _id: { $in: ids } }).select("source variants").lean()).map((p) => [String(p._id), p]));
  const lines = o.items.map((i) => {
    const p = prods.get(String(i.product));
    if (p?.source !== "cj") return null;
    const v = p.variants.find((x) => x.name === i.color) ?? p.variants[0];
    return v?.vid ? { vid: v.vid, quantity: i.qty! } : null;
  });
  if (lines.some((l) => !l)) throw new Error("Some items are not CJ products — order them manually.");
  const products = lines as { vid: string; quantity: number }[];
  const a = o.address!;
  try {
    const lg = await pickLogistic(a.country!, a.postal || undefined, products, o.shippingMethod?.id || "standard");
    const r = await cj<{ orderId: string; orderStatus: string; orderAmount?: number; productAmount?: number; postageAmount?: number }>("/shopping/order/createOrderV2", {
      method: "POST",
      body: {
        orderNumber: o.number, shippingCountryCode: a.country, shippingCountry: countryName(a.country),
        shippingProvince: a.region || a.city, shippingCity: a.city, shippingAddress: [a.line1, a.line2].filter(Boolean).join(", "),
        shippingZip: a.postal || "", shippingCustomerName: a.fullName, shippingPhone: a.phone, email: o.email,
        logisticName: lg.logisticName, fromCountryCode: "CN", payType: 2, products,
      },
    });
    o.supplier = { provider: "cj", orderId: r.orderId, status: r.orderStatus, logisticName: lg.logisticName, cost: r.orderAmount ?? undefined, sentAt: new Date(), error: undefined } as never;
    if (o.status === "paid") { o.status = "processing"; o.timeline.push({ status: "processing", at: new Date(), note: "Sent to supplier" }); }
  } catch (e) {
    o.supplier = { provider: "cj", error: (e as Error).message.slice(0, 300), sentAt: new Date() } as never;
  }
  await o.save();
  return o;
}

type CjOrder = { orderId: string; orderStatus: string; trackNumber?: string; logisticName?: string; orderAmount?: number };
/** Pull CJ status + tracking number back into our order and notify the customer. */
export async function cjSyncOrder(orderId: string) {
  await db();
  const o = await Order.findById(orderId);
  if (!o?.supplier?.orderId) return o;
  const d = await cj<CjOrder>("/shopping/order/getOrderDetail", { query: { orderId: o.supplier.orderId } });
  o.supplier.status = d.orderStatus;
  o.supplier.syncedAt = new Date();
  if (d.logisticName) o.supplier.logisticName = d.logisticName;
  const newTrack = d.trackNumber && d.trackNumber !== o.supplier.trackNumber;
  if (d.trackNumber) o.supplier.trackNumber = d.trackNumber;
  const map: Record<string, "shipped" | "delivered" | "cancelled"> = { SHIPPED: "shipped", DELIVERED: "delivered", CANCELLED: "cancelled" };
  const next = map[String(d.orderStatus).toUpperCase()] ?? (newTrack ? "shipped" : undefined);
  if (next && next !== o.status && o.status !== "delivered") {
    o.status = next;
    o.timeline.push({ status: next, at: new Date(), note: d.trackNumber ? `Tracking ${d.trackNumber}` : "" });
    await notifyUser(o.user, "notif.orderStatus", { number: o.number, status: next }, "/account/orders");
  }
  await o.save();
  return o;
}

export async function cjSyncOpenOrders(limit = 25) {
  await db();
  const open = await Order.find({ "supplier.orderId": { $exists: true, $ne: null }, status: { $in: ["paid", "processing", "shipped"] } }).sort({ "supplier.syncedAt": 1 }).limit(limit).select("_id").lean();
  let ok = 0, failed = 0;
  for (const x of open) { try { await cjSyncOrder(String(x._id)); ok++; } catch { failed++; } }
  return { checked: open.length, ok, failed };
}

export async function cjAutoOrderOn() {
  const s = await Settings.findOne({ key: "global" }).select("cjAutoOrder").lean();
  return s?.cjAutoOrder !== false;
}
