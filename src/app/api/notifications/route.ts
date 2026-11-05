import { db } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { currentUserId } from "@/lib/session";
import { json, fail } from "@/lib/api";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return json({ items: [], unread: 0 });
  await db();
  const items = await Notification.find({ user: uid }).sort({ createdAt: -1 }).limit(20).lean();
  return json({ items, unread: items.filter((i) => !i.read).length });
}

export async function POST() {
  const uid = await currentUserId();
  if (!uid) return fail("unauthorized", 401);
  await db();
  await Notification.updateMany({ user: uid, read: false }, { $set: { read: true } });
  return json({ ok: true });
}
