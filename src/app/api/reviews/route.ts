import { z } from "zod";
import { db } from "@/lib/db";
import { Review } from "@/models/Review";
import { currentUserId } from "@/lib/session";
import { hasBought, upsertReview } from "@/lib/reviews";
import { json, fail, handle } from "@/lib/api";

const Id = z.string().regex(/^[a-f0-9]{24}$/);

/** GET ?product=<id> → whether the signed-in user can review it, and their existing review. */
export async function GET(req: Request) {
  try {
    const product = Id.parse(new URL(req.url).searchParams.get("product"));
    const uid = await currentUserId();
    if (!uid) return json({ signedIn: false, canReview: false, mine: null });
    await db();
    const [bought, mine] = await Promise.all([hasBought(uid, product), Review.findOne({ product, user: uid }).select("rating text").lean()]);
    return json({ signedIn: true, canReview: bought, mine: mine ? { rating: mine.rating, text: mine.text } : null });
  } catch (e) { return handle(e); }
}

/** POST { product, rating, text } → create or update the signed-in buyer's review. */
export async function POST(req: Request) {
  try {
    const uid = await currentUserId();
    if (!uid) return fail("unauthorized", 401);
    const b = z.object({ product: Id, rating: z.number().int().min(1).max(5), text: z.string().trim().max(2000).default("") }).parse(await req.json());
    if (!(await hasBought(uid, b.product))) return fail("not_a_buyer", 403);
    await upsertReview(uid, b.product, b.rating, b.text);
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
