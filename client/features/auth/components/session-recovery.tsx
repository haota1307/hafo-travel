"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PageError } from "@/components/shared/page-error";
import { getPathname } from "@/i18n/navigation";
import { authApiRequest } from "../auth.api";

export function SessionRecovery({
  unavailable,
  guest,
  className,
  children,
}: {
  unavailable: boolean;
  guest: boolean;
  className?: string;
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
      <PageError
        status={503}
        className={className}
        onRetry={() => setStatus("loading")}
      />
    );
  }

  return <p role="status">{t("loading")}</p>;
}
