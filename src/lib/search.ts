import "server-only";
import { db } from "./db";
import { Product } from "@/models/Product";
import { SearchStat } from "@/models/SearchStat";
import { CATEGORIES } from "./catalog";
import en from "@/i18n/messages/en.json";
import ru from "@/i18n/messages/ru.json";
import zh from "@/i18n/messages/zh.json";
import es from "@/i18n/messages/es.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

const DICTS = [en, ru, zh, es, fr, pt];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const normalize = (q: string) => q.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 80);

/** Match a query against category names in every language, so "наушники" or "耳机" find Audio. */
function categoriesFor(q: string) {
  const out = new Set<string>();
  if (q.length < 2) return out;
  for (const d of DICTS) {
    for (const c of CATEGORIES) {
      const name = ((d.cat as Record<string, string>)[c.slug] || "").toLowerCase();
      if (name && (name.includes(q) || q.includes(name.split(" ")[0]))) out.add(c.slug);
    }
  }
  return out;
}

export type SearchParams = {
  q?: string; cat?: string; group?: string; min?: number; max?: number; deals?: boolean;
  sort?: "relevance" | "popular" | "new" | "price_asc" | "price_desc"; limit?: number; page?: number;
};

export async function searchProducts(p: SearchParams) {
  await db();
  const q = normalize(p.q || "");
  const filter: Record<string, unknown> = { active: true };
  if (p.cat) filter.category = p.cat;
  if (p.group === "phone" || p.group === "pc") filter.group = p.group;
  if (p.min != null || p.max != null) filter.price = { ...(p.min != null ? { $gte: p.min } : {}), ...(p.max != null ? { $lte: p.max } : {}) };
  if (p.deals) filter.compareAt = { $gt: 0 };

  const words = q.split(" ").filter((w) => w.length > 0).slice(0, 6);
  const cats = categoriesFor(q);
  if (words.length) {
    const textMatch = { $and: words.map((w) => ({ $or: [{ title: { $regex: esc(w), $options: "i" } }, { tags: { $regex: esc(w), $options: "i" } }, { category: { $regex: esc(w), $options: "i" } }] })) };
    filter.$or = cats.size ? [textMatch, { category: { $in: [...cats] } }] : [textMatch];
  }
  let items = await Product.find(filter).select("-costPrice -supplierCompareAt -marginPct -sourceUrl -sourceId -variants").limit(2000).lean();

  const pop = (x: (typeof items)[number]) => x.sold * 5 + x.cartAdds * 2 + x.views * 0.2 + x.searchHits * 0.5;
  const score = (x: (typeof items)[number]) => {
    let s = 0; const t = x.title.toLowerCase();
    if (t.includes(q)) s += 20;
    for (const w of words) { if (t.includes(w)) s += 6; if (x.tags.some((g) => g.includes(w))) s += 3; }
    if (cats.has(x.category)) s += 4;
    return s + Math.log1p(pop(x)) + (x.featured ? 1 : 0);
  };
  const sorters: Record<string, (a: (typeof items)[number], b: (typeof items)[number]) => number> = {
    relevance: (a, b) => (words.length ? score(b) - score(a) : pop(b) - pop(a) || Number(b.featured) - Number(a.featured)),
    popular: (a, b) => pop(b) - pop(a),
    new: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
  };
  items = items.sort(sorters[p.sort || "relevance"] || sorters.relevance);
  const limit = p.limit ?? 200;
  const pages = Math.max(1, Math.ceil(items.length / limit));
  const page = Math.min(Math.max(1, Math.floor(p.page ?? 1)), pages);
  return { q, items: items.slice((page - 1) * limit, page * limit), total: items.length, page, pages };
}

/** Count what people search for — shown in the admin "Interests" tab. */
export async function logSearch(raw: string, results: number, topIds: string[] = []) {
  const term = normalize(raw);
  if (term.length < 2) return;
  await db();
  await SearchStat.updateOne(
    { term },
    { $inc: { count: 1, zeroResults: results === 0 ? 1 : 0 }, $set: { lastAt: new Date(), lastResults: results } },
    { upsert: true },
  );
  if (topIds.length) await Product.updateMany({ _id: { $in: topIds.slice(0, 5) } }, { $inc: { searchHits: 1 } });
}
