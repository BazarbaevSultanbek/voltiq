import { z } from "zod";
import { db } from "@/lib/db";
import { Product } from "@/models/Product";
import { json, handle } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const b = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/), type: z.enum(["view", "cart"]) }).parse(await req.json());
    await db();
    await Product.updateOne({ _id: b.id }, { $inc: b.type === "view" ? { views: 1 } : { cartAdds: 1 } });
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
