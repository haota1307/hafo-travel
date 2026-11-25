import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { cache, type ReactNode } from "react";
import { redirect } from "@/i18n/navigation";
import http, { HttpError } from "@/lib/http";
import { accessCookie, jwtPattern, refreshCookie } from "@/lib/session-cookies";
import { SessionSchema } from "../auth.schema";
import {
  accessibleDestinations,
  type Destination,
} from "@/features/dashboard/sections";
import { signedInPath } from "../route-access";
import { SessionRecovery } from "./session-recovery";

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

export async function PageAccess({
  scope,
  next,
  destination,
  children,
}: {
  next?: string;
  children: ReactNode;
} & (
  | { scope: "dashboard"; destination: Destination }
  | { scope: "guest" | "account"; destination?: never }
)) {
  const [session, locale] = await Promise.all([readPageSession(), getLocale()]);

  if (session === "renew" || session === "unavailable") {
    return (
      <SessionRecovery
        unavailable={session === "unavailable"}
        guest={scope === "guest"}
      >
        {scope === "guest" ? children : null}
      </SessionRecovery>
    );
  }

  if (!session && scope !== "guest") {
    return redirect({ href: "/auth/login", locale });
  }

  if (session && scope === "guest") {
    return redirect({
      href: signedInPath(session.permissions, locale, next),
      locale,
    });
  }

  if (
    scope === "dashboard" &&
    !accessibleDestinations(session?.permissions ?? []).includes(destination)
  ) {
    return redirect({ href: "/", locale });
  }

  return children;
}
