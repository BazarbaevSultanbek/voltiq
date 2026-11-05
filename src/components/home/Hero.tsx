"use client";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { COUNTRIES } from "@/lib/shipping";

/** Where each real product photo sits in the hero collage. */
const SLOTS = [
  { cls: "left-[2%] top-[6%] w-40 lg:w-52", r: -6, d: 0.2, depth: 30 },
  { cls: "right-[0%] top-[0%] w-44 lg:w-56", r: 5, d: 0.35, depth: -24 },
  { cls: "left-[34%] top-[30%] z-[2] w-44 lg:w-56", r: 0, d: 0.5, depth: 14 },
  { cls: "left-[10%] bottom-[2%] w-36 lg:w-44", r: 7, d: 0.65, depth: 40 },
  { cls: "right-[6%] bottom-[0%] w-40 lg:w-48", r: -5, d: 0.8, depth: -36 },
];
type Shot = { src: string; slug: string; title: string };

export function Hero({ productCount, shots }: { productCount: number; shots: Shot[] }) {
  const { t, href } = useI18n();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }), sy = useSpring(my, { stiffness: 60, damping: 18 });
  const words = [t("home.heroA"), t("home.heroB")];

  return (
    <section className="relative overflow-hidden bg-night text-white grain"
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}>
      <motion.div aria-hidden className="absolute -left-32 top-10 h-[520px] w-[520px] rounded-full bg-volt/40 blur-[120px]" animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="absolute -right-20 bottom-0 h-[420px] w-[420px] rounded-full bg-berry/30 blur-[120px]" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5.6rem)] font-black leading-[0.95]">
            {words.map((w, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <motion.span className="block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.2, 0.9, 0.1, 1] }}>{w}</motion.span>
              </span>
            ))}
            <span className="block overflow-hidden pb-2">
              <motion.span className="block text-gradient" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.36, ease: [0.2, 0.9, 0.1, 1] }}>{t("home.heroC")}</motion.span>
            </span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 max-w-lg text-lg text-white/70">{t("home.heroSub")}</motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-9 flex flex-wrap gap-3">
            <Link href={href("/search")} className="btn btn-primary px-7 py-4 text-base">{t("home.ctaShop")} <ArrowRight size={18} /></Link>
            <Link href={href("/search?deals=1")} className="btn border border-white/20 bg-white/5 px-7 py-4 text-base text-white backdrop-blur hover:bg-white/15">{t("home.ctaDeals")}</Link>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {[[String(productCount), t("home.stat1")], [String(COUNTRIES.length), t("home.stat2")], [<ShieldCheck key="s" className="text-lime" size={28} />, t("home.stat3")]].map(([v, l], i) => (
              <div key={i}><dt className="font-display text-2xl font-black">{v}</dt><dd className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/50">{l}</dd></div>
            ))}
          </motion.dl>
        </div>

        <div className="relative h-[380px] sm:h-[460px] lg:h-[540px]">
          <motion.div aria-hidden className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
            animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}>
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full bg-lime shadow-[0_0_20px_4px_#c8f43c]" />
          </motion.div>
          {shots.slice(0, SLOTS.length).map((p, i) => <Floater key={p.slug} f={SLOTS[i]} shot={p} href={href(`/p/${p.slug}`)} sx={sx} sy={sy} />)}
        </div>
      </div>
    </section>
  );
}

function Floater({ f, shot, href, sx, sy }: { f: (typeof SLOTS)[number]; shot: Shot; href: string; sx: ReturnType<typeof useSpring>; sy: ReturnType<typeof useSpring> }) {
  const x = useTransform(sx, (v: number) => v * f.depth);
  const y = useTransform(sy, (v: number) => v * f.depth);
  return (
    <motion.div className={`absolute ${f.cls}`} style={{ x, y }} initial={{ opacity: 0, scale: 0.6, rotate: f.r * 3 }} animate={{ opacity: 1, scale: 1, rotate: f.r }} transition={{ delay: f.d, type: "spring", stiffness: 90, damping: 14 }}>
      <Link href={href} title={shot.title} className="block">
        <img src={shot.src} alt={shot.title} className="aspect-square w-full animate-float rounded-[2rem] bg-white object-cover shadow-[0_30px_60px_-20px_rgb(0_0_0/.6)] ring-4 ring-white/10" style={{ animationDelay: `${f.d * 2}s`, ["--r" as string]: `${f.r}deg` }} />
      </Link>
    </motion.div>
  );
}
