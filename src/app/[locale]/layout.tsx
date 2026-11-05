import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import "../globals.css";
import { isLocale, locales, htmlLang, type Locale } from "@/i18n/config";
import { getDict } from "@/i18n/dict";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSettings } from "@/lib/settings";

import { siteUrl } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: d.meta.title, template: "%s · VOLTIQ" },
    description: d.meta.description,
    applicationName: "VOLTIQ",
    keywords: ["phone accessories", "pc accessories", "chargers", "power bank", "earbuds", "usb-c hub", "mechanical keyboard", "gaming mouse", "magsafe", "buy online"],
    alternates: { canonical: `/${locale}`, languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}`])) },
    openGraph: { type: "website", siteName: "VOLTIQ", title: d.meta.title, description: d.meta.description, locale: htmlLang[locale] },
    twitter: { card: "summary_large_image", title: d.meta.title, description: d.meta.description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#ff5b14", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  await connection();
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDict(locale as Locale);
  const { freeShippingOver } = await getSettings();
  const orgLd = {
    "@context": "https://schema.org", "@type": "OnlineStore", name: "VOLTIQ", url: siteUrl,
    logo: `${siteUrl}/icon.svg`, description: dict.meta.description,
    potentialAction: { "@type": "SearchAction", target: `${siteUrl}/${locale}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };
  return (
    <html lang={htmlLang[locale as Locale]}>
      <body className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <Providers locale={locale as Locale} dict={dict}>
          <Header freeOver={freeShippingOver} />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
