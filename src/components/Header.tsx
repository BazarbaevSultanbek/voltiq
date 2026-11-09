"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, Globe, MapPin, Menu, Search, ShoppingBag, User, X, LogOut, Package, LayoutGrid } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useCart, cartCount, useLocation } from "@/lib/store";
import { useMe } from "@/lib/user-context";
import { CATEGORIES, GROUPS } from "@/lib/catalog";
import { countryName } from "@/lib/shipping";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBox } from "./SearchBox";
import { CategoryIcon } from "./CategoryIcon";
import { useHydrated } from "./useHydrated";
import { cn } from "@/lib/cn";
import { formatDate } from "@/i18n/date";

type Notif = { _id: string; key: string; vars: Record<string, string>; link?: string; read: boolean; createdAt: string };

export function Header() {
  const { t, href, locale, price } = useI18n();
  const items = useCart((s) => s.items);
  const bump = useCart((s) => s.bump);
  const { place, setOpen } = useLocation();
  const { me } = useMe();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState<"lang" | "user" | "bell" | null>(null);
  const [notifs, setNotifs] = useState<{ items: Notif[]; unread: number }>({ items: [], unread: 0 });
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setMobile(false); setMega(false); setMenu(null); }, [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (headerRef.current && !headerRef.current.contains(e.target as Node)) { setMenu(null); setMega(false); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (!me) return;
    const load = () => fetch("/api/notifications").then((r) => r.json()).then(setNotifs).catch(() => {});
    load();
    const id = setInterval(load, 45000);
    window.addEventListener("vq:notify", load);
    return () => { clearInterval(id); window.removeEventListener("vq:notify", load); };
  }, [me]);

  const switchLocale = (l: Locale) => {
    document.cookie = `vq_locale=${l}; path=/; max-age=31536000; samesite=lax`;
    const rest = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
    router.push(`/${l}${rest}${window.location.search}`);
  };
  const count = hydrated ? cartCount(items) : 0;
  const notifText = (n: Notif) => {
    const vars = { ...n.vars };
    if (n.key === "notif.orderStatus" && vars.status) vars.status = t(`orders.status.${vars.status}`);
    return t(n.key, vars);
  };

  return (
    <>
      <header ref={headerRef} className={cn("sticky top-0 z-50 transition-all duration-300", scrolled ? "bg-paper/85 shadow-[0_8px_30px_-12px_rgb(0_0_0/.18)] backdrop-blur-xl" : "bg-paper")} onMouseLeave={() => setMega(false)}>
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 lg:gap-6">
          <button className="rounded-full p-2 lg:hidden" onClick={() => setMobile(true)} aria-label="Menu"><Menu /></button>
          <Link href={href("/")} aria-label="KAUP home"><Logo /></Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <button onMouseEnter={() => setMega(true)} onClick={() => setMega((v) => !v)} aria-expanded={mega}
              className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors", mega ? "bg-ink text-white" : "hover:bg-cream")}>
              <LayoutGrid size={16} />{t("nav.catalog")} <ChevronDown size={14} className={cn("transition-transform", mega && "rotate-180")} />
            </button>
            <Link href={href("/search?deals=1")} onMouseEnter={() => setMega(false)} className="rounded-full px-4 py-2 text-sm font-bold text-volt hover:bg-volt/10">{t("nav.deals")}</Link>
          </nav>

          <div className="hidden flex-1 md:block"><SearchBox /></div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button onClick={() => setOpen(true)} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-left text-xs hover:bg-cream xl:flex">
              <MapPin size={16} className="text-volt" />
              <span className="leading-tight"><span className="block text-muted">{t("nav.deliverTo")}</span>
                <span className="block max-w-[120px] truncate font-bold">{hydrated && place ? `${place.city}, ${place.country}` : "—"}</span></span>
            </button>

            <ThemeToggle labels={{ dark: t("nav.dark"), light: t("nav.light") }} />

            <div className="relative">
              <button onClick={() => setMenu(menu === "lang" ? null : "lang")} className="flex items-center gap-1 rounded-full p-2.5 text-sm font-bold hover:bg-cream" aria-label={t("nav.language")}>
                <Globe size={19} /><span className="hidden sm:inline">{locale.toUpperCase()}</span>
              </button>
              <Pop open={menu === "lang"} className="w-44">
                {locales.map((l) => (
                  <button key={l} onClick={() => switchLocale(l)} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold hover:bg-cream", l === locale && "bg-cream")}>
                    {localeNames[l]}<span className="text-xs text-muted">{l.toUpperCase()}</span>
                  </button>
                ))}
              </Pop>
            </div>

            {me && (
              <div className="relative">
                <button onClick={() => setMenu(menu === "bell" ? null : "bell")} className="relative rounded-full p-2.5 hover:bg-cream" aria-label={t("nav.notifications")}>
                  <Bell size={20} />
                  {notifs.unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-berry px-1 text-[10px] font-black text-white">{notifs.unread}</span>}
                </button>
                <Pop open={menu === "bell"} className="w-80">
                  <div className="flex items-center justify-between px-3 pb-2 pt-1">
                    <span className="font-display text-sm font-bold">{t("nav.notifications")}</span>
                    {notifs.unread > 0 && <button className="text-xs font-bold text-volt" onClick={async () => { await fetch("/api/notifications", { method: "POST" }); setNotifs((n) => ({ items: n.items.map((i) => ({ ...i, read: true })), unread: 0 })); }}>{t("nav.markAllRead")}</button>}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifs.items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">{t("nav.noNotifications")}</p>}
                    {notifs.items.map((n) => (
                      <Link key={n._id} href={href(n.link || "/account/orders")} className={cn("block rounded-xl px-3 py-2.5 text-sm hover:bg-cream", !n.read && "bg-volt/5")}>
                        <span className="flex gap-2">{!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-volt" />}<span className="font-semibold">{notifText(n)}</span></span>
                        <span className="mt-0.5 block text-xs text-muted">{formatDate(locale, n.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </Link>
                    ))}
                  </div>
                </Pop>
              </div>
            )}

            <div className="relative">
              {me ? (
                <button onClick={() => setMenu(menu === "user" ? null : "user")} className="rounded-full p-1 hover:bg-cream" aria-label={t("nav.account")}>
                  <Avatar src={me.image} name={me.name || me.email} size={34} />
                </button>
              ) : (
                <Link href={href("/login")} className="flex items-center gap-1.5 rounded-full p-2.5 text-sm font-bold hover:bg-cream"><User size={20} /><span className="hidden sm:inline">{t("nav.signIn")}</span></Link>
              )}
              <Pop open={menu === "user" && !!me} className="w-56">
                <div className="px-3 pb-2 pt-1"><p className="truncate font-bold">{me?.name}</p><p className="truncate text-xs text-muted">{me?.email}</p></div>
                <Link href={href("/account")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-cream"><User size={16} />{t("nav.profile")}</Link>
                <Link href={href("/account/orders")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-cream"><Package size={16} />{t("nav.orders")}</Link>
                <button onClick={() => signOut({ callbackUrl: href("/") })} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-berry hover:bg-berry/10"><LogOut size={16} />{t("nav.signOut")}</button>
              </Pop>
            </div>

            <Link href={href("/cart")} className="relative ml-1 flex items-center gap-2 rounded-full bg-ink py-2.5 pl-3.5 pr-4 text-sm font-bold text-white transition hover:bg-ink-3" aria-label={t("nav.cart")}>
              <motion.span key={bump} initial={{ rotate: 0 }} animate={bump ? { rotate: [0, -18, 14, -8, 0], scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.6 }}><ShoppingBag size={18} /></motion.span>
              <span className="hidden sm:inline">{t("nav.cart")}</span>
              <AnimatePresence>{count > 0 && (
                <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] font-black text-ink">{count}</motion.span>
              )}</AnimatePresence>
            </Link>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden"><SearchBox /></div>

        <AnimatePresence>
          {mega && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-full hidden border-t border-line bg-paper shadow-2xl lg:block" onMouseEnter={() => setMega(mega)}>
              <div className="mx-auto grid max-w-7xl grid-cols-5 gap-6 px-4 py-8">
                {GROUPS.map((g, gi) => (
                  <motion.div key={g} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}>
                    <Link href={href(`/search?group=${g}`)} onClick={() => setMega(false)} className="mb-3 block font-display text-sm font-bold uppercase tracking-wider text-muted hover:text-volt">{t(`nav.${g}`)}</Link>
                    <ul className="space-y-0.5">
                      {CATEGORIES.filter((c) => c.group === g).map((c) => (
                        <li key={c.slug}>
                          <Link href={href(`/search?cat=${c.slug}`)} onClick={() => setMega(false)} className="group flex items-center gap-2.5 rounded-xl p-1.5 text-sm font-semibold hover:bg-cream">
                            <CategoryIcon slug={c.slug} className="h-8 w-8 transition-transform group-hover:scale-110" size={15} />
                            <span className="min-w-0 truncate">{t(`cat.${c.slug}`)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-[70] bg-ink/50 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)}>
            <motion.aside className="h-full w-[86%] max-w-sm overflow-auto bg-paper p-5" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-center justify-between"><Logo /><button onClick={() => setMobile(false)} className="rounded-full p-2 hover:bg-cream" aria-label={t("common.close")}><X /></button></div>
              <button onClick={() => { setMobile(false); setOpen(true); }} className="mb-5 flex w-full items-center gap-2 rounded-2xl bg-cream p-3 text-left text-sm">
                <MapPin size={18} className="text-volt" /><span><span className="block text-xs text-muted">{t("nav.deliverTo")}</span><b>{hydrated && place ? `${place.city}, ${countryName(place.country)}` : "—"}</b></span>
              </button>
              {GROUPS.map((g) => (
                <div key={g} className="mb-5">
                  <p className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-muted">{t(`nav.${g}`)}</p>
                  <div className="grid gap-1.5">
                    {CATEGORIES.filter((c) => c.group === g).map((c) => (
                      <Link key={c.slug} href={href(`/search?cat=${c.slug}`)} className="flex items-center gap-2.5 rounded-xl bg-surface p-1.5 text-sm font-semibold"><CategoryIcon slug={c.slug} className="h-8 w-8" size={15} /><span className="min-w-0 break-words">{t(`cat.${c.slug}`)}</span></Link>
                    ))}
                  </div>
                </div>
              ))}
              <Link href={href("/search?deals=1")} className="btn btn-primary w-full">{t("nav.deals")}</Link>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Pop({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.16 }}
          className={cn("absolute right-0 top-full z-50 mt-2 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-2xl", className)}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const initials = name.split(/[\s@]/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return src ? (
    <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <span className="grid rounded-full bg-gradient-to-br from-volt to-berry font-display font-bold text-white ring-2 ring-white" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span className="m-auto">{initials || "?"}</span>
    </span>
  );
}
