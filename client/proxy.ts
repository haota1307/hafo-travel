import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { accessCookie, refreshCookie } from "@/lib/session-cookies";

const localize = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, locale, section] = pathname.split("/");

  if (
    hasLocale(routing.locales, locale) &&
    section === "dashboard" &&
    !request.cookies.get(accessCookie)?.value &&
    !request.cookies.get(refreshCookie)?.value
  ) {
    const target = request.nextUrl.clone();
    target.searchParams.delete("_rsc");
    const next = pathname + target.search;
    target.pathname = `/${locale}/auth/login`;
    target.search = "";
    target.searchParams.set("next", next);

    return NextResponse.redirect(target, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  return localize(request);
}

export const config = { matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)" };
