import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import http, { HttpError } from "@/lib/http";
import { accessCookie, jwtPattern, refreshCookie } from "@/lib/session-cookies";
import { SessionSchema } from "./auth.schema";

export const readPageSession = cache(async () => {
  const jar = await cookies();
  const token = jar.get(accessCookie)?.value;

  if (token && jwtPattern.test(token)) {
    try {
      const { payload } = await http.get("/user/me", {
        headers: { Authorization: `Bearer ${token}` },
        redirect: "error",
      });

      return SessionSchema.parse(payload);
    } catch (error) {
      if (!(error instanceof HttpError && error.status === 401)) {
        return "unavailable" as const;
      }
    }
  }

  return jar.get(refreshCookie)?.value ? ("renew" as const) : null;
});
