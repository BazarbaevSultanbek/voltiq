import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { Product } from "@/models/Product";
import { CATEGORIES } from "./catalog";
import { priceProduct } from "./pricing";
import { getSettings } from "./settings";

/** AliExpress Open Platform — Affiliate API (aliexpress.affiliate.product.query). */
export const aliEnabled = () => !!(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);

function sign(params: Record<string, string>, secret: string) {
  const base = Object.keys(params).sort().map((k) => k + params[k]).join("");
  return crypto.createHmac("sha256", secret).update(base, "utf8").digest("hex").toUpperCase();
}

type AliProduct = {
  product_id: number | string; product_title: string; product_main_image_url: string;
  product_small_image_urls?: { string?: string[] }; target_sale_price: string; target_original_price?: string;
  evaluate_rate?: string; lastest_volume?: number; promotion_link?: string; product_detail_url?: string;
};

export async function aliSearch(keywords: string, page = 1, pageSize = 20, shipTo = "US"): Promise<AliProduct[]> {
  const params: Record<string, string> = {
    app_key: process.env.ALIEXPRESS_APP_KEY!, method: "aliexpress.affiliate.product.query",
    sign_method: "sha256", timestamp: String(Date.now()), v: "2.0", format: "json",
    keywords, page_no: String(page), page_size: String(pageSize), target_currency: "USD", target_language: "EN",
    ship_to_country: shipTo, sort: "LAST_VOLUME_DESC",
  };
  if (process.env.ALIEXPRESS_TRACKING_ID) params.tracking_id = process.env.ALIEXPRESS_TRACKING_ID;
  params.sign = sign(params, process.env.ALIEXPRESS_APP_SECRET!);
  const res = await fetch("https://api-sg.aliexpress.com/sync", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(params), cache: "no-store",
  });
  const data = await res.json();
  if (data.error_response) throw new Error(`AliExpress: ${data.error_response.msg || data.error_response.code}`);
  const result = data?.aliexpress_affiliate_product_query_response?.resp_result?.result;
  return result?.products?.product ?? [];
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);

export async function aliImport(keywords: string, category: string, count = 20) {
  if (!aliEnabled()) throw new Error("Add ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET first.");
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) throw new Error("Unknown category");
  await db();
  const { marginPct } = await getSettings();
  const list = await aliSearch(keywords, 1, Math.min(50, count));
  let created = 0, updated = 0;
  for (const p of list) {
    const cost = Number(p.target_sale_price) || 0;
    if (!cost) continue;
    const was = Number(p.target_original_price) || 0;
    const { price, compareAt } = priceProduct({ costPrice: cost, supplierCompareAt: was }, marginPct);
    const rate = p.evaluate_rate ? Number(String(p.evaluate_rate).replace("%", "")) : 0;
    const images = [p.product_main_image_url, ...(p.product_small_image_urls?.string ?? [])].filter(Boolean).slice(0, 6);
    const doc = {
      title: p.product_title.slice(0, 140), category, group: cat.group, costPrice: cost, supplierCompareAt: was,
      price, compareAt, images, source: "aliexpress" as const, sourceId: String(p.product_id),
      sourceUrl: p.promotion_link || p.product_detail_url, rating: rate ? Math.round((rate / 20) * 10) / 10 : null,
      tags: keywords.toLowerCase().split(/\s+/),
    };
    const exists = await Product.findOne({ source: "aliexpress", sourceId: doc.sourceId });
    if (exists) { await Product.updateOne({ _id: exists._id }, { $set: doc }); updated++; }
    else { await Product.create({ ...doc, slug: `${slugify(doc.title)}-${String(p.product_id).slice(-5)}`, description: doc.title, stock: 999 }); created++; }
  }
  return { created, updated, found: list.length };
}
