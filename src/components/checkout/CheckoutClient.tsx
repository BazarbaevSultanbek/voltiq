"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { loadStripe, type Stripe, type StripeCardElement } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Check, ChevronLeft, CreditCard, Loader2, LocateFixed, Lock, MapPin, Package, Plane, Rocket, Truck, ShieldCheck, Info } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useCart, cartCount, cartSubtotal, useLocation } from "@/lib/store";
import { useMe } from "@/lib/user-context";
import { quote, COUNTRIES, countryName, type MethodId } from "@/lib/shipping";
import { detectBrand, formatCardNumber, luhn, validExpiry, ALLOWED_BRANDS, type Brand } from "@/lib/cards";
import { detectPlace } from "@/lib/geo";
import { useHydrated } from "../useHydrated";
import { CardBrands } from "../CardBrands";
import { CardPreview } from "./CardPreview";
import { AuthForm } from "../AuthForm";
import { cn } from "@/lib/cn";

type Addr = { fullName: string; phone: string; country: string; region: string; city: string; line1: string; line2: string; postal: string };
const EMPTY: Addr = { fullName: "", phone: "", country: "", region: "", city: "", line1: "", line2: "", postal: "" };
const ICONS: Record<MethodId, typeof Truck> = { standard: Truck, express: Plane, priority: Rocket };

let stripePromise: Promise<Stripe | null> | null = null;

export function CheckoutClient(props: { freeOver: number; stripePk: string | null; providers: { google: boolean; apple: boolean } }) {
  const inner = <Checkout {...props} />;
  if (!props.stripePk) return inner;
  stripePromise ??= loadStripe(props.stripePk);
  return <Elements stripe={stripePromise} options={{ appearance: { theme: "stripe" } }}>{inner}</Elements>;
}

function StripeHooks({ onReady }: { onReady: (s: Stripe | null, e: ReturnType<typeof useElements>) => void }) {
  const s = useStripe(); const e = useElements();
  useEffect(() => { onReady(s, e); }, [s, e, onReady]);
  return null;
}

