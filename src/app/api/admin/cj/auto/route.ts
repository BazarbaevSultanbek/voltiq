import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { cjAutoImport, cjHideOffTopic } from "@/lib/cj";
import { db } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { json, fail } from "@/lib/api";

export const maxDuration = 60;

const Body = z.union([
  z.object({ action: z.literal("import"), category: z.string(), count: z.number().int().min(1).max(20).default(8) }),
  z.object({ action: z.literal("cleanup") }),
  z.object({ action: z.literal("settings"), enabled: z.boolean(), target: z.number().int().min(5).max(500) }),
]);

/** Admin: import one category, hide off-topic CJ products, or change the daily auto-import settings. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  const b = Body.safeParse(await req.json());
  if (!b.success) return fail("invalid_input", 422);
  try {
    const a = b.data;
    if (a.action === "settings") {
      await db();
      await Settings.updateOne({ key: "global" }, { $set: { cjAutoImport: a.enabled, cjAutoImportTarget: a.target } }, { upsert: true });
      return json({ ok: true });
    }
    return json(a.action === "cleanup" ? await cjHideOffTopic() : await cjAutoImport(a.category, a.count));
  } catch (e) { return fail((e as Error).message, 400); }
}
