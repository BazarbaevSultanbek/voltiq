import { db, plain } from "@/lib/db";
import { Product } from "@/models/Product";
import { HomeClient } from "@/components/home/HomeClient";
import type { CardProduct } from "@/components/ProductCard";

const FIELDS = "slug title price compareAt images colors rating reviewsCount category sold createdAt featured";

export default async function Home() {
  await db();
  const [trending, deals, fresh, total] = await Promise.all([
    Product.find({ active: true }).sort({ sold: -1, cartAdds: -1, featured: -1, views: -1 }).limit(8).select(FIELDS).lean(),
    Product.find({ active: true, compareAt: { $gt: 0 } }).sort({ featured: -1, sold: -1 }).limit(12).select(FIELDS).lean(),
    Product.find({ active: true }).sort({ createdAt: -1, _id: -1 }).skip(8).limit(8).select(FIELDS).lean(),
    Product.countDocuments({ active: true }),
  ]);
  return <HomeClient trending={plain<CardProduct[]>(trending)} deals={plain<CardProduct[]>(deals)} fresh={plain<CardProduct[]>(fresh)} total={total} />;
}
