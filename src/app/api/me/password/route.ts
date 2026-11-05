import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { User } from "@/models/User";
import { currentUserId } from "@/lib/session";
import { json, fail, handle } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const id = await currentUserId();
    if (!id) return fail("unauthorized", 401);
    const { current, next } = z.object({ current: z.string().optional(), next: z.string().min(8).max(128) }).parse(await req.json());
    await db();
    const u = await User.findById(id).select("+passwordHash");
    if (!u) return fail("unauthorized", 401);
    if (u.passwordHash && !(await bcrypt.compare(current || "", u.passwordHash))) return fail("wrong_password", 403);
    u.passwordHash = await bcrypt.hash(next, 11);
    if (!u.providers.includes("credentials")) u.providers.push("credentials");
    await u.save();
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
