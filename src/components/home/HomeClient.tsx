"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Bell, CreditCard, Globe2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { CATEGORIES, GROUPS } from "@/lib/catalog";
import { COUNTRIES } from "@/lib/shipping";
import { ProductCard, type CardProduct } from "../ProductCard";
import { Reveal } from "../Reveal";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";

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

export type CategoryShot = { slug: string; image: string; count: number };

const BENTO_STYLES = ["md:col-span-2 md:row-span-2 bg-night text-white", "bg-lime text-[#0d0d12]", "bg-[#e9e3ff] text-[#0d0d12]", "md:col-span-2 bg-[#ffe1d2] text-[#0d0d12]"];

export function HomeClient({ trending, deals, fresh, total, cats }: { trending: CardProduct[]; deals: CardProduct[]; fresh: CardProduct[]; total: number; cats: CategoryShot[] }) {
  const { t, href } = useI18n();
  const shot = new Map(cats.map((c) => [c.slug, c]));
  // Feature tiles: the 4 categories with the most products, each shown with a real product photo.
  const bento = [...cats].sort((a, b) => b.count - a.count).slice(0, 4).map((c, i) => ({ slug: c.slug, img: c.image, cls: BENTO_STYLES[i], big: i === 0 }));
  const heroShots = trending.filter((p) => p.images?.[0]).slice(0, 5).map((p) => ({ src: p.images[0], slug: p.slug, title: p.title }));
  const why = [
    { i: Globe2, t: t("home.why2t", { n: COUNTRIES.length }), d: t("home.why2d") },
    { i: CreditCard, t: t("home.why3t"), d: t("home.why3d") },
    { i: Bell, t: t("home.why4t"), d: t("home.why4d") },
  ];

  return (
    <>
      <Hero productCount={total} shots={heroShots} />
      <Marquee />

      {cats.length > 0 && <section className="mx-auto mt-24 max-w-7xl px-4">
        <SectionHead title={t("home.shopBy")} />
        {GROUPS.filter((g) => CATEGORIES.some((c) => c.group === g && shot.has(c.slug))).map((g) => (
          <div key={g} className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">{t(`home.${g}Title`)}</h3>
              <Link href={href(`/search?group=${g}`)} className="text-sm font-bold hover:text-volt">{t("home.viewAll")} →</Link>
            </div>
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
              {CATEGORIES.filter((c) => c.group === g && shot.has(c.slug)).map((c, i) => (
                <motion.div key={c.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="snap-start">
                  <Link href={href(`/search?cat=${c.slug}`)} className="group block w-36 sm:w-44">
                    <div className="overflow-hidden rounded-[1.6rem] bg-white transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_-20px_rgb(0_0_0/.35)]">
                      <img src={shot.get(c.slug)!.image} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <p className="mt-3 text-center text-sm font-bold group-hover:text-volt">{t(`cat.${c.slug}`)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </section>}

      {bento.length === 4 && <section className="mx-auto mt-16 grid max-w-7xl auto-rows-[220px] gap-4 px-4 md:grid-cols-4">
        {bento.map((b, i) => (
          <Reveal key={b.slug} delay={i * 0.08} className={`group relative overflow-hidden rounded-[2rem] ${b.cls}`}>
            <Link href={href(`/search?cat=${b.slug}`)} className="absolute inset-0 z-10" aria-label={t(`cat.${b.slug}`)} />
            <p className={`relative z-[1] max-w-[55%] p-7 font-display font-black leading-tight ${b.big ? "text-4xl" : "text-xl"}`}>{t(`cat.${b.slug}`)}</p>
            <span className="absolute bottom-6 left-7 z-[1] grid h-11 w-11 place-items-center rounded-full bg-volt text-white transition-transform group-hover:rotate-[-45deg]"><ArrowRight size={18} /></span>
            <img src={b.img} alt="" loading="lazy" className={`absolute aspect-square rounded-[1.5rem] bg-white object-cover shadow-[0_20px_40px_-15px_rgb(0_0_0/.45)] transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2 ${b.big ? "bottom-8 right-8 w-[52%]" : "bottom-5 right-5 w-32"}`} />
          </Reveal>
        ))}
      </section>}

      {trending.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4">
          <SectionHead title={t("home.trending")} link="/search?sort=popular" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{trending.map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}</div>
        </section>
      )}

      {deals.length > 0 && (
        <section className="mt-24 bg-cream py-20">
          <div className="mx-auto max-w-7xl px-4">
            <SectionHead title={t("home.dealsTitle")} link="/search?deals=1" />
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

      <section className="mx-auto my-24 grid max-w-7xl gap-4 px-4 sm:grid-cols-3">
        {why.map((w, i) => (
          <Reveal key={i} delay={i * 0.08} className="card p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-volt/10 text-volt"><w.i /></span>
            <p className="mt-4 font-display font-bold">{w.t}</p>
            <p className="mt-1.5 text-sm text-muted">{w.d}</p>
          </Reveal>
        ))}
      </section>
    </>
  );
}
