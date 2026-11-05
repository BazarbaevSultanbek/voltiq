"use client";
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { Dict } from "./dict";

type Ctx = {
  locale: Locale;
  dict: Dict;
  t: (key: string, vars?: Record<string, string | number>) => string;
  price: (usd: number) => string;
  href: (path: string) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

function lookup(dict: Dict, key: string) {
  return key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), dict);
}

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => {
    const nf = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { style: "currency", currency: "USD" });
    return {
      locale,
      dict,
      t: (key, vars) => {
        const v = lookup(dict, key);
        let s = typeof v === "string" ? v : key;
        if (vars) for (const [k, val] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(val));
        return s;
      },
      price: (usd) => nf.format(usd),
      href: (path) => `/${locale}${path === "/" ? "" : path}`,
    };
  }, [locale, dict]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
