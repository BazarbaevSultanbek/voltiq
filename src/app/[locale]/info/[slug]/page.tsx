import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict } from "@/i18n/dict";
import { isLocale, type Locale } from "@/i18n/config";

const SLUGS = ["about", "contact", "faq", "shipping", "returns", "privacy", "terms"] as const;
type Slug = (typeof SLUGS)[number];

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as Slug) || !isLocale(locale)) return {};
  const d = await getDict(locale);
  return { title: d.pages[slug as Slug].title, alternates: { canonical: `/${locale}/info/${slug}` } };
}

export default async function InfoPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as Slug) || !isLocale(locale)) notFound();
  const d = await getDict(locale as Locale);
  const page = d.pages[slug as Slug] as Record<string, string>;
  const faq = slug === "faq" ? [1, 2, 3, 4, 5].map((i) => ({ q: page[`q${i}`], a: page[`a${i}`] })) : [];
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-12">
      {faq.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />}
      <h1 className="font-display text-4xl font-black sm:text-5xl">{page.title}</h1>
      {page.body && <p className="mt-6 text-lg leading-relaxed text-muted">{page.body}</p>}
      {slug === "contact" && <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@voltiq.store"}`} className="btn btn-primary mt-8">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@voltiq.store"}</a>}
      {faq.length > 0 && (
        <div className="mt-8 divide-y divide-line rounded-[2rem] bg-white ring-1 ring-line">
          {faq.map((f, i) => (
            <details key={i} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display font-bold">{f.q}<span className="text-2xl text-volt transition-transform group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
