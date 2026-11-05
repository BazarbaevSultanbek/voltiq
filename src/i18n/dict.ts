import "server-only";
import type { Locale } from "./config";
import en from "./messages/en.json";

export type Dict = typeof en;

const loaders: Record<Locale, () => Promise<Dict>> = {
  en: async () => en,
  uz: () => import("./messages/uz.json").then((m) => m.default as Dict),
  ru: () => import("./messages/ru.json").then((m) => m.default as Dict),
  zh: () => import("./messages/zh.json").then((m) => m.default as Dict),
  es: () => import("./messages/es.json").then((m) => m.default as Dict),
  fr: () => import("./messages/fr.json").then((m) => m.default as Dict),
  pt: () => import("./messages/pt.json").then((m) => m.default as Dict),
};

export async function getDict(locale: Locale): Promise<Dict> {
  return loaders[locale]();
}

export function translate(dict: Dict, key: string, vars?: Record<string, string | number>): string {
  const val = key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), dict);
  let s = typeof val === "string" ? val : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
