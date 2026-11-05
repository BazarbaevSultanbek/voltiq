import { cjEnabled, cjSyncOpenOrders } from "@/lib/cj";
import { translatePending } from "@/lib/translate";
import { json, fail } from "@/lib/api";

export const maxDuration = 300;

/** Called daily by Vercel Cron (see vercel.json). Pulls tracking numbers from CJ, then translates leftover products. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return fail("unauthorized", 401);
  const t0 = Date.now();
  const synced = cjEnabled() ? await cjSyncOpenOrders(40) : { skipped: true };
  // Use the rest of the run to translate any products still missing translations.
  const translated = await translatePending({ budgetMs: 285_000 - (Date.now() - t0) });
  return json({ synced, translated });
}
