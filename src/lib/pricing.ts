/** Retail price = supplier cost + profit margin, rounded to a .99 "charm" price. */
export function charm(v: number) {
  if (v <= 0) return 0;
  const p = Math.ceil(v) - 0.01;
  return Math.round(Math.max(p, 0.99) * 100) / 100;
}

export function retailFrom(cost: number, marginPct: number) {
  return charm(cost * (1 + marginPct / 100));
}

export function priceProduct(
  p: { costPrice?: number | null; supplierCompareAt?: number | null; marginPct?: number | null },
  globalMargin: number,
) {
  const m = p.marginPct ?? globalMargin;
  const cost = p.costPrice ?? 0;
  const price = retailFrom(cost, m);
  const sc = p.supplierCompareAt ?? 0;
  const compareAt = sc > cost ? retailFrom(sc, m) : 0;
  return { price, compareAt: compareAt > price ? compareAt : 0 };
}
