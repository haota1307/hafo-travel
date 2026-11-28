"use client";

import { ErrorState } from "@/components/shared/error-state";
import { useI18n } from "@/template/i18n/provider";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/template/components/ui/button";

export function UnauthorisedError() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ErrorState
      code={401}
      className="min-h-svh"
      title={t("Unauthorized Access")}
      description={
        <>
          {t("Please log in with the appropriate credentials")} <br />
          {t("to access this resource.")}
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
