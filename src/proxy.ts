import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale, isLocale } from "@/i18n/config";

/** English unless the visitor picked another language before (saved in a cookie). */
function pickLocale(req: NextRequest) {
  const saved = req.cookies.get("vq_locale")?.value;
  return isLocale(saved) ? saved : defaultLocale;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const has = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (has) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|admin|_next|products|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)"],
};
