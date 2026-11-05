"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Package, Check, Plane, MapPin, X, Truck } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { countryName } from "@/lib/shipping";
import type { OrderView } from "../SuccessClient";
import { AccountTabs } from "./AccountTabs";
import { cn } from "@/lib/cn";

const FLOW = ["paid", "processing", "shipped", "delivered"];
const ICON = [Check, Package, Plane, MapPin];
const BADGE: Record<string, string> = { paid: "bg-sky/10 text-sky", processing: "bg-volt/10 text-volt", shipped: "bg-purple-500/10 text-purple-600", delivered: "bg-ok/10 text-ok", cancelled: "bg-berry/10 text-berry", pending_payment: "bg-line text-muted" };

export function OrdersClient({ orders }: { orders: OrderView[] }) {
  const { t, href, price, locale } = useI18n();
  const [open, setOpen] = useState<string | null>(orders[0]?._id ?? null);
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-8">
      <AccountTabs />
      <h1 className="mb-8 font-display text-4xl font-black">{t("orders.title")}</h1>
      {orders.length === 0 ? (
        <div className="grid place-items-center rounded-[2rem] bg-cream px-6 py-20 text-center">
          <Package size={44} className="text-volt" /><p className="mt-4 font-display text-2xl font-bold">{t("orders.empty")}</p><p className="mt-1 text-muted">{t("orders.emptySub")}</p>
          <Link href={href("/search")} className="btn btn-primary mt-6">{t("cart.continue")}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o, idx) => {
            const step = FLOW.indexOf(o.status);
            const isOpen = open === o._id;
            return (
              <motion.div key={o._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="overflow-hidden rounded-[1.8rem] bg-surface ring-1 ring-line">
                <button onClick={() => setOpen(isOpen ? null : o._id)} className="flex w-full flex-wrap items-center gap-4 p-5 text-left">
                  <div className="flex -space-x-3">{o.items.slice(0, 3).map((i, k) => <img key={k} src={i.image} alt="" className="h-14 w-14 rounded-xl bg-cream object-cover ring-2 ring-white" />)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold">{o.number}</p>
                    <p className="text-sm text-muted">{t("orders.placed", { date: fmt(o.createdAt) })} · {t("orders.items", { n: o.items.reduce((s, i) => s + i.qty, 0) })}</p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-black", BADGE[o.status])}>{t(`orders.status.${o.status}`)}</span>
                  <span className="font-display text-lg font-black">{price(o.total)}</span>
                  <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="border-t border-line p-5">
                        {o.status === "cancelled" ? (
                          <p className="flex items-center gap-2 font-bold text-berry"><X size={18} />{t("orders.status.cancelled")}</p>
                        ) : (
                          <div className="relative grid grid-cols-4">
                            <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-line" />
                            <motion.div className="absolute left-[12.5%] top-5 h-1 rounded-full bg-volt" initial={{ width: 0 }} animate={{ width: `${(Math.max(step, 0) / 3) * 75}%` }} transition={{ duration: 0.8 }} />
                            {FLOW.map((s, k) => { const I = ICON[k]; const done = k <= step; return (
                              <div key={s} className="relative text-center">
                                <span className={cn("mx-auto grid h-11 w-11 place-items-center rounded-full ring-4 ring-white transition", done ? "bg-volt text-white" : "bg-cream text-muted")}><I size={18} /></span>
                                <p className={cn("mt-2 text-xs font-bold", !done && "text-muted")}>{t(`orders.status.${s}`)}</p>
                              </div>
                            ); })}
                          </div>
                        )}
                        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-cream p-3 text-sm font-bold"><Truck size={16} className="text-volt" />{t("orders.eta", { from: fmt(o.eta.from), to: fmt(o.eta.to) })} · {t(`checkout.${o.shippingMethod.id}`)}</p>
                        {o.tracking && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-3 text-sm">
                            <span><span className="label mb-0">{t("orders.tracking")}</span><b className="font-mono">{o.tracking.number}</b>{o.tracking.carrier && <span className="text-muted"> · {o.tracking.carrier}</span>}</span>
                            <a href={`https://t.17track.net/en#nums=${o.tracking.number}`} target="_blank" rel="noreferrer" className="btn btn-primary py-2 text-sm">{t("orders.track")}</a>
                          </div>
                        )}
                        <ul className="mt-4 divide-y divide-line">
                          {o.items.map((i, k) => (
                            <li key={k} className="flex items-center gap-3 py-3">
                              <Link href={href(`/p/${i.slug}`)}><img src={i.image} alt="" className="h-14 w-14 rounded-xl bg-cream object-cover" /></Link>
                              <div className="min-w-0 flex-1"><Link href={href(`/p/${i.slug}`)} className="line-clamp-1 font-bold hover:text-volt">{i.title}</Link><p className="text-sm capitalize text-muted">{i.color} · ×{i.qty}</p></div>
                              <p className="font-bold">{price(i.price * i.qty)}</p>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                          <div className="rounded-2xl bg-cream p-4"><p className="label">{t("success.to")}</p><p className="font-bold">{o.address.fullName}</p><p className="text-muted">{o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ""}<br />{o.address.city}{o.address.postal ? ` ${o.address.postal}` : ""}, {countryName(o.address.country)}<br />{o.address.phone}</p></div>
                          <div className="space-y-1.5 rounded-2xl bg-cream p-4">
                            <div className="flex justify-between"><span className="text-muted">{t("checkout.subtotal")}</span><b>{price(o.subtotal)}</b></div>
                            <div className="flex justify-between"><span className="text-muted">{t("checkout.shipping")}</span><b>{o.shipping === 0 ? t("checkout.free") : price(o.shipping)}</b></div>
                            <div className="flex justify-between text-base"><span className="font-bold">{t("checkout.total")}</span><b>{price(o.total)}</b></div>
                            <p className="pt-1 text-xs text-muted">{o.payment.brand.toUpperCase()} •••• {o.payment.last4}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
