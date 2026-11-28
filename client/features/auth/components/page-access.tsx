import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import {
  accessibleDestinations,
  type Destination,
} from "@/features/dashboard/sections";
import { redirect } from "@/i18n/navigation";
import { readPageSession } from "../auth.server";
import { signedInPath } from "../route-access";
import { SessionRecovery } from "./session-recovery";

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
        className={scope === "dashboard" ? undefined : "min-h-72"}
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
