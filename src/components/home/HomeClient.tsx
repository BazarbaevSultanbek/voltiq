"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BadgePercent, CreditCard, Globe2, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { CATEGORIES } from "@/lib/catalog";
import { ProductCard, type CardProduct } from "../ProductCard";
import { Reveal } from "../Reveal";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Countdown } from "./Countdown";
import { Newsletter } from "./Newsletter";

function SectionHead({ title, sub, link, children }: { title: string; sub?: string; link?: string; children?: React.ReactNode }) {
  const { t, href } = useI18n();
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-black sm:text-4xl">{title}</h2>
        {sub && <p className="mt-2 text-muted">{sub}</p>}
      </div>
      <div className="flex items-center gap-4">
        {children}
        {link && <Link href={href(link)} className="group flex items-center gap-1 font-bold hover:text-volt">{t("home.viewAll")} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>}
      </div>
    </Reveal>
  );
}

export function HomeClient({ trending, deals, fresh, total }: { trending: CardProduct[]; deals: CardProduct[]; fresh: CardProduct[]; total: number }) {
  const { t, href } = useI18n();
  const bento = [
    { t: t("home.bentoA"), img: "/products/charger-white.svg", link: "/search?cat=chargers", cls: "md:col-span-2 md:row-span-2 bg-ink text-white", big: true },
    { t: t("home.bentoB"), img: "/products/keyboard-orange.svg", link: "/search?cat=keyboards", cls: "bg-lime" },
    { t: t("home.bentoC"), img: "/products/headphones-sand.svg", link: "/search?cat=audio", cls: "bg-[#e9e3ff]" },
    { t: t("home.bentoD"), img: "/products/laptopstand-gray.svg", link: "/search?group=pc", cls: "md:col-span-2 bg-[#ffe1d2]" },
  ];
  const why = [
    { i: BadgePercent, t: t("home.why1t"), d: t("home.why1d") },
    { i: Globe2, t: t("home.why2t"), d: t("home.why2d") },
    { i: CreditCard, t: t("home.why3t"), d: t("home.why3d") },
    { i: RotateCcw, t: t("home.why4t"), d: t("home.why4d") },
  ];

  return (
    <>
      <Hero productCount={total} />
      <Marquee />

      <section className="mx-auto mt-24 max-w-7xl px-4">
        <SectionHead title={t("home.shopBy")} />
        {(["phone", "pc"] as const).map((g) => (
          <div key={g} className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">{t(`home.${g}Title`)}</h3>
              <Link href={href(`/search?group=${g}`)} className="text-sm font-bold hover:text-volt">{t("home.viewAll")} →</Link>
            </div>
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
              {CATEGORIES.filter((c) => c.group === g).map((c, i) => (
                <motion.div key={c.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="snap-start">
                  <Link href={href(`/search?cat=${c.slug}`)} className="group block w-36 sm:w-44">
                    <div className="overflow-hidden rounded-[1.6rem] bg-cream transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_-20px_rgb(0_0_0/.35)]">
                      <img src={`/products/${c.art}-${c.color}.svg`} alt="" className="aspect-square w-full transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <p className="mt-3 text-center text-sm font-bold group-hover:text-volt">{t(`cat.${c.slug}`)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-16 grid max-w-7xl auto-rows-[220px] gap-4 px-4 md:grid-cols-4">
        {bento.map((b, i) => (
          <Reveal key={i} delay={i * 0.08} className={`group relative overflow-hidden rounded-[2rem] ${b.cls}`}>
            <Link href={href(b.link)} className="absolute inset-0 z-10" aria-label={b.t} />
            <p className={`relative z-[1] max-w-[58%] p-7 font-display font-black leading-tight ${b.big ? "text-4xl" : "text-xl"}`}>{b.t}</p>
            <span className="absolute bottom-6 left-7 z-[1] grid h-11 w-11 place-items-center rounded-full bg-volt text-white transition-transform group-hover:rotate-[-45deg]"><ArrowRight size={18} /></span>
            <img src={b.img} alt="" className={`absolute rounded-[1.5rem] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3 ${b.big ? "-bottom-16 -right-12 w-[62%]" : "-bottom-6 -right-6 w-44"}`} />
          </Reveal>
        ))}
      </section>

      {trending.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4">
          <SectionHead title={t("home.trending")} sub={t("home.trendingSub")} link="/search?sort=popular" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{trending.map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}</div>
        </section>
      )}

      {deals.length > 0 && (
        <section className="mt-24 bg-cream py-20">
          <div className="mx-auto max-w-7xl px-4">
            <SectionHead title={t("home.dealsTitle")} link="/search?deals=1">
              <div className="flex items-center gap-3"><span className="text-sm font-bold text-muted">{t("home.dealsSub")}</span><Countdown /></div>
            </SectionHead>
            <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4">
              {deals.map((p, i) => <div key={p._id} className="w-60 shrink-0 snap-start sm:w-64"><ProductCard p={p} index={i} /></div>)}
            </div>
          </div>
        </section>
      )}

      {fresh.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4">
          <SectionHead title={t("home.newIn")} link="/search?sort=new" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{fresh.map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}</div>
        </section>
      )}

      <section className="mx-auto mt-24 grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {why.map((w, i) => (
          <Reveal key={i} delay={i * 0.08} className="card p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-volt/10 text-volt"><w.i /></span>
            <p className="mt-4 font-display font-bold">{w.t}</p>
            <p className="mt-1.5 text-sm text-muted">{w.d}</p>
          </Reveal>
        ))}
      </section>

      <div className="mt-24"><Newsletter /></div>
    </>
  );
}
