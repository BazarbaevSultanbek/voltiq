"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, TrendingUp, Clock, ArrowRight, X } from "lucide-react";
import { useI18n } from "@/i18n/client";

type Sug = { _id: string; slug: string; title: string; price: number; image: string; category: string };

const RECENT_KEY = "vq-recent";
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; } };
export const pushRecent = (q: string) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...readRecent().filter((x) => x !== q)].slice(0, 6))); } catch {}
};

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const { t, href, price } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [open, setOpen] = useState(false);
  const [sug, setSug] = useState<Sug[]>([]);
  const [total, setTotal] = useState(0);
  const [trending, setTrending] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQ(params.get("q") || ""); }, [params]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (!open) return;
    const ctl = new AbortController();
    const tm = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => r.json()).then((d) => {
        setSug(d.items || []); setTotal(d.total || 0); if (d.trending) setTrending(d.trending);
      }).catch(() => {});
    }, 140);
    return () => { clearTimeout(tm); ctl.abort(); };
  }, [q, open]);

  const go = (term: string) => {
    const s = term.trim();
    setOpen(false);
    if (!s) return router.push(href("/search"));
    pushRecent(s);
    router.push(href(`/search?q=${encodeURIComponent(s)}`));
  };

  return (
    <div ref={boxRef} className="relative">
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (active >= 0 && sug[active]) router.push(href(`/p/${sug[active].slug}`)); else go(q); }}
        className="group flex items-center gap-2 rounded-full border-[1.5px] border-line bg-surface px-4 transition focus-within:border-volt focus-within:shadow-[0_0_0_4px_rgb(255_91_20/.12)]">
        <Search size={18} className="text-muted transition group-focus-within:text-volt" />
        <input value={q} autoFocus={autoFocus} onFocus={() => { setOpen(true); setRecent(readRecent()); }}
          onChange={(e) => { setQ(e.target.value); setActive(-1); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, sug.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={t("nav.searchPlaceholder")} aria-label={t("nav.search")}
          className="h-11 w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-muted/70" />
        {q && <button type="button" onClick={() => setQ("")} className="rounded-full p-1 text-muted hover:bg-cream" aria-label={t("search.clear")}><X size={16} /></button>}
        <button className="hidden rounded-full bg-volt px-4 py-1.5 text-sm font-bold text-white sm:block">{t("nav.search")}</button>
      </form>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-line bg-surface p-3 shadow-2xl">
            {!q.trim() ? (
              <div className="space-y-4 p-1">
                {recent.length > 0 && (
                  <div><p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Clock size={13} />{t("search.recent")}</p>
                    <div className="flex flex-wrap gap-2">{recent.map((r) => <button key={r} onClick={() => go(r)} className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold hover:bg-line">{r}</button>)}</div></div>
                )}
                <div><p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><TrendingUp size={13} />{t("search.trendingSearches")}</p>
                  <div className="flex flex-wrap gap-2">{(trending.length ? trending : ["power bank", "earbuds", "usb-c hub", "mechanical keyboard", "magsafe", "gaming mouse"]).map((r) => (
                    <button key={r} onClick={() => go(r)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-volt hover:text-volt">{r}</button>))}</div></div>
              </div>
            ) : (
              <div>
                {sug.length === 0 && <p className="p-4 text-center text-sm text-muted">{t("search.empty")}</p>}
                {sug.map((s, i) => (
                  <Link key={s._id} href={href(`/p/${s.slug}`)} onClick={() => { setOpen(false); pushRecent(q.trim()); fetch("/api/search/log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q, results: total, ids: [s._id] }) }); }}
                    className={`flex items-center gap-3 rounded-2xl p-2 ${active === i ? "bg-cream" : "hover:bg-cream"}`}>
                    <img src={s.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{s.title}</span><span className="text-xs text-muted">{t(`cat.${s.category}`)}</span></span>
                    <span className="font-display text-sm font-bold">{price(s.price)}</span>
                  </Link>
                ))}
                {total > 0 && <button onClick={() => go(q)} className="mt-1 flex w-full items-center justify-between rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white">{t("search.seeAll", { q })} <span className="flex items-center gap-1 text-lime">{total} <ArrowRight size={16} /></span></button>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
