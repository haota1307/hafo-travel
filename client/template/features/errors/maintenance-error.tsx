"use client";

import { ErrorState } from "@/components/shared/error-state";
import { useI18n } from "@/template/i18n/provider";
import { Button } from "@/template/components/ui/button";

export function MaintenanceError() {
  const { t } = useI18n();

  return (
    <ErrorState
      code={503}
      className="min-h-svh"
      title={t("Website is under maintenance!")}
      description={
        <>
          {t("The site is not available at the moment.")} <br />
          {t("We'll be back online shortly.")}
        </>
      }
      actions={<Button variant="outline">{t("Learn more")}</Button>}
    />
  );
}
