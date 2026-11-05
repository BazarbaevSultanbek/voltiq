import { z } from "zod";
import { confirmOrder } from "@/lib/orders";
import { currentUserId } from "@/lib/session";
import { json, fail, handle } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const uid = await currentUserId();
    if (!uid) return fail("unauthorized", 401);
    const { orderId } = z.object({ orderId: z.string() }).parse(await req.json());
    const r = await confirmOrder(uid, orderId);
    return json({ orderId: String(r.order._id), number: r.order.number });
  } catch (e) { return handle(e); }
}
