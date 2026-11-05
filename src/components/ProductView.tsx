"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronRight, Minus, Plus, ShieldCheck, Star, Truck, RotateCcw, MapPin, Zap } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useCart, useLocation } from "@/lib/store";
import { quote, countryName } from "@/lib/shipping";
import { ProductCard, type CardProduct } from "./ProductCard";
import { CardBrands } from "./CardBrands";
import { useHydrated } from "./useHydrated";
import { cn } from "@/lib/cn";

export type FullProduct = CardProduct & { description: string; specs: { k: string; v: string }[]; stock: number; group: string };

export function ProductView({ p, related, freeOver }: { p: FullProduct; related: CardProduct[]; freeOver: number }) {
  const { t, href, price, locale } = useI18n();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const { place, setOpen } = useLocation();
  const hydrated = useHydrated();
  const [ci, setCi] = useState(0);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [open, setOpenSec] = useState<string | null>("description");
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetch("/api/products/interest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p._id, type: "view" }) }).catch(() => {});
  }, [p._id]);

  const images = p.colors && p.colors.length > 1 ? p.images : p.images;
  const shown = images[p.colors && p.colors.length > 1 ? ci : img] || images[0];
  const off = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const color = p.colors?.[ci]?.name || "";
  const quotes = hydrated && place ? quote(place.country, qty, p.price * qty, freeOver) : null;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { month: "short", day: "numeric" });

  const doAdd = (buy = false) => {
    add({ id: p._id, slug: p.slug, title: p.title, image: shown, price: p.price, color, compareAt: p.compareAt }, qty);
    fetch("/api/products/interest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p._id, type: "cart" }) }).catch(() => {});
    if (buy) return router.push(href("/checkout"));
    setAdded(true); setTimeout(() => setAdded(false), 1600);
    toast.success(t("product.added"), { description: `${qty} × ${p.title}`, action: { label: t("nav.cart"), onClick: () => router.push(href("/cart")) } });
  };

  const sections = [
    { id: "description", title: t("product.description"), body: <p className="leading-relaxed text-muted">{p.description}</p> },
    { id: "specs", title: t("product.specs"), body: (
      <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {p.specs.map((s) => <div key={s.k} className="grid grid-cols-[40%_1fr] gap-4 bg-white px-4 py-3 text-sm"><dt className="font-semibold text-muted">{s.k}</dt><dd className="font-bold">{s.v}</dd></div>)}
      </dl>) },
    { id: "shipping", title: t("product.shipping"), body: <ul className="space-y-2 text-sm text-muted"><li>{t("product.freeOver", { amount: price(freeOver) })}</li><li>{t("product.returns")}</li><li>{t("product.secure")}</li></ul> },
  ].filter((s) => s.id !== "specs" || p.specs.length);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6">
      <nav className="mb-6 flex items-center gap-1 text-sm font-semibold text-muted" aria-label="Breadcrumb">
        <Link href={href("/")} className="hover:text-ink">{t("common.home")}</Link><ChevronRight size={14} />
        <Link href={href(`/search?cat=${p.category}`)} className="hover:text-ink">{t(`cat.${p.category}`)}</Link><ChevronRight size={14} />
        <span className="truncate text-ink">{p.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[2.2rem] bg-cream"
            onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
            onMouseLeave={() => setZoom(null)}>
            <AnimatePresence mode="wait">
              <motion.img key={shown} src={shown} alt={p.title} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: zoom ? 1.8 : 1 }} exit={{ opacity: 0 }}
                transition={{ duration: zoom ? 0.2 : 0.4 }} style={{ transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%" }} className="h-full w-full object-cover" />
            </AnimatePresence>
            {off > 0 && <span className="absolute left-5 top-5 rounded-full bg-volt px-3 py-1.5 text-sm font-black text-white">{t("product.save", { pct: off })}</span>}
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
              {images.map((src, i) => (
                <button key={src + i} onClick={() => { if (p.colors && p.colors.length > 1) setCi(i); else setImg(i); }}
                  className={cn("h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition", (p.colors && p.colors.length > 1 ? ci : img) === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-volt">{t(`cat.${p.category}`)}</p>
          <h1 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl">{p.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
            {p.rating ? <span className="flex items-center gap-1"><Star size={16} className="fill-volt text-volt" />{p.rating.toFixed(1)}{p.reviewsCount ? <span className="text-muted">· {t("product.reviews", { n: p.reviewsCount })}</span> : null}</span> : <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-black">{t("product.new")}</span>}
            {p.sold ? <span className="text-muted">{t("product.sold", { n: p.sold })}</span> : null}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-4xl font-black">{price(p.price)}</span>
            {off > 0 && <><span className="pb-1 text-lg text-muted line-through">{price(p.compareAt!)}</span><span className="mb-1 rounded-lg bg-berry/10 px-2 py-0.5 text-sm font-black text-berry">-{off}%</span></>}
          </div>

          {p.colors && p.colors.length > 0 && (
            <div className="mt-8">
              <p className="label">{t("product.color")}: <span className="capitalize text-ink">{color}</span></p>
              <div className="flex flex-wrap gap-3">
                {p.colors.map((c, i) => (
                  <button key={c.name} onClick={() => setCi(i)} aria-label={c.name}
                    className={cn("grid h-11 w-11 place-items-center rounded-full border-2 transition", i === ci ? "scale-110 border-ink" : "border-line hover:border-muted")}>
                    <span className="h-8 w-8 rounded-full shadow-inner" style={{ background: c.hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border-[1.5px] border-line bg-white">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3.5 hover:text-volt" aria-label="-"><Minus size={16} /></button>
              <span className="w-8 text-center font-display font-bold tabular-nums">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="p-3.5 hover:text-volt" aria-label="+"><Plus size={16} /></button>
            </div>
            <button onClick={() => doAdd()} disabled={p.stock <= 0} className="btn btn-dark flex-1 py-4 text-base">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={String(added)} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="flex items-center gap-2">
                  {added ? <><Check size={18} />{t("product.added")}</> : t("product.addToCart")}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
          <button onClick={() => doAdd(true)} disabled={p.stock <= 0} className="btn btn-primary mt-3 w-full py-4 text-base"><Zap size={18} />{t("product.buyNow")}</button>
          <p className={cn("mt-3 text-sm font-bold", p.stock > 10 ? "text-ok" : p.stock > 0 ? "text-volt" : "text-berry")}>
            ● {p.stock > 10 ? t("product.inStock") : p.stock > 0 ? t("product.lowStock", { n: p.stock }) : t("product.outOfStock")}
          </p>

          <div className="mt-8 rounded-[1.6rem] border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-bold"><MapPin size={18} className="text-volt" />
                {hydrated && place ? t("product.deliveryTo", { place: `${place.city}, ${countryName(place.country)}` }) : t("product.setLocation")}</p>
              <button onClick={() => setOpen(true)} className="text-sm font-bold text-volt">{t("location.change")}</button>
            </div>
            {quotes && (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {quotes.map((q) => (
                  <div key={q.id} className="rounded-2xl bg-cream p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Truck size={13} />{t(`checkout.${q.id}`)}</p>
                    <p className="mt-1 font-display font-bold">{q.price === 0 ? t("checkout.free") : price(q.price)}</p>
                    <p className="text-xs font-semibold text-muted">{fmtDate(q.etaFrom)} – {fmtDate(q.etaTo)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
            {[[ShieldCheck, t("home.why3t")], [RotateCcw, t("home.why4t")], [Truck, t("home.why2t")]].map(([I, l], i) => {
              const Icon = I as typeof ShieldCheck;
              return <div key={i} className="rounded-2xl bg-cream p-3"><Icon size={20} className="mx-auto mb-1 text-volt" />{l as string}</div>;
            })}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-muted">{t("checkout.accepted")}<CardBrands size="sm" /></div>

          <div className="mt-8 divide-y divide-line border-y border-line">
            {sections.map((s) => (
              <div key={s.id}>
                <button onClick={() => setOpenSec(open === s.id ? null : s.id)} className="flex w-full items-center justify-between py-5 text-left font-display font-bold" aria-expanded={open === s.id}>
                  {s.title}<ChevronDown size={18} className={cn("transition-transform", open === s.id && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {open === s.id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="pb-6">{s.body}</div></motion.div>}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-3xl font-black">{t("product.related")}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">{related.map((r, i) => <ProductCard key={r._id} p={r} index={i} />)}</div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-paper/95 p-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.title}</p><p className="font-display font-black">{price(p.price)}</p></div>
        <button onClick={() => doAdd()} className="btn btn-primary">{added ? <Check size={18} /> : <Plus size={18} />}{t("product.addToCart")}</button>
      </div>
    </div>
  );
}
