import { z } from "zod";
import { db } from "@/lib/db";
import { Order, ORDER_STATUSES } from "@/models/Order";
import { isAdmin } from "@/lib/admin";
import { notifyUser } from "@/lib/notify";
import { json, fail, handle } from "@/lib/api";

export async function PATCH(req: Request) {
  try {
    if (!(await isAdmin())) return fail("unauthorized", 401);
    const b = z.object({ id: z.string(), status: z.enum(ORDER_STATUSES), note: z.string().max(200).optional() }).parse(await req.json());
    await db();
    const o = await Order.findById(b.id);
    if (!o) return fail("not_found", 404);
    o.status = b.status;
    o.timeline.push({ status: b.status, at: new Date(), note: b.note || "" });
    await o.save();
    await notifyUser(o.user, "notif.orderStatus", { number: o.number, status: b.status }, "/account/orders");
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
