import { z } from "zod";
import { db } from "@/lib/db";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { isAdmin } from "@/lib/admin";
import { validPhone } from "@/lib/phone";
import { json, fail, handle } from "@/lib/api";

const Patch = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/),
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,30}$/).or(z.literal("")).optional(),
  phone: z.string().trim().max(30).refine((v) => v === "" || validPhone(v), "invalid_phone").optional(),
});

/** Admin: edit a customer's name, email, username or phone. */
export async function PATCH(req: Request) {
  try {
    if (!(await isAdmin())) return fail("unauthorized", 401);
    const { id, ...b } = Patch.parse(await req.json());
    await db();
    const u = await User.findById(id);
    if (!u) return fail("not_found", 404);
    if (b.email && b.email !== u.email && (await User.exists({ email: b.email }))) return fail("email_taken", 409);
    if (b.username && b.username !== u.username && (await User.exists({ username: b.username }))) return fail("username_taken", 409);
    if (b.name !== undefined) u.name = b.name;
    if (b.email !== undefined) u.email = b.email;
    if (b.phone !== undefined) u.phone = b.phone;
    if (b.username !== undefined) u.username = b.username || undefined;
    await u.save();
    return json({ ok: true });
  } catch (e) { return handle(e); }
}

/** Admin: delete a customer account. Their past orders are kept (each order stores its own email and address). */
export async function DELETE(req: Request) {
  try {
    if (!(await isAdmin())) return fail("unauthorized", 401);
    const { id } = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) }).parse(await req.json());
    await db();
    const r = await User.deleteOne({ _id: id });
    if (!r.deletedCount) return fail("not_found", 404);
    await Notification.deleteMany({ user: id });
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
