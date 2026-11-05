/** Phone numbers: digits with optional +, spaces, dashes, dots or brackets; 7–15 digits (E.164 max). */
export function validPhone(raw: string | undefined | null) {
  const s = (raw ?? "").trim();
  if (!/^\+?[\d\s().-]+$/.test(s)) return false;
  const digits = s.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}
