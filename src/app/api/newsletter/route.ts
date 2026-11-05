import { z } from "zod";
import mongoose from "mongoose";
import { db } from "@/lib/db";
import { json, handle } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(await req.json());
    await db();
    await mongoose.connection.collection("subscribers").updateOne({ email: email.toLowerCase() }, { $setOnInsert: { email: email.toLowerCase(), createdAt: new Date() } }, { upsert: true });
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
