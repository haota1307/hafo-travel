"use client";

import { ErrorState } from "@/components/shared/error-state";
import { useI18n } from "@/template/i18n/provider";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/template/components/ui/button";

export function ForbiddenError() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ErrorState
      code={403}
      className="min-h-svh"
      title={t("Access Forbidden")}
      description={
        <>
          {t("You don't have necessary permission")} <br />
          {t("to view this resource.")}
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={() => router.back()}>
            {t("Go Back")}
          </Button>
          <Button onClick={() => router.push("/template")}>
            {t("Back to Home")}
          </Button>
        </>
      }
    />
  );
}
