import { isAdmin } from "@/lib/admin";
import { cjSyncOpenOrders } from "@/lib/cj";
import { json, fail } from "@/lib/api";

export const maxDuration = 60;

export async function POST() {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  try { return json(await cjSyncOpenOrders(25)); } catch (e) { return fail((e as Error).message, 400); }
}
