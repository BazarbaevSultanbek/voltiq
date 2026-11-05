/**
 * Format a date for the visitor's language. Browsers have no Uzbek month names
 * (they print "2026 M11 1"), so Uzbek is formatted here; other languages use Intl.
 */
const UZ_LONG = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const UZ_DAYS = ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"];

export function formatDate(locale: string, value: string | number | Date, o: Intl.DateTimeFormatOptions) {
  const d = new Date(value);
  if (locale !== "uz") return d.toLocaleString(locale === "zh" ? "zh-CN" : locale, o);
  const parts: string[] = [];
  if (o.weekday) parts.push(`${UZ_DAYS[d.getDay()]},`);
  const month = o.month ? (o.month === "long" ? UZ_LONG : UZ_SHORT)[d.getMonth()] : "";
  if (o.day && month) parts.push(`${d.getDate()}-${month}`);
  else if (month) parts.push(month);
  if (o.year) parts.push(String(d.getFullYear()));
  if (o.hour) parts.push(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  return parts.join(" ");
}
