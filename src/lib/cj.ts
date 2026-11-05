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

// ───────────────────────── Automatic import ─────────────────────────
/**
 * What to search CJ for in each category, and how to tell whether a result really
 * belongs there. Only products whose English title matches `match` (and not
 * `exclude`) are imported — this is what keeps "mouse" from bringing in pet toys
 * or "keyboard" from bringing in gloves.
 */
type Rule = { keywords: string[]; match: RegExp; exclude?: RegExp };
const JUNK = /\b(sticker|decal|toy|plush|costume|glove|sock|shirt|t-shirt|hoodie|necklace|earring|keychain|key chain|pendant|poster|pillow|cushion|dog|cat|pet|kid'?s toy)s?\b/i;
export const CJ_RULES: Record<string, Rule> = {
  chargers: { keywords: ["gan fast charger usb c", "wireless charger", "car charger usb c", "pd charger 20w"], match: /\b(charger|charging (station|stand|pad|dock|block|head|adapter)|power adapter)\b/i, exclude: /\b(cable|case|cover|power bank)\b/i },
  cables: { keywords: ["usb c cable fast charging", "lightning cable", "braided type c cable", "magnetic charging cable"], match: /\b(cable|cord|wire|line)\b/i, exclude: /\b(organi[sz]er|clip|protector|tie|winder)\b/i },
  "power-banks": { keywords: ["power bank", "magnetic power bank", "portable charger 20000mah"], match: /\b(power ?bank|battery pack|portable charger)\b/i, exclude: /\b(case|cover)\b/i },
  cases: { keywords: ["iphone case", "samsung galaxy case", "magsafe phone case", "shockproof phone case"], match: /\b(phone case|case|cover|bumper)\b/i, exclude: /\b(suitcase|pencil case|storage case|carrying case|watch|airpods?|earbuds?|tablet|ipad|laptop)\b/i },
  "screen-protectors": { keywords: ["tempered glass screen protector", "privacy screen protector", "camera lens protector"], match: /\b(screen protector|tempered glass|protective (film|glass)|glass film|hydrogel|lens protector)\b/i },
  audio: { keywords: ["wireless earbuds", "bluetooth headphones", "tws earphones", "bluetooth speaker"], match: /\b(earbuds?|earphones?|headphones?|headset|speaker|tws|in-ear|earpods?)\b/i, exclude: /\b(case|cover|cushion|ear ?pads?|tips|hook|holder)\b/i },
  mounts: { keywords: ["car phone holder", "magnetic car mount", "desktop phone stand", "selfie stick tripod"], match: /\b(holder|mount|stand|tripod|selfie stick|gimbal|bracket)\b/i, exclude: /\b(laptop|notebook|monitor|cup|bottle|toothbrush|plant|flower|headphone)\b/i },
  wearables: { keywords: ["apple watch band", "smart watch strap", "smart watch", "smart ring"], match: /\b(watch|band|strap|smart ?ring|fitness tracker|bracelet)\b/i, exclude: /\b(hair|rubber band|resistance|wedding|headband|bandage)\b/i },
  keyboards: { keywords: ["mechanical keyboard", "wireless keyboard", "bluetooth keyboard", "keyboard mouse combo"], match: /\bkeyboards?\b/i, exclude: /\b(cover|skin|film|cleaner|cleaning|brush|wrist rest|piano|musical|electronic organ)\b/i },
  mice: { keywords: ["wireless mouse", "gaming mouse", "bluetooth mouse", "ergonomic mouse"], match: /\b(computer|wireless|gaming|optical|bluetooth|ergonomic|silent|usb|vertical|rechargeable)\b[^,|]*\b(mouse|mice)\b|\b(mouse|mice)\b[^,|]*\b(wireless|gaming|optical|bluetooth|dpi|usb|computer|laptop|pc)\b/i, exclude: /\b(pads?|mats?|traps?|bait|repell\w*|rats?|rodents?|pests?|plush|animals?|mickey|minnie|jerry|cartoon|toys?|pets?|cats?)\b/i },
  mousepads: { keywords: ["mouse pad", "gaming mouse pad large", "desk mat"], match: /\b(mouse ?pad|mouse ?mat|desk ?(mat|pad)|gaming pad)\b/i },
  webcams: { keywords: ["webcam 1080p", "usb microphone", "wireless lavalier microphone", "streaming microphone"], match: /\b(webcam|web cam|pc camera|usb camera|microphone|mic|lavalier|lapel)\b/i, exclude: /\b(security|surveillance|cctv|spy|doorbell|baby monitor|dash ?cam|stand only|windscreen|foam)\b/i },
  hubs: { keywords: ["usb c hub", "usb 3.0 hub", "usb c to hdmi adapter", "docking station"], match: /\b(hub|dock|docking station|adapter|converter|splitter|dongle)\b/i, exclude: /\b(power adapter|charger|travel adapter|plug adapter|wall)\b/i },
  storage: { keywords: ["portable ssd", "usb flash drive", "micro sd card", "ssd enclosure"], match: /\b(ssd|flash drive|usb drive|pen ?drive|thumb drive|u disk|memory card|sd card|tf card|hard (drive|disk)|enclosure|nvme)\b/i, exclude: /\b(reader only|case for)\b/i },
  stands: { keywords: ["laptop stand", "monitor stand riser", "adjustable laptop holder"], match: /\b(laptop|notebook|monitor|macbook|computer)\b[^,|]*\b(stand|holder|riser|arm|bracket|tray)\b|\b(stand|holder|riser|arm|bracket)\b[^,|]*\b(laptop|notebook|monitor|macbook|computer)\b/i, exclude: /\b(bag|sleeve|case|sticker)\b/i },
  gaming: { keywords: ["wireless game controller", "gamepad", "gaming headset", "mobile game trigger"], match: /\b(controller|gamepad|game ?pad|joystick|gaming|game trigger|handle grip)\b/i, exclude: /\b(chair|desk|shirt|mouse pad|keyboard|mouse)\b/i },
  lighting: { keywords: ["ring light", "monitor light bar", "rgb led light", "led desk lamp"], match: /\b(light|lamp|led|lighting)\b/i, exclude: /\b(bulb socket|lighter|flashlight|torch|headlight|tail ?light|bicycle|bike|car light|christmas)\b/i },
};

export const fitsCategory = (title: string, category: string) => {
  const r = CJ_RULES[category];
  return !!r && r.match.test(title) && !r.exclude?.test(title) && !JUNK.test(title);
};

/**
 * Fill one category with up to `count` new, on-topic CJ products using the
 * category's own search words. Products already in the store are skipped, so
 * running it again brings in different ones. Stops early to stay inside the
 * serverless time limit (CJ allows 1 request per second).
 */
export async function cjAutoImport(category: string, count: number, budgetMs = 48_000) {
  if (!cjEnabled()) throw new Error("Add CJ_API_KEY in Vercel first.");
  const rule = CJ_RULES[category];
  if (!rule) throw new Error("Unknown category");
  const t0 = Date.now();
  const late = () => Date.now() - t0 > budgetMs;
  await db();
  const { marginPct } = await getSettings();
  const have = new Set((await Product.find({ source: "cj" }).select("sourceId").lean()).map((p) => p.sourceId));
  let created = 0, rejected = 0, failed = 0;
  outer: for (const page of [1, 2, 3, 4, 5]) {
    for (const kw of rule.keywords) {
      if (created >= count || late()) break outer;
      const { items } = await cjSearch(kw, 20, page);
      for (const it of items) {
        if (created >= count || late()) break outer;
        if (have.has(it.id)) continue;
        have.add(it.id);
        if (!fitsCategory(it.nameEn || "", category)) { rejected++; continue; }
        try { await cjImportOne(it.id, category, marginPct); created++; } catch { failed++; }
      }
    }
  }
  return { category, created, rejected, failed, timedOut: late() };
}

/** Switch off CJ products whose title doesn't fit their category (e.g. earlier keyword mistakes). */
export async function cjHideOffTopic() {
  await db();
  const list = await Product.find({ source: "cj", active: true }).select("title category").lean();
  const bad = list.filter((p) => !fitsCategory(p.title, p.category)).map((p) => p._id);
  if (bad.length) await Product.updateMany({ _id: { $in: bad } }, { $set: { active: false } });
  return { checked: list.length, hidden: bad.length };
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
