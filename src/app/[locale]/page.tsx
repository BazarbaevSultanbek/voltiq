import { db, plain } from "@/lib/db";
import { Product } from "@/models/Product";
import { HomeClient, type CategoryShot } from "@/components/home/HomeClient";
import type { CardProduct } from "@/components/ProductCard";
import { localize } from "@/lib/localize";

const FIELDS = "slug title price compareAt images colors rating reviewsCount category sold createdAt featured";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const F = `${FIELDS} tr.${locale}.title`;
  await db();
  const [trending, deals, fresh, total, cats] = await Promise.all([
    Product.find({ active: true }).sort({ sold: -1, cartAdds: -1, featured: -1, views: -1 }).limit(8).select(F).lean(),
    Product.find({ active: true, compareAt: { $gt: 0 } }).sort({ featured: -1, sold: -1 }).limit(12).select(F).lean(),
    Product.find({ active: true }).sort({ createdAt: -1, _id: -1 }).skip(8).limit(8).select(F).lean(),
    Product.countDocuments({ active: true }),
    // One real product photo per category (its most popular item) + how many products it has.
    Product.aggregate<CategoryShot>([
      { $match: { active: true, "images.0": { $exists: true } } },
      { $sort: { featured: -1, sold: -1, cartAdds: -1, views: -1, createdAt: -1 } },
      { $group: { _id: "$category", image: { $first: { $arrayElemAt: ["$images", 0] } }, count: { $sum: 1 } } },
      { $project: { _id: 0, slug: "$_id", image: 1, count: 1 } },
    ]),
  ]);
  const L = (list: typeof trending) => plain<CardProduct[]>(list.map((p) => localize(p, locale)));
  return <HomeClient trending={L(trending)} deals={L(deals)} fresh={L(fresh)} total={total} cats={cats} />;
}
