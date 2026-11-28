"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ErrorState } from "./error-state";

function getStatus(status: number | undefined) {
  switch (status) {
    case 401:
    case 403:
    case 404:
    case 429:
    case 502:
    case 503:
    case 504:
      return status;
    default:
      return 500;
  }
}

export function PageError({
  status,
  description,
  onRetry,
  retrying = false,
  className = "min-h-[60svh]",
}: {
  status?: number;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const t = useTranslations("errorScreens");
  const code = getStatus(status);
  const messageCode = code === 502 || code === 504 ? 503 : code;
  const canRetry = onRetry && code !== 401 && code !== 403 && code !== 404;

  return (
    <ErrorState
      code={code}
      title={t(`status.${messageCode}.title`)}
      description={description ?? t(`status.${messageCode}.description`)}
      className={className}
      actions={
        <>
          {canRetry && (
            <Button onClick={onRetry} disabled={retrying}>
              {t(retrying ? "retrying" : "retry")}
            </Button>
          )}
          {code === 401 && (
            <Button nativeButton={false} render={<Link href="/auth/login" />}>
              {t("signIn")}
            </Button>
          )}
          <Button
            variant={canRetry || code === 401 ? "outline" : "default"}
            nativeButton={false}
            render={<Link href="/" />}
          >
            {t("home")}
          </Button>
        </>
      }
    />
  );
}
