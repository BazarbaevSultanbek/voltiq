import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { cjSendOrder, cjSyncOrder } from "@/lib/cj";
import { json, fail } from "@/lib/api";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  const b = z.object({ id: z.string(), action: z.enum(["send", "sync"]) }).safeParse(await req.json());
  if (!b.success) return fail("invalid_input", 422);
  try {
    const o = b.data.action === "send" ? await cjSendOrder(b.data.id) : await cjSyncOrder(b.data.id);
    return json({ supplier: o?.supplier ?? null });
  } catch (e) { return fail((e as Error).message, 400); }
}
