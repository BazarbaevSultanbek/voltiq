import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { Product } from "@/models/Product";
import { CATEGORIES } from "@/lib/catalog";
import { locales, htmlLang } from "@/i18n/config";
import { siteUrl } from "@/lib/site";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  await db();
  const products = await Product.find({ active: true }).select("slug updatedAt").lean();
  const entry = (path: string, priority: number, lastModified?: Date): MetadataRoute.Sitemap =>
    locales.map((l) => ({
      url: `${siteUrl}/${l}${path}`, lastModified: lastModified ?? new Date(), changeFrequency: "daily", priority,
      alternates: { languages: Object.fromEntries(locales.map((x) => [htmlLang[x], `${siteUrl}/${x}${path}`])) },
    }));
  return [
    ...entry("", 1),
    ...entry("/search", 0.8),
    ...CATEGORIES.flatMap((c) => entry(`/search?cat=${c.slug}`, 0.8)),
    ...products.flatMap((p) => entry(`/p/${p.slug}`, 0.9, p.updatedAt as Date)),
    ...["about", "faq", "shipping", "returns", "contact", "privacy", "terms"].flatMap((s) => entry(`/info/${s}`, 0.3)),
  ];
}
