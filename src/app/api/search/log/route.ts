import { z } from "zod";
import { logSearch } from "@/lib/search";
import { json, handle } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const b = z.object({ q: z.string().max(120), results: z.number().int().min(0), ids: z.array(z.string()).max(10).optional() }).parse(await req.json());
    await logSearch(b.q, b.results, b.ids);
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
