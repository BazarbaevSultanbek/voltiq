import { clearAdminSession } from "@/lib/admin";
import { json } from "@/lib/api";
export async function POST() { await clearAdminSession(); return json({ ok: true }); }
