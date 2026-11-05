import { cjEnabled, cjDailyImport } from "@/lib/cj";
import { json, fail } from "@/lib/api";

export const maxDuration = 60;

/** Called daily by Vercel Cron (see vercel.json). Imports new on-topic CJ products automatically. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return fail("unauthorized", 401);
  if (!cjEnabled()) return json({ skipped: "no CJ_API_KEY" });
  return json(await cjDailyImport());
}
