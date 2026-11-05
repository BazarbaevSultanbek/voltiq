import "server-only";
import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null; seeded?: Promise<void> | null };
const g = globalThis as unknown as { __mongoose?: Cache; __memUri?: Promise<string> };
const cache: Cache = (g.__mongoose ??= { conn: null, promise: null, seeded: null });

async function resolveUri(): Promise<string> {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_MEMORY_DB) {
    throw new Error("MONGODB_URI is not set. Add it in your Vercel project → Settings → Environment Variables.");
  }
  // Local development fallback: an in-memory MongoDB so the store runs with zero setup.
  g.__memUri ??= (async () => {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    console.log("[db] Using in-memory MongoDB (set MONGODB_URI to use Atlas)");
    return server.getUri("kaup");
  })();
  return g.__memUri;
}

export async function db() {
  if (cache.conn) return cache.conn;
  cache.promise ??= resolveUri().then((uri) =>
    mongoose.connect(uri, { bufferCommands: false, dbName: process.env.MONGODB_DB || "kaup", maxPoolSize: 10 }),
  );
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  cache.seeded ??= import("./seed").then((m) => m.ensureSetup()).catch((e) => {
    cache.seeded = null;
    console.error("[db] setup failed", e);
  });
  await cache.seeded;
  return cache.conn;
}

/** Convert lean Mongo docs into plain JSON-safe objects for client components. */
export function plain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
