import { z } from "zod";
import { db } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { Product } from "@/models/Product";
import { isAdmin } from "@/lib/admin";
import { priceProduct } from "@/lib/pricing";
import { json, fail, handle } from "@/lib/api";

export async function PATCH(req: Request) {
  try {
    if (!(await isAdmin())) return fail("unauthorized", 401);
    const b = z.object({ marginPct: z.number().min(0).max(500), freeShippingOver: z.number().min(0).max(10000) }).parse(await req.json());
    await db();
    await Settings.updateOne({ key: "global" }, { $set: b }, { upsert: true });
    // Re-price every product that follows the global margin
    const products = await Product.find({}).select("costPrice supplierCompareAt marginPct").lean();
    const ops = products.map((p) => ({ updateOne: { filter: { _id: p._id }, update: { $set: priceProduct(p, b.marginPct) } } }));
    if (ops.length) await Product.bulkWrite(ops);
    return json({ ok: true, repriced: ops.length });
  } catch (e) { return handle(e); }
}
