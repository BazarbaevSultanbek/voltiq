import { z } from "zod";
import { db } from "@/lib/db";
import { User } from "@/models/User";
import { currentUserId } from "@/lib/session";
import { json, fail, handle } from "@/lib/api";

export async function GET() {
  const id = await currentUserId();
  if (!id) return json({ user: null });
  await db();
  const u = await User.findById(id).select("+passwordHash").lean();
  if (!u) return json({ user: null });
  const { passwordHash, ...rest } = u;
  return json({ user: { ...rest, _id: String(u._id), hasPassword: !!passwordHash } });
}

const Patch = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,24}$/).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  image: z.string().max(400_000).optional(), // data URL (resized on client) or https URL
  locale: z.string().max(5).optional(),
});

export async function PATCH(req: Request) {
  try {
    const id = await currentUserId();
    if (!id) return fail("unauthorized", 401);
    const body = Patch.parse(await req.json());
    if (body.image && !(body.image === "" || body.image.startsWith("data:image/") || body.image.startsWith("https://"))) return fail("invalid_image");
    await db();
    if (body.username) {
      const taken = await User.exists({ username: body.username, _id: { $ne: id } });
      if (taken) return fail("username_taken", 409);
    }
    const update: Record<string, unknown> = { ...body };
    const unset: Record<string, 1> = {};
    if (body.username === "") { delete update.username; unset.username = 1; }
    await User.updateOne({ _id: id }, { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
