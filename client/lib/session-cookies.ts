import { NextRequest, NextResponse } from "next/server";

const production = process.env.NODE_ENV === "production";
const prefix = production ? "__Host-" : "";
export const accessCookie = `${prefix}session_access`;
export const refreshCookie = `${prefix}session_refresh`;
export const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function sameOriginWrite(request: NextRequest) {
  const origin =
    process.env.CLIENT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (production ? undefined : request.nextUrl.origin);

  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }

  try {
    const url = new URL(origin);

    return (
      ["https:", "http:"].includes(url.protocol) &&
      request.headers.get("origin") === url.origin
    );
  } catch {
    return false;
  }
}

export function setSessionCookie(
  response: NextResponse,
  name: string,
  token: string,
  maxAge: number,
) {
  response.cookies.set(name, token, {
    path: "/",
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    maxAge,
  });
}
