import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getApiBaseUrl } from "@/lib/api-url";
import {
  accessCookie,
  jwtPattern,
  refreshCookie,
  sameOriginWrite,
  setSessionCookie,
} from "@/lib/session-cookies";

const TokenPairSchema = z.object({
  accessToken: z.string().regex(jwtPattern),
  refreshToken: z.string().regex(jwtPattern),
  accessExpiresIn: z.number().int().positive().max(300),
  refreshExpiresIn: z.number().int().positive(),
});

function reply(status: number, message: string) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;

  if (!["login", "refresh", "logout"].includes(action)) {
    return reply(404, "NOT_FOUND");
  }
  if (!sameOriginWrite(request)) {
    return reply(403, "ORIGIN_DENIED");
  }

  const refreshToken = request.cookies.get(refreshCookie)?.value;
  let body: unknown = { refreshToken };

  if (action === "login") {
    try {
      const input = await request.json();

      if (
        typeof input?.email !== "string" ||
        typeof input?.password !== "string"
      ) {
        return reply(400, "INVALID_LOGIN");
      }

      body = { email: input.email.trim(), password: input.password };
    } catch {
      return reply(400, "INVALID_LOGIN");
    }
  } else if (action === "refresh" && !refreshToken) {
    return reply(401, "SESSION_EXPIRED");
  }

  try {
    const result = reply(200, "OK");

    if (action !== "logout" || refreshToken) {
      const upstream = await fetch(`${getApiBaseUrl()}/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        redirect: "error",
        signal: request.signal,
      });

      if (!upstream.ok) {
        const response = reply(upstream.status, "AUTH_REQUEST_FAILED");
        const retry =
          upstream.headers.get("retry-after") ??
          upstream.headers.get("retry-after-account");

        if (retry) {
          response.headers.set("Retry-After", retry);
        }

        return response;
      }

      if (action !== "logout") {
        const pair = TokenPairSchema.parse((await upstream.json()).data);
        setSessionCookie(
          result,
          accessCookie,
          pair.accessToken,
          pair.accessExpiresIn,
        );
        setSessionCookie(
          result,
          refreshCookie,
          pair.refreshToken,
          pair.refreshExpiresIn,
        );

        return result;
      }
    }

    setSessionCookie(result, accessCookie, "", 0);
    setSessionCookie(result, refreshCookie, "", 0);

    return result;
  } catch {
    return reply(502, "BACKEND_UNAVAILABLE");
  }
}
