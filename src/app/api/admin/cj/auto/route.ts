import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { cjAutoImport, cjHideOffTopic } from "@/lib/cj";
import { json, fail } from "@/lib/api";

export const maxDuration = 60;

const Body = z.union([
  z.object({ action: z.literal("import"), category: z.string(), count: z.number().int().min(1).max(20).default(8) }),
  z.object({ action: z.literal("cleanup") }),
]);

/** Admin: import one category automatically, or hide off-topic CJ products. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  const b = Body.safeParse(await req.json());
  if (!b.success) return fail("invalid_input", 422);
  try {
    return json(b.data.action === "cleanup" ? await cjHideOffTopic() : await cjAutoImport(b.data.category, b.data.count));
  } catch (e) { return fail((e as Error).message, 400); }
}
