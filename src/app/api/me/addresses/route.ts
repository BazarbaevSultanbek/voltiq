import { db } from "@/lib/db";
import { User } from "@/models/User";
import { currentUserId } from "@/lib/session";
import { json, fail } from "@/lib/api";

export async function DELETE(req: Request) {
  const id = await currentUserId();
  if (!id) return fail("unauthorized", 401);
  const aid = new URL(req.url).searchParams.get("id");
  await db();
  await User.updateOne({ _id: id }, { $pull: { addresses: { _id: aid } } });
  return json({ ok: true });
}
