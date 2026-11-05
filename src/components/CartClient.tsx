"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck, Lock } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useCart, cartCount, cartSubtotal } from "@/lib/store";
import { useHydrated } from "./useHydrated";
import { CardBrands } from "./CardBrands";

export function CartClient({ freeOver }: { freeOver: number }) {
  const { t, href, price } = useI18n();
  const { items, setQty, remove, restore, clear } = useCart();
  const hydrated = useHydrated();
  if (!hydrated) return <div className="mx-auto min-h-[60vh] max-w-7xl px-4 pt-10" />;

  const sub = cartSubtotal(items);
  const n = cartCount(items);
  const left = Math.max(0, freeOver - sub);
  const pct = Math.min(100, (sub / freeOver) * 100);

  if (!items.length) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-16 text-center">
        <div>
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-volt text-white"><ShoppingBag size={40} /></motion.div>
          <h1 className="mt-6 font-display text-3xl font-black">{t("cart.empty")}</h1>
          <p className="mt-2 text-muted">{t("cart.emptySub")}</p>
          <Link href={href("/search")} className="btn btn-primary mt-8">{t("cart.continue")} <ArrowRight size={18} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8">
      <div className="mb-8 flex items-end justify-between">
        <h1 className="font-display text-4xl font-black sm:text-5xl">{t("cart.title")} <span className="text-volt">({n})</span></h1>
        <button onClick={clear} className="text-sm font-bold text-muted hover:text-berry">{t("cart.clear")}</button>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-5 rounded-2xl bg-surface p-4 ring-1 ring-line">
            <p className="flex items-center gap-2 text-sm font-bold"><Truck size={18} className="text-volt" />{left > 0 ? t("cart.freeProgress", { amount: price(left) }) : t("cart.freeUnlocked")}</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream"><motion.div className="h-full rounded-full bg-gradient-to-r from-volt to-lime-dark" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", damping: 20 }} /></div>
          </div>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <motion.li key={it.id + it.color} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60, height: 0, marginTop: 0 }} transition={{ duration: 0.3 }}
                  className="flex gap-4 rounded-[1.6rem] bg-surface p-3 ring-1 ring-line sm:p-4">
                  <Link href={href(`/p/${it.slug}`)} className="shrink-0"><img src={it.image} alt={it.title} className="h-24 w-24 rounded-2xl bg-cream object-cover sm:h-28 sm:w-28" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={href(`/p/${it.slug}`)} className="line-clamp-2 font-bold hover:text-volt">{it.title}</Link>
                        {it.color && <p className="mt-0.5 text-sm capitalize text-muted">{it.color}</p>}
                      </div>
                      <button aria-label={t("cart.remove")} onClick={() => { const r = remove(it.id, it.color); if (r) toast(t("cart.removed"), { description: r.title, action: { label: t("cart.undo"), onClick: () => restore(r) } }); }}
                        className="rounded-full p-2 text-muted transition hover:bg-berry/10 hover:text-berry"><Trash2 size={18} /></button>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <div className="flex items-center rounded-full border-[1.5px] border-line">
                        <button onClick={() => setQty(it.id, it.color, it.qty - 1)} className="p-2 hover:text-volt" aria-label="-"><Minus size={14} /></button>
                        <span className="w-7 text-center font-bold tabular-nums">{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.color, it.qty + 1)} className="p-2 hover:text-volt" aria-label="+"><Plus size={14} /></button>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold">{price(it.price * it.qty)}</p>
                        {it.qty > 1 && <p className="text-xs text-muted">{price(it.price)} × {it.qty}</p>}
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] bg-night p-6 ring-1 ring-line text-white">
            <p className="font-display text-xl font-bold">{t("cart.summary")}</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-white/60">{t("cart.subtotal")} · {t("cart.items", { n })}</span><span className="font-bold">{price(sub)}</span></div>
              <div className="flex justify-between"><span className="text-white/60">{t("checkout.shipping")}</span><span className="font-semibold text-white/60">{t("cart.shippingCalc")}</span></div>
            </div>
            <div className="my-5 h-px bg-white/10" />
            <div className="flex items-end justify-between"><span className="font-bold">{t("checkout.subtotal")}</span><span className="font-display text-3xl font-black">{price(sub)}</span></div>
            <Link href={href("/checkout")} className="btn btn-primary mt-6 w-full py-4 text-base"><Lock size={16} />{t("cart.checkout")}</Link>
            <div className="mt-5 flex justify-center"><CardBrands size="sm" /></div>
          </div>
          <Link href={href("/search")} className="mt-4 block text-center text-sm font-bold hover:text-volt">← {t("cart.continue")}</Link>
        </aside>
      </div>
    </div>
  );
}
