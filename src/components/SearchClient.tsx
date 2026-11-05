"use client";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SlidersHorizontal, X, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { CATEGORIES } from "@/lib/catalog";
import { ProductCard, type CardProduct } from "./ProductCard";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/cn";

const SORTS = [["relevance", "sortRelevance"], ["popular", "sortPopular"], ["new", "sortNew"], ["price_asc", "sortPriceAsc"], ["price_desc", "sortPriceDesc"]] as const;

export function SearchClient({ items, total, page, pages }: { items: CardProduct[]; total: number; page: number; pages: number }) {
  const { t } = useI18n();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const [min, setMin] = useState(sp.get("min") || "");
  const [max, setMax] = useState(sp.get("max") || "");
  const q = sp.get("q") || "", cat = sp.get("cat") || "", group = sp.get("group") || "", deals = sp.get("deals") === "1", sort = sp.get("sort") || "relevance";
  const logged = useRef("");

  // Count each distinct search once — feeds the admin "most interested" report.
  useEffect(() => {
    if (!q.trim() || logged.current === q) return;
    logged.current = q;
    fetch("/api/search/log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q, results: total, ids: items.slice(0, 5).map((i) => i._id) }) }).catch(() => {});
  }, [q, total, items]);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    next.delete("page"); // any filter/sort change starts again from page 1
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === "") next.delete(k); else next.set(k, v); }
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const title = q ? t("search.resultsFor", { q }) : cat ? t(`cat.${cat}`) : group ? t(`cat.${group}`) : deals ? t("nav.deals") : t("search.allProducts");
  const activeFilters = [cat, group, deals, sp.get("min"), sp.get("max")].filter(Boolean).length;

  const Filters = (
    <div className="space-y-7">
      {(["phone", "pc"] as const).map((g) => (
        <div key={g}>
          <button onClick={() => set({ group: group === g ? null : g, cat: null })} className={cn("mb-2 text-xs font-bold uppercase tracking-widest", group === g ? "text-volt" : "text-muted hover:text-fg")}>{t(`nav.${g}`)}</button>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
            {CATEGORIES.filter((c) => c.group === g).map((c) => (
              <button key={c.slug} onClick={() => set({ cat: cat === c.slug ? null : c.slug, group: null })}
                className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition", cat === c.slug ? "bg-ink text-white" : "bg-surface hover:bg-cream lg:bg-transparent")}>
                <CategoryIcon slug={c.slug} className="hidden h-7 w-7 lg:grid" size={15} />{t(`cat.${c.slug}`)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{t("search.price")}</p>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); set({ min, max }); setDrawer(false); }}>
          <input className="input py-2" inputMode="decimal" placeholder={t("search.min")} value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))} aria-label={t("search.min")} />
          <span className="text-muted">–</span>
          <input className="input py-2" inputMode="decimal" placeholder={t("search.max")} value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))} aria-label={t("search.max")} />
          <button className="btn btn-dark px-4 py-2.5">→</button>
        </form>
      </div>
      <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-surface p-3 font-semibold">
        {t("search.onlyDeals")}
        <span className={cn("relative h-6 w-11 rounded-full transition", deals ? "bg-volt" : "bg-line")}>
          <input type="checkbox" className="sr-only" checked={deals} onChange={() => set({ deals: deals ? null : "1" })} />
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all", deals ? "left-[22px]" : "left-0.5")} />
        </span>
      </label>
      {activeFilters > 0 && <button onClick={() => { setMin(""); setMax(""); set({ cat: null, group: null, deals: null, min: null, max: null }); }} className="text-sm font-bold text-volt">{t("search.clear")}</button>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8">
      <motion.div key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-black sm:text-5xl">{title}</h1>
        <p className="mt-2 font-semibold text-muted">{t("search.count", { n: total })}</p>
      </motion.div>

      <div className="mb-6 flex items-center justify-between gap-3 border-b border-line pb-4">
        <button onClick={() => setDrawer(true)} className="btn btn-ghost py-2.5 lg:hidden"><SlidersHorizontal size={16} />{t("search.filters")}{activeFilters > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-volt text-xs text-white">{activeFilters}</span>}</button>
        <div className="no-scrollbar hidden gap-2 overflow-x-auto lg:flex">
          {cat && <Chip onX={() => set({ cat: null })}>{t(`cat.${cat}`)}</Chip>}
          {group && <Chip onX={() => set({ group: null })}>{t(`nav.${group}`)}</Chip>}
          {deals && <Chip onX={() => set({ deals: null })}>{t("search.onlyDeals")}</Chip>}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm font-semibold">
          <span className="hidden text-muted sm:inline">{t("search.sort")}</span>
          <select value={sort} onChange={(e) => set({ sort: e.target.value })} className="rounded-full border-[1.5px] border-line bg-surface px-4 py-2 font-bold outline-none focus:border-volt">
            {SORTS.map(([v, k]) => <option key={v} value={v}>{t(`search.${k}`)}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-auto pr-2 lg:block">{Filters}</aside>
        <div className={cn("transition-opacity", pending && "opacity-50")}>
          {items.length === 0 ? (
            <div className="grid place-items-center rounded-[2rem] bg-cream px-6 py-20 text-center">
              <SearchX size={48} className="text-volt" />
              <p className="mt-4 font-display text-2xl font-bold">{t("search.empty")}</p>
              <p className="mt-1 text-muted">{t("search.emptySub")}</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {items.map((p, i) => <motion.div key={p._id} layout exit={{ opacity: 0, scale: 0.9 }}><ProductCard p={p} index={i % 9} /></motion.div>)}
              </AnimatePresence>
            </motion.div>
          )}
          {pages > 1 && <Pager page={page} pages={pages} pageHref={(n) => { const next = new URLSearchParams(sp.toString()); if (n > 1) next.set("page", String(n)); else next.delete("page"); const qs = next.toString(); return qs ? `${pathname}?${qs}` : pathname; }} />}
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[70] bg-ink/50 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}>
            <motion.div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-[2rem] bg-paper p-6" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between"><p className="font-display text-xl font-bold">{t("search.filters")}</p><button onClick={() => setDrawer(false)} className="rounded-full p-2 hover:bg-cream" aria-label={t("common.close")}><X /></button></div>
              {Filters}
              <button onClick={() => setDrawer(false)} className="btn btn-primary mt-6 w-full">{t("search.apply")} ({total})</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ children, onX }: { children: React.ReactNode; onX: () => void }) {
  return <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-ink py-1.5 pl-3 pr-1.5 text-sm font-bold text-white">{children}<button onClick={onX} className="-my-1 grid h-7 w-7 place-items-center rounded-full hover:bg-white/20" aria-label="remove"><X size={14} /></button></span>;
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageList(page: number, pages: number): (number | "gap")[] {
  const want = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((n) => n >= 1 && n <= pages));
  const sorted = [...want].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => { if (i && n - sorted[i - 1] > 1) out.push("gap"); out.push(n); });
  return out;
}

function Pager({ page, pages, pageHref }: { page: number; pages: number; pageHref: (n: number) => string }) {
  const { t } = useI18n();
  const arrow = "grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-line bg-surface transition hover:border-fg";
  const off = "pointer-events-none opacity-30";
  return (
    <nav aria-label={t("search.pageOf", { n: page, total: pages })} className="mt-14 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Link href={pageHref(page - 1)} aria-label={t("search.prev")} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={cn(arrow, page <= 1 && off)}><ChevronLeft size={18} /></Link>
        {pageList(page, pages).map((n, i) => n === "gap"
          ? <span key={`g${i}`} className="px-1 font-bold text-muted">…</span>
          : <Link key={n} href={pageHref(n)} aria-current={n === page ? "page" : undefined}
              className={cn("grid h-11 min-w-11 place-items-center rounded-full px-3 font-bold transition", n === page ? "bg-ink text-white" : "hover:bg-cream")}>{n}</Link>)}
        <Link href={pageHref(page + 1)} aria-label={t("search.next")} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined} className={cn(arrow, page >= pages && off)}><ChevronRight size={18} /></Link>
      </div>
      <p className="text-sm font-semibold text-muted">{t("search.pageOf", { n: page, total: pages })}</p>
    </nav>
  );
}
