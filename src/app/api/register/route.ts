import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { User } from "@/models/User";
import { notifyUser } from "@/lib/notify";
import { json, fail, handle } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const b = z.object({ name: z.string().trim().min(1).max(80), email: z.string().email(), password: z.string().min(8).max(128) }).parse(await req.json());
    await db();
    const email = b.email.toLowerCase();
    if (await User.exists({ email })) return fail("exists", 409);
    const u = await User.create({ email, name: b.name, passwordHash: await bcrypt.hash(b.password, 11), providers: ["credentials"] });
    await notifyUser(u._id, "notif.welcome", { name: b.name });
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
