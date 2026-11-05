"use client";
import Link from "next/link";
import { useEffect } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CalendarClock, MapPin, CreditCard, Package, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { countryName } from "@/lib/shipping";
import { formatDate } from "@/i18n/date";

export type OrderView = {
  _id: string; number: string; status: string; total: number; subtotal: number; shipping: number; createdAt: string;
  items: { slug: string; title: string; image: string; price: number; qty: number; color: string }[];
  address: { fullName: string; phone: string; country: string; region?: string; city: string; line1: string; line2?: string; postal?: string };
  shippingMethod: { id: string; minDays: number; maxDays: number }; eta: { from: string; to: string };
  payment: { provider: string; brand: string; last4: string }; tracking?: { number: string; carrier?: string } | null; timeline: { status: string; at: string; note?: string }[];
};

const COLORS = ["#ff5b14", "#c8f43c", "#ff2e63", "#3d7bff", "#0d0d12"];

export function SuccessClient({ o }: { o: OrderView }) {
  const { t, href, price, locale } = useI18n();
  const fmt = (d: string) => formatDate(locale, d, { weekday: "short", month: "long", day: "numeric" });
  useEffect(() => { toast.success(t("success.title"), { description: t("success.notified") }); }, [t]);

  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden px-4 pb-10 pt-14">
      {Array.from({ length: 36 }).map((_, i) => (
        <motion.span key={i} className="pointer-events-none absolute top-0 h-3 w-2 rounded-sm" style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % 5] }}
          initial={{ y: -40, rotate: 0, opacity: 1 }} animate={{ y: 700, rotate: 360 * (i % 2 ? 1 : -1), opacity: 0 }} transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 7) * 0.08, ease: "easeIn" }} />
      ))}
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-ok text-white shadow-[0_20px_40px_-12px_rgb(23_163_74/.6)]">
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} /></svg>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 font-display text-4xl font-black sm:text-5xl">{t("success.title")}</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mx-auto mt-3 max-w-lg text-lg text-muted">{t("success.sub", { name: o.address.fullName.split(" ")[0], number: o.number })}</motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-10 overflow-hidden rounded-[2rem] bg-surface ring-1 ring-line">
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {[
            [CalendarClock, t("success.eta"), `${fmt(o.eta.from)} – ${fmt(o.eta.to)}`],
            [MapPin, t("success.to"), `${o.address.line1}, ${o.address.city}, ${countryName(o.address.country)}`],
            [CreditCard, "", t("success.paid", { brand: o.payment.brand.toUpperCase(), last4: o.payment.last4 })],
          ].map(([I, l, v], i) => {
            const Icon = I as typeof MapPin;
            return <div key={i} className="bg-surface p-5"><Icon size={20} className="text-volt" />{l ? <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">{l as string}</p> : <p className="mt-2 h-4" />}<p className="mt-1 font-bold">{v as string}</p></div>;
          })}
        </div>
        <ul className="divide-y divide-line">
          {o.items.map((i) => (
            <li key={i.slug + i.color} className="flex items-center gap-4 p-4">
              <img src={i.image} alt="" className="h-16 w-16 rounded-xl bg-cream object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{i.title}</p><p className="text-sm capitalize text-muted">{i.color} · ×{i.qty}</p></div>
              <p className="font-bold">{price(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <div className="space-y-2 bg-cream p-5 text-sm">
          <div className="flex justify-between"><span className="text-muted">{t("checkout.subtotal")}</span><b>{price(o.subtotal)}</b></div>
          <div className="flex justify-between"><span className="text-muted">{t("checkout.shipping")} · {t(`checkout.${o.shippingMethod.id}`)}</span><b>{o.shipping === 0 ? t("checkout.free") : price(o.shipping)}</b></div>
          <div className="flex justify-between pt-2 text-lg"><span className="font-bold">{t("checkout.total")}</span><b className="font-display">{price(o.total)}</b></div>
        </div>
      </motion.div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={href("/account/orders")} className="btn btn-dark"><Package size={18} />{t("success.viewOrders")}</Link>
        <Link href={href("/search")} className="btn btn-ghost">{t("success.keepShopping")} <ArrowRight size={18} /></Link>
      </div>
    </div>
  );
}
