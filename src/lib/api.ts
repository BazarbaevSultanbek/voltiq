import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
export function handle(e: unknown) {
  if (e instanceof ZodError) return fail("invalid_input", 422);
  const err = e as { code?: string; status?: number; message?: string };
  if (err?.status && err.code) return fail(err.code, err.status);
  console.error(e);
  return fail("server_error", 500);
}
