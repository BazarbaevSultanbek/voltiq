import { searchProducts } from "@/lib/search";
import { json } from "@/lib/api";

export async function GET(req: Request) {
  const s = new URL(req.url).searchParams;
  const num = (k: string) => (s.get(k) ? Number(s.get(k)) : undefined);
  const r = await searchProducts({
    q: s.get("q") || "", cat: s.get("cat") || undefined, group: s.get("group") || undefined,
    min: num("min"), max: num("max"), deals: s.get("deals") === "1", sort: (s.get("sort") as never) || "relevance",
    limit: num("limit") ?? 200, locale: s.get("locale") || "en",
  });
  return json(r);
}
