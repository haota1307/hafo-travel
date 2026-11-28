"use client";

import { ErrorState } from "@/components/shared/error-state";
import { useI18n } from "@/template/i18n/provider";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/template/components/ui/button";

export function NotFoundError() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ErrorState
      code={404}
      className="min-h-svh"
      title={t("Oops! Page Not Found!")}
      description={
        <>
          {t("It seems like the page you're looking for")} <br />
          {t("does not exist or might have been removed.")}
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
