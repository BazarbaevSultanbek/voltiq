import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, plain } from "@/lib/db";
import { Product } from "@/models/Product";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { ProductView, type FullProduct } from "@/components/ProductView";
import type { CardProduct } from "@/components/ProductCard";

const HIDE = "-costPrice -supplierCompareAt -marginPct -sourceUrl";

async function load(slug: string) {
  await db();
  return Product.findOne({ slug, active: true }).select(HIDE).lean();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const p = await load(slug);
  if (!p) return {};
  const img = p.images[0]?.startsWith("http") ? p.images[0] : `${siteUrl}${p.images[0]}`;
  return {
    title: `${p.title} — $${p.price.toFixed(2)}`,
    description: p.description.slice(0, 158),
    alternates: { canonical: `/${locale}/p/${slug}` },
    openGraph: { title: p.title, description: p.description.slice(0, 158), images: [{ url: img }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const p = await load(slug);
  if (!p) notFound();
  const [related, settings] = await Promise.all([
    Product.find({ active: true, category: p.category, _id: { $ne: p._id } }).sort({ sold: -1, featured: -1 }).limit(4).select(HIDE).lean(),
    getSettings(),
  ]);
  const extra = related.length < 4 ? await Product.find({ active: true, group: p.group, category: { $ne: p.category } }).sort({ featured: -1 }).limit(4 - related.length).select(HIDE).lean() : [];
  const abs = (u: string) => (u.startsWith("http") ? u : `${siteUrl}${u}`);
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.title, description: p.description,
    image: p.images.map(abs), sku: String(p._id), brand: { "@type": "Brand", name: "VOLTIQ" }, category: p.category,
    offers: {
      "@type": "Offer", url: `${siteUrl}/${locale}/p/${p.slug}`, priceCurrency: "USD", price: p.price.toFixed(2),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition",
      shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" }, deliveryTime: { "@type": "ShippingDeliveryTime", transitTime: { "@type": "QuantitativeValue", minValue: 6, maxValue: 18, unitCode: "DAY" } } },
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 30 },
    },
    ...(p.rating && p.reviewsCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewsCount } } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <ProductView p={plain<FullProduct>(p)} related={plain<CardProduct[]>([...related, ...extra])} freeOver={settings.freeShippingOver} />
    </>
  );
}
