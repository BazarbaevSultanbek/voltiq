export type Brand = "visa" | "mastercard" | "unionpay" | "amex" | "discover" | "jcb" | "diners" | "mir" | "unknown";
export const ALLOWED_BRANDS: Brand[] = ["visa", "mastercard", "unionpay"];

export function detectBrand(num: string): Brand {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720))/.test(n)) return "mastercard";
  if (/^62/.test(n) || /^81/.test(n)) return "unionpay";
  if (/^3[47]/.test(n)) return "amex";
  if (/^220[0-4]/.test(n)) return "mir";
  if (/^(6011|65|64[4-9])/.test(n)) return "discover";
  if (/^35/.test(n)) return "jcb";
  if (/^3(0[0-5]|[68])/.test(n)) return "diners";
  return "unknown";
}

export function luhn(num: string) {
  const n = num.replace(/\D/g, "");
  if (n.length < 13 || n.length > 19) return false;
  let sum = 0, alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

export function validExpiry(exp: string, now = new Date()) {
  const m = exp.replace(/\s/g, "").match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > now;
}

export function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}
