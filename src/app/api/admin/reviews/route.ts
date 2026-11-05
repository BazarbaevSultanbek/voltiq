import { z } from "zod";
import { db } from "@/lib/db";
import { Review } from "@/models/Review";
import { isAdmin } from "@/lib/admin";
import { refreshRating } from "@/lib/reviews";
import { json, fail, handle } from "@/lib/api";

/** Admin: delete a review (e.g. spam or abuse). */
export async function DELETE(req: Request) {
  try {
    if (!(await isAdmin())) return fail("unauthorized", 401);
    const { id } = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) }).parse(await req.json());
    await db();
    const r = await Review.findByIdAndDelete(id).lean();
    if (!r) return fail("not_found", 404);
    await refreshRating(String(r.product));
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
