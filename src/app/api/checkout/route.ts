import { CheckoutInput, createOrder } from "@/lib/orders";
import { currentUserId } from "@/lib/session";
import { json, fail, handle } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const uid = await currentUserId();
    if (!uid) return fail("unauthorized", 401);
    const input = CheckoutInput.parse(await req.json());
    const r = await createOrder(uid, input);
    if ("requiresAction" in r) return json(r);
    return json({ orderId: String(r.order._id), number: r.order.number });
  } catch (e) { return handle(e); }
}
