import { cjEnabled, cjSyncOpenOrders } from "@/lib/cj";
import { json, fail } from "@/lib/api";

export const maxDuration = 60;

/** Called daily by Vercel Cron (see vercel.json). Pulls tracking numbers from CJ. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return fail("unauthorized", 401);
  if (!cjEnabled()) return json({ skipped: true });
  return json(await cjSyncOpenOrders(40));
}
