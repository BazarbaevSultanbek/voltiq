import { searchProducts } from "@/lib/search";
import { db } from "@/lib/db";
import { SearchStat } from "@/models/SearchStat";
import { json } from "@/lib/api";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q.trim()) {
    await db();
    const trending = await SearchStat.find({ lastResults: { $gt: 0 } }).sort({ count: -1 }).limit(8).lean();
    return json({ items: [], trending: trending.map((t) => t.term) });
  }
  const r = await searchProducts({ q, limit: 6 });
  return json({ items: r.items.map((p) => ({ _id: p._id, slug: p.slug, title: p.title, price: p.price, image: p.images[0], category: p.category })), total: r.total });
}
