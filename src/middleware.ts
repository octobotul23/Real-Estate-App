import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";

/** Sends locale-less paths to /en or /ro, picking Romanian for Romanian browsers. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;

  const prefersRo = /^ro\b|,\s*ro\b/i.test(request.headers.get("accept-language") ?? "");
  const locale = prefersRo ? "ro" : defaultLocale;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
