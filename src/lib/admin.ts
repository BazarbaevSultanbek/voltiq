import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "vq_admin";
const secret = () => process.env.ADMIN_SECRET || process.env.AUTH_SECRET || "dev-admin-secret";
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

export function checkAdminCredentials(login: string, password: string) {
  const L = process.env.ADMIN_LOGIN || "admin";
  const P = process.env.ADMIN_PASSWORD || "admin";
  const eq = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  return eq(login, L) && eq(password, P);
}

export async function setAdminSession() {
  const exp = String(Date.now() + 1000 * 60 * 60 * 12);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || sign(exp) !== sig) return false;
  return Number(exp) > Date.now();
}
