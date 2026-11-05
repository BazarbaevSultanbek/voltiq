import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { db } from "./db";
import { Product } from "@/models/Product";
import { locales, type Locale } from "@/i18n/config";

/** Languages product text is translated into (English is the source). */
export const TARGETS = locales.filter((l) => l !== "en") as Exclude<Locale, "en">[];
const NAMES: Record<(typeof TARGETS)[number], string> = {
  uz: "Uzbek (Latin script, as used in Uzbekistan today)", ru: "Russian", zh: "Simplified Chinese",
  es: "Spanish", fr: "French", pt: "Brazilian Portuguese",
};

export const translateEnabled = () => !!process.env.ANTHROPIC_API_KEY;
const MODEL = () => process.env.TRANSLATE_MODEL || "claude-opus-5-5";

let _client: Anthropic | null = null;
const client = () => (_client ??= new Anthropic());

const Out = z.object({ title: z.string(), description: z.string() });

const SYSTEM = `You translate product listings for KAUP, an online store for phone and PC accessories.
Translate the product title and description from English into the language the user names.
- Write natural, fluent text a shopper in that country would expect; don't translate word for word.
- Keep brand names, model numbers, units and technical terms such as USB-C, PD, GaN, RGB, mAh, W, GB, TWS exactly as written.
- The title must stay short and clear (at most 120 characters); drop supplier filler such as "Hot sale", "2024 new", "dropshipping" or repeated keywords.
- The description is plain text: keep its line breaks and list structure, translate everything else.
- Return only the translation in the requested fields.`;

/** Translate one product's title + description into one language. */
async function translateOne(title: string, description: string, lang: (typeof TARGETS)[number]) {
  const model = MODEL();
  // If the model declines, the API retries on a suitable fallback model in the same call
  // (not available for Haiku, which has no server-side fallback).
  const fallback = /haiku/i.test(model) ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
  const res = await client().beta.messages.parse({
    model,
    max_tokens: 16000,
    ...fallback,
    output_config: { effort: "low", format: betaZodOutputFormat(Out) },
    system: SYSTEM,
    messages: [{ role: "user", content: `Target language: ${NAMES[lang]}\n\nTitle:\n${title}\n\nDescription:\n${description}` }],
  });
  if (res.stop_reason === "refusal") throw new Error(`refused (${res.stop_details?.category ?? "unknown"})`);
  if (res.stop_reason === "max_tokens") throw new Error("output cut off");
  const out = res.parsed_output;
  if (!out?.title.trim()) throw new Error("empty translation");
  return { title: out.title.trim().slice(0, 160), description: out.description.trim() };
}

/** Translate one product into every language that's still missing. Saves whatever succeeded. */
export async function translateProduct(id: string) {
  const p = await Product.findById(id).select("title description tr").lean();
  if (!p) return { ok: false, failed: TARGETS.length };
  const tr: Record<string, { title: string; description: string }> = { ...((p.tr as object) ?? {}) };
  const missing = TARGETS.filter((l) => !tr[l]?.title);
  const results = await Promise.allSettled(missing.map((l) => translateOne(p.title, p.description || p.title, l)));
  let failed = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") tr[missing[i]] = r.value;
    else { failed++; console.error(`[translate] ${id} ${missing[i]}:`, (r.reason as Error)?.message); }
  });
  await Product.updateOne({ _id: id }, { $set: { tr, trDone: failed === 0 } });
  return { ok: failed === 0, failed };
}

/**
 * Translate products that aren't fully translated yet, a few at a time, until the
 * time budget runs out. Returns how many are left so callers can loop.
 */
export async function translatePending({ budgetMs = 240_000, max = 1000, parallel = 3 } = {}) {
  if (!translateEnabled()) return { translated: 0, failed: 0, remaining: -1, disabled: true };
  await db();
  const t0 = Date.now();
  let translated = 0, failed = 0;
  const tried = new Set<string>();
  while (translated + failed < max && Date.now() - t0 < budgetMs - 60_000) {
    const batch = await Product.find({ trDone: { $ne: true }, active: true, _id: { $nin: [...tried] } })
      .sort({ sold: -1, views: -1, createdAt: -1 }).limit(Math.min(parallel, max - translated - failed)).select("_id").lean();
    if (!batch.length) break;
    batch.forEach((b) => tried.add(String(b._id)));
    const rs = await Promise.all(batch.map((b) => translateProduct(String(b._id)).catch(() => ({ ok: false, failed: 1 }))));
    for (const r of rs) r.ok ? translated++ : failed++;
  }
  const remaining = await Product.countDocuments({ trDone: { $ne: true }, active: true });
  return { translated, failed, remaining };
}
