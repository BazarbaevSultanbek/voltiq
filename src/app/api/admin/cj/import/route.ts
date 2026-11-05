import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { cjImport } from "@/lib/cj";
import { json, fail } from "@/lib/api";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  const b = z.object({ keywords: z.string().min(2), category: z.string(), count: z.number().int().min(1).max(20).default(10) }).safeParse(await req.json());
  if (!b.success) return fail("invalid_input", 422);
  try { return json(await cjImport(b.data.keywords, b.data.category, b.data.count)); }
  catch (e) { return fail((e as Error).message, 400); }
}
