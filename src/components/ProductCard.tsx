"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Plus, Star, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/client";
import { useCart } from "@/lib/store";

export type CardProduct = {
  _id: string; slug: string; title: string; price: number; compareAt?: number; images: string[];
  colors?: { name: string; hex: string }[]; rating?: number | null; reviewsCount?: number; category: string; sold?: number; createdAt?: string;
};

export function ProductCard({ p, index = 0 }: { p: CardProduct; index?: number }) {
  const { t, href, price } = useI18n();
  const add = useCart((s) => s.add);
  const [color, setColor] = useState(0);
  const [done, setDone] = useState(false);
  const off = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const isNew = p.createdAt && Date.now() - +new Date(p.createdAt) < 1000 * 60 * 60 * 24 * 21;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const c = p.colors?.[color]?.name || "";
    add({ id: p._id, slug: p.slug, title: p.title, image: p.images[color] || p.images[0], price: p.price, color: c, compareAt: p.compareAt });
    fetch("/api/products/interest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p._id, type: "cart" }) });
    setDone(true); setTimeout(() => setDone(false), 1400);
    toast.success(t("product.added"), { description: p.title });
  };

  return (
    <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(index, 8) * 0.05, ease: [0.2, 0.8, 0.2, 1] }} className="group">
      <Link href={href(`/p/${p.slug}`)} className="block">
        <div className="relative aspect-square overflow-hidden rounded-[1.6rem] bg-cream">
          <img src={p.images[color] || p.images[0]} alt={p.title} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]" />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {off > 0 && <span className="rounded-full bg-volt px-2.5 py-1 text-[11px] font-black text-white">-{off}%</span>}
            {isNew && !off && <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-black text-ink">{t("product.new")}</span>}
          </div>
          <motion.button onClick={quickAdd} whileTap={{ scale: 0.85 }} aria-label={t("product.addToCart")}
            className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-xl transition-all duration-300 hover:bg-volt sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            {done ? <Check size={20} /> : <Plus size={20} />}
          </motion.button>
        </div>
        <div className="px-1 pt-3">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
            <span>{t(`cat.${p.category}`)}</span>
            {p.rating ? <span className="flex items-center gap-0.5 text-fg"><Star size={12} className="fill-volt text-volt" />{p.rating.toFixed(1)}</span> : null}
          </div>
          <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-[15px] font-bold leading-snug group-hover:text-volt">{p.title}</h3>
          <div className="mt-2 flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold">{price(p.price)}</span>
              {off > 0 && <span className="text-sm text-muted line-through">{price(p.compareAt!)}</span>}
            </div>
            {p.colors && p.colors.length > 1 && (
              <div className="flex -space-x-1">
                {p.colors.slice(0, 4).map((c, i) => (
                  <button key={c.name} onClick={(e) => { e.preventDefault(); setColor(i); }} aria-label={c.name}
                    className={`h-4 w-4 rounded-full border-2 border-white ring-1 transition ${i === color ? "ring-ink scale-125" : "ring-line"}`} style={{ background: c.hex }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
