import { z } from "zod";
import { db } from "@/lib/db";
import { Product } from "@/models/Product";
import { isAdmin } from "@/lib/admin";
import { getSettings } from "@/lib/settings";
import { priceProduct } from "@/lib/pricing";
import { CATEGORIES } from "@/lib/catalog";
import { json, fail, handle } from "@/lib/api";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);

const Create = z.object({
  title: z.string().min(3).max(140), description: z.string().max(4000).default(""),
  category: z.string(), costPrice: z.number().positive(), supplierCompareAt: z.number().min(0).default(0),
  marginPct: z.number().min(0).max(500).nullable().optional(),
  images: z.array(z.string().url()).min(1).max(8), sourceUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]), stock: z.number().int().min(0).default(100),
});

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) return fail("unauthorized", 401);
    const b = Create.parse(await req.json());
    const cat = CATEGORIES.find((c) => c.slug === b.category);
    if (!cat) return fail("bad_category");
    await db();
    const { marginPct } = await getSettings();
    const pricing = priceProduct(b, marginPct);
    const p = await Product.create({ ...b, ...pricing, group: cat.group, source: "manual", slug: `${slugify(b.title)}-${Date.now().toString(36).slice(-4)}` });
    return json({ ok: true, id: String(p._id) });
  } catch (e) { return handle(e); }
}

const Patch = z.object({
  id: z.string(), active: z.boolean().optional(), featured: z.boolean().optional(),
  costPrice: z.number().positive().optional(), marginPct: z.number().min(0).max(500).nullable().optional(), stock: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request) {
  try {
    if (!(await isAdmin())) return fail("unauthorized", 401);
    const b = Patch.parse(await req.json());
    await db();
    const p = await Product.findById(b.id);
    if (!p) return fail("not_found", 404);
    Object.assign(p, Object.fromEntries(Object.entries(b).filter(([k, v]) => k !== "id" && v !== undefined)));
    const { marginPct } = await getSettings();
    Object.assign(p, priceProduct(p, marginPct));
    await p.save();
    return json({ ok: true, price: p.price });
  } catch (e) { return handle(e); }
}
