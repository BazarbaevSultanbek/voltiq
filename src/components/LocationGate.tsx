"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LocateFixed, MapPin, X, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useLocation } from "@/lib/store";
import { detectPlace } from "@/lib/geo";
import { COUNTRIES } from "@/lib/shipping";
import { useHydrated } from "./useHydrated";

export function LocationGate() {
  const { t, locale } = useI18n();
  const { place, asked, open, set, setOpen } = useLocation();
  const hydrated = useHydrated();
  const [country, setCountry] = useState(place?.country || "");
  const [city, setCity] = useState(place?.city || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // First visit: ask after a short delay so the hero animation plays first.
  useEffect(() => {
    if (!hydrated || asked || place) return;
    const tm = setTimeout(() => setOpen(true), 1600);
    return () => clearTimeout(tm);
  }, [hydrated, asked, place, setOpen]);

  useEffect(() => { if (open) { setCountry(place?.country || ""); setCity(place?.city || ""); setErr(""); } }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const detect = async () => {
    setBusy(true); setErr("");
    try {
      const p = await detectPlace(locale);
      if (p.country) { setCountry(p.country); setCity(p.city); set(p); }
    } catch { setErr(t("location.denied")); } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {hydrated && open && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-end bg-ink/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="loc-title"
            className="relative w-full max-w-md overflow-hidden rounded-t-[2rem] bg-paper p-7 shadow-2xl sm:rounded-[2rem]"
            initial={{ y: 60, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }} onClick={(e) => e.stopPropagation()}>
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/40 blur-2xl" />
            <button onClick={() => setOpen(false)} aria-label={t("common.close")} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full hover:bg-cream"><X size={18} /></button>
            <div className="relative">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-volt text-white animate-pulse-ring"><MapPin /></div>
              <h2 id="loc-title" className="font-display text-2xl font-bold">{t("location.title")}</h2>
              <p className="mt-1 text-muted">{t("location.sub")}</p>
              <button onClick={detect} disabled={busy} className="btn btn-dark mt-6 w-full">
                {busy ? <Loader2 className="animate-spin" size={18} /> : <LocateFixed size={18} />}
                {busy ? t("location.detecting") : t("location.detect")}
              </button>
              {err && <p className="mt-2 text-sm font-semibold text-berry">{err}</p>}
              <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted"><span className="h-px flex-1 bg-line" />{t("location.or")}<span className="h-px flex-1 bg-line" /></div>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (country && city.trim()) set({ country, city: city.trim() }); }}>
                <div>
                  <label className="label" htmlFor="loc-country">{t("location.country")}</label>
                  <select id="loc-country" className="input" value={country} onChange={(e) => setCountry(e.target.value)} required>
                    <option value="" disabled>—</option>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="loc-city">{t("location.city")}</label>
                  <input id="loc-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Tashkent" />
                </div>
                <button className="btn btn-primary w-full" disabled={!country || !city.trim()}>{t("location.confirm")}</button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
