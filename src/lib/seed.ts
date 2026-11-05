import "server-only";
import { Product } from "@/models/Product";
import { Settings } from "@/models/Settings";

/**
 * Runs once per server instance on first DB connection.
 * - Makes sure the global settings document exists.
 * - Removes the old built-in demo catalog (source: "seed"). The store only
 *   shows products you import (CJ / AliExpress) or add manually in /admin.
 *   Past orders keep their own copy of title/image/price, so they are unaffected.
 */
export async function ensureSetup() {
  if (!(await Settings.exists({ key: "global" }))) {
    await Settings.create({ key: "global", marginPct: Number(process.env.DEFAULT_MARGIN_PCT ?? 30) });
  }
  const { deletedCount } = await Product.deleteMany({ source: "seed" });
  if (deletedCount) console.log(`[setup] removed ${deletedCount} demo products`);
}
