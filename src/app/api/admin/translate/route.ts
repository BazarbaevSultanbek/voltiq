import { isAdmin } from "@/lib/admin";
import { translatePending, translateEnabled } from "@/lib/translate";
import { json, fail } from "@/lib/api";

export const maxDuration = 300;

/** Admin: translate a few untranslated products; the admin page calls this repeatedly until none are left. */
export async function POST() {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!translateEnabled()) return fail("Add ANTHROPIC_API_KEY in Vercel to enable translation.", 400);
  return json(await translatePending({ budgetMs: 120_000, max: 6 }));
}
