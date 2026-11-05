import { db } from "@/lib/db";
import { Order } from "@/models/Order";
import { currentUserId } from "@/lib/session";
import { json, fail } from "@/lib/api";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return fail("unauthorized", 401);
  await db();
  const items = await Order.find({ user: uid, status: { $ne: "pending_payment" } }).sort({ createdAt: -1 }).lean();
  return json({ items });
}
