export const locales = ["en", "uz", "ru", "zh", "es", "fr", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeNames: Record<Locale, string> = {
  en: "English",
  uz: "O‘zbekcha",
  ru: "Русский",
  zh: "中文",
  es: "Español",
  fr: "Français",
  pt: "Português",
};
export const localeFlags: Record<Locale, string> = {
  en: "EN", uz: "UZ", ru: "RU", zh: "中", es: "ES", fr: "FR", pt: "PT",
};
export const htmlLang: Record<Locale, string> = {
  en: "en", uz: "uz", ru: "ru", zh: "zh-CN", es: "es", fr: "fr", pt: "pt",
};
export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}
