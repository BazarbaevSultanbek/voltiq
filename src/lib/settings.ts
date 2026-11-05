import "server-only";
import { db } from "./db";
import { Settings } from "@/models/Settings";

export async function getSettings() {
  await db();
  const s = await Settings.findOne({ key: "global" }).lean();
  return { marginPct: s?.marginPct ?? 30, freeShippingOver: s?.freeShippingOver ?? 49 };
}
