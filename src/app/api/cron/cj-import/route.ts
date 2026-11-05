import { cjEnabled, cjDailyImport } from "@/lib/cj";
import { translatePending } from "@/lib/translate";
import { json, fail } from "@/lib/api";

export const maxDuration = 300;

/** Called daily by Vercel Cron (see vercel.json). Imports new on-topic CJ products, then translates them. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return fail("unauthorized", 401);
  const t0 = Date.now();
  const imported = cjEnabled() ? await cjDailyImport(50_000) : { skipped: "no CJ_API_KEY" };
  const translated = await translatePending({ budgetMs: 285_000 - (Date.now() - t0) });
  return json({ imported, translated });
}
