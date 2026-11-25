"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import { authApiRequest } from "../auth.api";
import { AuthErrorToast } from "./auth-error-toast";

export function SessionRecovery({
  unavailable,
  guest,
  children,
}: {
  unavailable: boolean;
  guest: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [status, setStatus] = useState<"loading" | "guest" | "error">(
    unavailable ? "error" : "loading",
  );

  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    const controller = new AbortController();

    async function recover() {
      try {
        const session = await authApiRequest.session(controller.signal);

        if (controller.signal.aborted) {
          return;
        }
        if (session) {
          window.location.reload();

          return;
        }
        if (guest) {
          setStatus("guest");

          return;
        }

        const next = window.location.pathname + window.location.search;
        window.location.replace(
          getPathname({
            locale,
            href: { pathname: "/auth/login", query: { next } },
          }),
        );
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }

    void recover();

    return () => controller.abort();
  }, [guest, locale, status]);

  if (status === "guest") {
    return children;
  }

  if (status === "error") {
    return (
      <div className="space-y-3">
        <AuthErrorToast message={t("unavailable")} />
        <Button onClick={() => setStatus("loading")}>{t("retry")}</Button>
      </div>
    );
  }

  return <p role="status">{t("loading")}</p>;
}
