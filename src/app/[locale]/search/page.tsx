import type { Metadata } from "next";
import { searchProducts } from "@/lib/search";
import { plain } from "@/lib/db";
import { getDict, translate } from "@/i18n/dict";
import { isLocale, type Locale } from "@/i18n/config";
import { SearchClient } from "@/components/SearchClient";
import type { CardProduct } from "@/components/ProductCard";

const PER_PAGE = 24;

type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const d = await getDict((isLocale(locale) ? locale : "en") as Locale);
  const title = sp.q ? translate(d, "search.resultsFor", { q: sp.q }) : sp.cat ? translate(d, `cat.${sp.cat}`) : sp.group ? translate(d, `cat.${sp.group}`) : d.meta.searchTitle;
  const qs = sp.cat ? `?cat=${sp.cat}` : sp.group ? `?group=${sp.group}` : "";
  return { title, alternates: { canonical: `/${locale}/search${qs}` }, robots: sp.q ? { index: false, follow: true } : undefined };
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const n = (v?: string) => (v && !isNaN(Number(v)) ? Number(v) : undefined);
  const r = await searchProducts({
    q: sp.q, cat: sp.cat, group: sp.group, min: n(sp.min), max: n(sp.max), deals: sp.deals === "1",
    sort: (sp.sort as never) || "relevance", limit: PER_PAGE, page: n(sp.page), locale,
  });
  return <SearchClient items={plain<CardProduct[]>(r.items)} total={r.total} page={r.page} pages={r.pages} />;
}
