"use client";

import { ErrorState } from "@/components/shared/error-state";
import { useI18n } from "@/template/i18n/provider";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/template/components/ui/button";

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean;
};

export function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ErrorState
      code={minimal ? undefined : 500}
      className={cn("min-h-svh", className)}
      title={t("Oops! Something went wrong")}
      description={
        <>
          {t("We apologize for the inconvenience.")} <br />
          {t("Please try again later.")}
        </>
      }
      actions={
        !minimal && (
          <>
            <Button variant="outline" onClick={() => router.back()}>
              {t("Go Back")}
            </Button>
            <Button onClick={() => router.push("/template")}>
              {t("Back to Home")}
            </Button>
          </>
        )
      }
    />
  );
}
