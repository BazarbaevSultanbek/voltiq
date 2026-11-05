/** Shipping from suppliers in China. Fees depend on destination zone and speed. */
export type ZoneId = "asia" | "cis" | "europe" | "namerica" | "latam" | "mideast" | "other";
export type MethodId = "standard" | "express" | "priority";

export const COUNTRIES: { code: string; name: string; zone: ZoneId }[] = [
  ["UZ", "Uzbekistan", "cis"], ["KZ", "Kazakhstan", "cis"], ["KG", "Kyrgyzstan", "cis"], ["TJ", "Tajikistan", "cis"],
  ["TM", "Turkmenistan", "cis"], ["RU", "Russia", "cis"], ["BY", "Belarus", "cis"], ["UA", "Ukraine", "cis"],
  ["AZ", "Azerbaijan", "cis"], ["AM", "Armenia", "cis"], ["GE", "Georgia", "cis"], ["MN", "Mongolia", "cis"],
  ["KR", "South Korea", "asia"], ["JP", "Japan", "asia"], ["CN", "China", "asia"], ["HK", "Hong Kong", "asia"],
  ["TW", "Taiwan", "asia"], ["SG", "Singapore", "asia"], ["MY", "Malaysia", "asia"], ["TH", "Thailand", "asia"],
  ["VN", "Vietnam", "asia"], ["PH", "Philippines", "asia"], ["ID", "Indonesia", "asia"], ["IN", "India", "asia"],
  ["PK", "Pakistan", "asia"], ["BD", "Bangladesh", "asia"], ["AU", "Australia", "asia"], ["NZ", "New Zealand", "asia"],
  ["TR", "Türkiye", "mideast"], ["AE", "United Arab Emirates", "mideast"], ["SA", "Saudi Arabia", "mideast"],
  ["QA", "Qatar", "mideast"], ["IL", "Israel", "mideast"], ["EG", "Egypt", "mideast"],
  ["GB", "United Kingdom", "europe"], ["DE", "Germany", "europe"], ["FR", "France", "europe"], ["ES", "Spain", "europe"],
  ["IT", "Italy", "europe"], ["PT", "Portugal", "europe"], ["NL", "Netherlands", "europe"], ["BE", "Belgium", "europe"],
  ["PL", "Poland", "europe"], ["SE", "Sweden", "europe"], ["NO", "Norway", "europe"], ["FI", "Finland", "europe"],
  ["DK", "Denmark", "europe"], ["CH", "Switzerland", "europe"], ["AT", "Austria", "europe"], ["CZ", "Czechia", "europe"],
  ["IE", "Ireland", "europe"], ["GR", "Greece", "europe"], ["RO", "Romania", "europe"], ["HU", "Hungary", "europe"],
  ["US", "United States", "namerica"], ["CA", "Canada", "namerica"], ["MX", "Mexico", "latam"],
  ["BR", "Brazil", "latam"], ["AR", "Argentina", "latam"], ["CL", "Chile", "latam"], ["CO", "Colombia", "latam"],
  ["PE", "Peru", "latam"], ["NG", "Nigeria", "other"], ["ZA", "South Africa", "other"], ["KE", "Kenya", "other"],
  ["MA", "Morocco", "other"],
].map(([code, name, zone]) => ({ code, name, zone: zone as ZoneId })).sort((a, b) => a.name.localeCompare(b.name));

export function countryName(code?: string | null) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code ?? "";
}

const RATES: Record<ZoneId, Record<MethodId, { base: number; perItem: number; min: number; max: number }>> = {
  asia:     { standard: { base: 2.99, perItem: 0.8, min: 7, max: 12 },  express: { base: 8.99,  perItem: 1.5, min: 4, max: 7 }, priority: { base: 16.99, perItem: 2.5, min: 2, max: 4 } },
  cis:      { standard: { base: 4.99, perItem: 1.0, min: 12, max: 20 }, express: { base: 11.99, perItem: 2.0, min: 7, max: 11 }, priority: { base: 22.99, perItem: 3.0, min: 4, max: 6 } },
  europe:   { standard: { base: 4.99, perItem: 1.0, min: 10, max: 18 }, express: { base: 12.99, perItem: 2.0, min: 6, max: 9 }, priority: { base: 24.99, perItem: 3.0, min: 3, max: 5 } },
  namerica: { standard: { base: 5.49, perItem: 1.0, min: 10, max: 16 }, express: { base: 12.99, perItem: 2.0, min: 6, max: 9 }, priority: { base: 24.99, perItem: 3.0, min: 3, max: 5 } },
  latam:    { standard: { base: 6.99, perItem: 1.5, min: 15, max: 28 }, express: { base: 15.99, perItem: 2.5, min: 8, max: 13 }, priority: { base: 29.99, perItem: 3.5, min: 5, max: 7 } },
  mideast:  { standard: { base: 5.99, perItem: 1.2, min: 12, max: 20 }, express: { base: 13.99, perItem: 2.2, min: 6, max: 10 }, priority: { base: 26.99, perItem: 3.2, min: 4, max: 6 } },
  other:    { standard: { base: 7.99, perItem: 1.5, min: 18, max: 30 }, express: { base: 17.99, perItem: 2.5, min: 9, max: 14 }, priority: { base: 32.99, perItem: 3.5, min: 5, max: 8 } },
};

export const METHODS: MethodId[] = ["standard", "express", "priority"];

export function zoneOf(country?: string | null): ZoneId {
  return COUNTRIES.find((c) => c.code === country)?.zone ?? "other";
}

function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

export type ShippingQuote = { id: MethodId; price: number; minDays: number; maxDays: number; etaFrom: string; etaTo: string; free: boolean };

export function quote(country: string | null | undefined, itemCount: number, subtotal: number, freeOver = 49, now = new Date()): ShippingQuote[] {
  const z = RATES[zoneOf(country)];
  const items = Math.max(1, itemCount);
  return METHODS.map((id) => {
    const r = z[id];
    let price = Math.round((r.base + r.perItem * (items - 1)) * 100) / 100;
    const free = id === "standard" && freeOver > 0 && subtotal >= freeOver;
    if (free) price = 0;
    // +1-2 business days handling before dispatch
    return {
      id, price, free, minDays: r.min, maxDays: r.max,
      etaFrom: addBusinessDays(now, r.min + 1).toISOString(),
      etaTo: addBusinessDays(now, r.max + 2).toISOString(),
    };
  });
}