function Checkout({ freeOver, stripePk, providers }: { freeOver: number; stripePk: string | null; providers: { google: boolean; apple: boolean } }) {
  const { t, href, price, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear } = useCart();
  const { place, set: setPlace } = useLocation();
  const { me, loading } = useMe();
  const [addr, setAddr] = useState<Addr>(EMPTY);
  const [save, setSave] = useState(true);
  const [method, setMethod] = useState<MethodId>("standard");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const [flip, setFlip] = useState(false);
  const [stripeBrand, setStripeBrand] = useState<string>("unknown");
  const [stripeComplete, setStripeComplete] = useState(false);
  const [paying, setPaying] = useState(false);
  const [locating, setLocating] = useState(false);
  const [touched, setTouched] = useState(false);
  const [stripeObj, setStripeObj] = useState<{ s: Stripe | null; e: ReturnType<typeof useElements> }>({ s: null, e: null });
  const onStripeReady = useMemo(() => (s: Stripe | null, e: ReturnType<typeof useElements>) => setStripeObj({ s, e }), []);

  // Prefill from saved location + profile
  useEffect(() => {
    if (!hydrated) return;
    setAddr((a) => ({
      ...a,
      country: a.country || place?.country || "",
      city: a.city || place?.city || "",
      region: a.region || place?.region || "",
      postal: a.postal || place?.postal || "",
      line1: a.line1 || place?.line1 || "",
      fullName: a.fullName || me?.name || "",
      phone: a.phone || me?.phone || "",
    }));
    const def = me?.addresses?.find((x) => x.isDefault) || me?.addresses?.[0];
    if (def && !addr.line1) setAddr({ ...EMPTY, ...def, region: def.region || "", line2: def.line2 || "", postal: def.postal || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, me, place]);

  const sub = cartSubtotal(items);
  const n = cartCount(items);
  const quotes = useMemo(() => quote(addr.country || place?.country, n, sub, freeOver), [addr.country, place?.country, n, sub, freeOver]);
  const q = quotes.find((x) => x.id === method)!;
  const total = Math.round((sub + q.price) * 100) / 100;
  const brand: Brand = stripePk ? ((stripeBrand as Brand) || "unknown") : detectBrand(card.number);
  const brandBad = (stripePk ? stripeBrand !== "unknown" : card.number.replace(/\D/g, "").length >= 2) && !ALLOWED_BRANDS.includes(brand);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });

  const addrOk = addr.fullName.trim().length > 1 && addr.phone.trim().length > 4 && addr.country && addr.city.trim() && addr.line1.trim().length > 2;
  const cardOk = stripePk ? stripeComplete && !brandBad : luhn(card.number) && validExpiry(card.exp) && /^\d{3,4}$/.test(card.cvc) && card.name.trim().length > 1 && !brandBad;

  if (!hydrated || loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-volt" size={32} /></div>;
  if (!items.length) { return (
    <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center text-center"><div><p className="font-display text-2xl font-bold">{t("cart.empty")}</p><Link href={href("/search")} className="btn btn-primary mt-6">{t("cart.continue")}</Link></div></div>
  ); }

  if (!me) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="mb-6 text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-volt text-white"><Lock /></div>
          <h1 className="font-display text-2xl font-black">{t("checkout.signInRequired")}</h1><p className="mt-1 text-muted">{t("checkout.signInRequiredSub")}</p></div>
        <AuthForm providers={providers} callbackUrl={href("/checkout")} />
      </div>
    );
  }

  const useLoc = async () => {
    setLocating(true);
    try { const p = await detectPlace(locale); setAddr((a) => ({ ...a, country: p.country || a.country, city: p.city || a.city, region: p.region || a.region, postal: p.postal || a.postal, line1: p.line1 || a.line1 })); setPlace(p); }
    catch { toast.error(t("location.denied")); } finally { setLocating(false); }
  };

  const pay = async () => {
    setTouched(true);
    if (!addrOk || !cardOk) { toast.error(brandBad ? t("checkout.brandNotAllowed") : t("checkout.invalid")); return; }
    setPaying(true);
    try {
      const payload: Record<string, unknown> = {
        items: items.map((i) => ({ id: i.id, qty: i.qty, color: i.color })),
        address: addr, method, saveAddress: save,
      };
      if (stripePk) {
        const { s, e } = stripeObj;
        if (!s || !e) throw new Error("stripe");
        const el = e.getElement(CardElement) as StripeCardElement;
        const { paymentMethod, error } = await s.createPaymentMethod({ type: "card", card: el, billing_details: { name: addr.fullName, email: me.email, phone: addr.phone } });
        if (error || !paymentMethod) throw new Error(error?.message || "card");
        payload.paymentMethodId = paymentMethod.id;
      } else {
        payload.testCard = card;
      }
      let r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      let d = await r.json();
      if (r.ok && d.requiresAction && stripeObj.s) {
        const res = await stripeObj.s.handleNextAction({ clientSecret: d.clientSecret });
        if (res.error) throw new Error(res.error.message);
        r = await fetch("/api/checkout/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: d.orderId }) });
        d = await r.json();
      }
      if (!r.ok) throw new Error(d.error === "brand_not_allowed" ? t("checkout.brandNotAllowed") : t("checkout.failed"));
      clear();
      window.dispatchEvent(new Event("vq:notify"));
      router.push(href(`/checkout/success/${d.orderId}`));
    } catch (e) {
      toast.error((e as Error).message && (e as Error).message.length > 8 ? (e as Error).message : t("checkout.failed"));
      setPaying(false);
    }
  };

  const field = (k: keyof Addr, label: string, opts: { type?: string; auto?: string; req?: boolean; span?: boolean } = {}) => {
    const bad = touched && opts.req !== false && !addr[k]?.trim() && ["fullName", "phone", "city", "line1"].includes(k);
    return (
      <div className={opts.span ? "sm:col-span-2" : ""}>
        <label className="label" htmlFor={`a-${k}`}>{label}</label>
        <input id={`a-${k}`} type={opts.type || "text"} autoComplete={opts.auto} value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
          className={cn("input", bad && "border-berry")} />
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8">
      <Link href={href("/cart")} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-fg"><ChevronLeft size={16} />{t("checkout.back")}</Link>
      <h1 className="mb-8 font-display text-4xl font-black sm:text-5xl">{t("checkout.title")}</h1>
      {!stripePk && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-volt/30 bg-volt/5 p-4 text-sm font-semibold"><Info size={18} className="mt-0.5 shrink-0 text-volt" />{t("checkout.testMode")}</div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* 1. Address */}
          <Step n={1} title={t("checkout.step1")} done={!!addrOk}>
            {me.addresses?.length > 0 && (
              <div className="mb-5">
                <p className="label">{t("checkout.savedAddresses")}</p>
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                  {me.addresses.map((a) => (
                    <button key={a._id} onClick={() => setAddr({ ...EMPTY, ...a, region: a.region || "", line2: a.line2 || "", postal: a.postal || "" })}
                      className={cn("shrink-0 rounded-2xl border-2 p-3 text-left text-sm transition", addr.line1 === a.line1 && addr.city === a.city ? "border-volt bg-volt/5" : "border-line bg-surface hover:border-muted")}>
                      <p className="font-bold">{a.fullName}</p><p className="text-muted">{a.line1}, {a.city}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={useLoc} disabled={locating} className="btn btn-ghost mb-5 w-full sm:w-auto">
              {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} className="text-volt" />}{locating ? t("checkout.locating") : t("checkout.useLocation")}
            </button>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("fullName", t("checkout.fullName"), { auto: "name" })}
              {field("phone", t("checkout.phone"), { type: "tel", auto: "tel" })}
              <div>
                <label className="label" htmlFor="a-country">{t("checkout.country")}</label>
                <select id="a-country" className={cn("input", touched && !addr.country && "border-berry")} value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} autoComplete="country">
                  <option value="" disabled>—</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              {field("region", t("checkout.region"), { auto: "address-level1", req: false })}
              {field("city", t("checkout.city"), { auto: "address-level2" })}
              {field("postal", t("checkout.postal"), { auto: "postal-code", req: false })}
              {field("line1", t("checkout.line1"), { auto: "address-line1", span: true })}
              {field("line2", t("checkout.line2"), { auto: "address-line2", span: true, req: false })}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="h-4 w-4 accent-[#ff5b14]" />{t("checkout.saveAddress")}
            </label>
          </Step>

          {/* 2. Delivery */}
          <Step n={2} title={t("checkout.step2")} done={!!addr.country}>
            {addr.country && <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted"><MapPin size={16} className="text-volt" />{addr.city ? `${addr.city}, ` : ""}{countryName(addr.country)}</p>}
            <div className="grid gap-3">
              {quotes.map((qq) => {
                const Icon = ICONS[qq.id];
                const on = qq.id === method;
                return (
                  <button key={qq.id} onClick={() => setMethod(qq.id)} className={cn("relative flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition", on ? "border-volt bg-volt/5" : "border-line bg-surface hover:border-muted")}>
                    <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl transition", on ? "bg-volt text-white" : "bg-cream")}><Icon size={22} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{t(`checkout.${qq.id}`)} <span className="font-semibold text-muted">· {t("checkout.businessDays", { min: qq.minDays, max: qq.maxDays })}</span></span>
                      <span className="block text-sm text-muted">{t(`checkout.${qq.id}D`)}</span>
                      <span className="mt-1 block text-sm font-bold text-ok">{t("checkout.estDelivery")}: {fmtDate(qq.etaFrom)} – {fmtDate(qq.etaTo)}</span>
                    </span>
                    <span className="font-display text-lg font-black">{qq.price === 0 ? <span className="text-ok">{t("checkout.free")}</span> : price(qq.price)}</span>
                    {on && <motion.span layoutId="ship-check" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-volt text-white"><Check size={14} /></motion.span>}
                  </button>
                );
              })}
            </div>
            <Timeline from={q.etaFrom} to={q.etaTo} fmt={fmtDate} />
          </Step>

          {/* 3. Payment */}
          <Step n={3} title={t("checkout.step3")} done={cardOk}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-muted">{t("checkout.accepted")}</span>
              <CardBrands active={ALLOWED_BRANDS.includes(brand) ? brand : undefined} />
            </div>
            <div className="grid items-center gap-6 md:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                {stripePk ? (
                  <>
                    <StripeHooks onReady={onStripeReady} />
                    <div>
                      <label className="label">{t("checkout.cardNumber")}</label>
                      <div className="input py-3.5">
                        <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: "16px", fontFamily: "Manrope, system-ui, sans-serif", fontWeight: "600", color: "#0d0d12" } } }}
                          onChange={(ev) => { setStripeBrand(ev.brand || "unknown"); setStripeComplete(ev.complete); }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="label" htmlFor="cc-num">{t("checkout.cardNumber")}</label>
                      <div className="relative">
                        <input id="cc-num" inputMode="numeric" autoComplete="cc-number" className={cn("input pl-11 font-mono tracking-wider", (brandBad || (touched && !luhn(card.number))) && "border-berry")}
                          value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} placeholder="4242 4242 4242 4242" />
                        <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="label" htmlFor="cc-name">{t("checkout.cardName")}</label>
                      <input id="cc-name" autoComplete="cc-name" className="input uppercase" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label" htmlFor="cc-exp">{t("checkout.expiry")}</label>
                        <input id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className={cn("input font-mono", touched && !validExpiry(card.exp) && "border-berry")} value={card.exp}
                          onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setCard({ ...card, exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v }); }} />
                      </div>
                      <div>
                        <label className="label" htmlFor="cc-cvc">{t("checkout.cvc")}</label>
                        <input id="cc-cvc" inputMode="numeric" autoComplete="cc-csc" type="password" className={cn("input font-mono", touched && !/^\d{3,4}$/.test(card.cvc) && "border-berry")} value={card.cvc}
                          onFocus={() => setFlip(true)} onBlur={() => setFlip(false)} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                      </div>
                    </div>
                  </>
                )}
                <AnimatePresence>{brandBad && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm font-bold text-berry">{t("checkout.brandNotAllowed")}</motion.p>}</AnimatePresence>
              </div>
              {!stripePk && <CardPreview number={card.number} name={card.name} exp={card.exp} brand={brand} flipped={flip} />}
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted"><ShieldCheck size={16} className="text-ok" />{t("checkout.secureNote")}</p>
          </Step>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] bg-surface p-6 ring-1 ring-line">
            <p className="font-display text-xl font-bold">{t("cart.summary")}</p>
            <ul className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
              {items.map((i) => (
                <li key={i.id + i.color} className="flex items-center gap-3">
                  <span className="relative shrink-0"><img src={i.image} alt="" className="h-14 w-14 rounded-xl bg-cream object-cover" /><span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-black text-white">{i.qty}</span></span>
                  <span className="min-w-0 flex-1"><span className="line-clamp-1 text-sm font-bold">{i.title}</span><span className="text-xs capitalize text-muted">{i.color}</span></span>
                  <span className="text-sm font-bold">{price(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="my-5 h-px bg-line" />
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{t("checkout.subtotal")}</dt><dd className="font-bold">{price(sub)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("checkout.shipping")} · {t(`checkout.${method}`)}</dt>
                <dd className="font-bold"><AnimatePresence mode="wait"><motion.span key={q.price} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block">{q.price === 0 ? <span className="text-ok">{t("checkout.free")}</span> : price(q.price)}</motion.span></AnimatePresence></dd></div>
              <div className="flex justify-between text-xs"><dt className="text-muted">{t("checkout.estDelivery")}</dt><dd className="font-bold text-ok">{fmtDate(q.etaFrom)} – {fmtDate(q.etaTo)}</dd></div>
            </dl>
            <div className="my-5 h-px bg-line" />
            <div className="flex items-end justify-between"><span className="font-bold">{t("checkout.total")}</span>
              <AnimatePresence mode="wait"><motion.span key={total} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-3xl font-black">{price(total)}</motion.span></AnimatePresence></div>
            <button onClick={pay} disabled={paying} className="btn btn-primary mt-6 w-full py-4 text-base">
              {paying ? <><Loader2 size={18} className="animate-spin" />{t("checkout.processing")}</> : <><Lock size={16} />{t("checkout.pay", { amount: price(total) })}</>}
            </button>
            <p className="mt-3 text-center text-xs text-muted">{t("checkout.agree")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.08 }} className="rounded-[2rem] bg-surface p-6 ring-1 ring-line sm:p-8">
      <h2 className="mb-6 flex items-center gap-3 font-display text-xl font-bold">
        <span className={cn("grid h-9 w-9 place-items-center rounded-full text-sm font-black transition", done ? "bg-ok text-white" : "bg-ink text-white")}>{done ? <Check size={18} /> : n}</span>{title}
      </h2>
      {children}
    </motion.section>
  );
}

function Timeline({ from, to, fmt }: { from: string; to: string; fmt: (d: string) => string }) {
  const { t } = useI18n();
  const steps = [
    { i: Check, l: t("orders.status.paid"), d: fmt(new Date().toISOString()) },
    { i: Package, l: t("orders.status.processing"), d: "1–2d" },
    { i: Plane, l: t("orders.status.shipped"), d: "" },
    { i: MapPin, l: t("orders.status.delivered"), d: `${fmt(from)} – ${fmt(to)}` },
  ];
  return (
    <div className="mt-6 grid grid-cols-4 gap-2 rounded-2xl bg-cream p-4">
      {steps.map((s, i) => (
        <div key={i} className="relative text-center">
          {i < steps.length - 1 && <span className="absolute left-1/2 top-4 h-0.5 w-full bg-line" />}
          <span className={cn("relative mx-auto grid h-8 w-8 place-items-center rounded-full", i === 0 ? "bg-volt text-white" : "bg-surface text-muted ring-1 ring-line")}><s.i size={15} /></span>
          <p className="mt-2 text-[11px] font-bold leading-tight sm:text-xs">{s.l}</p>
          <p className="text-[10px] font-semibold text-muted sm:text-[11px]">{s.d}</p>
        </div>
      ))}
    </div>
  );
}
