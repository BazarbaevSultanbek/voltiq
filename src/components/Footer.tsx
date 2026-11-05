"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { CATEGORIES } from "@/lib/catalog";
import { Logo } from "./Logo";
import { CardBrands } from "./CardBrands";

export function Footer() {
  const { t, href } = useI18n();
  const col = (title: string, links: [string, string][]) => (
    <div>
      <p className="mb-4 font-display text-sm font-bold text-white">{title}</p>
      <ul className="space-y-2.5">{links.map(([l, h]) => <li key={h}><Link href={href(h)} className="text-sm text-white/60 transition hover:text-lime">{l}</Link></li>)}</ul>
    </div>
  );
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white grain">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-volt/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm text-white/60">{t("footer.tag")}</p>
            <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-white/40">{t("footer.payments")}</p>
            <CardBrands />
          </div>
          {col(t("footer.shop"), CATEGORIES.slice(0, 6).map((c) => [t(`cat.${c.slug}`), `/search?cat=${c.slug}`]))}
          {col(t("footer.help"), [[t("footer.faq"), "/info/faq"], [t("footer.shipping"), "/info/shipping"], [t("footer.returns"), "/info/returns"], [t("footer.contact"), "/info/contact"]])}
          {col(t("footer.company"), [[t("footer.about"), "/info/about"], [t("footer.privacy"), "/info/privacy"], [t("footer.terms"), "/info/terms"]])}
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} VOLTIQ. {t("footer.rights")}</p>
        </div>
        <p aria-hidden className="pointer-events-none mt-6 select-none font-display text-[18vw] font-black leading-none tracking-tighter text-white/[.04]">VOLTIQ</p>
      </div>
    </footer>
  );
}
