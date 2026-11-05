import { z } from "zod";
import { checkAdminCredentials, setAdminSession } from "@/lib/admin";
import { json, fail } from "@/lib/api";

const attempts = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const a = attempts.get(ip);
  if (a && a.n >= 8 && Date.now() - a.t < 10 * 60_000) return fail("too_many_attempts", 429);
  const b = z.object({ login: z.string(), password: z.string() }).safeParse(await req.json());
  if (!b.success || !checkAdminCredentials(b.data.login, b.data.password)) {
    attempts.set(ip, { n: (a?.n ?? 0) + 1, t: Date.now() });
    return fail("invalid_credentials", 401);
  }
  attempts.delete(ip);
  await setAdminSession();
  return json({ ok: true });
}
