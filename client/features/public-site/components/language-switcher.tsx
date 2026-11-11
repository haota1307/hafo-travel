"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("publicSite.language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale || isPending) {
      return;
    }

    const href = `${pathname}${window.location.search}${window.location.hash}`;

    startTransition(() => {
      router.replace(href, { locale: nextLocale, scroll: false });
    });
  }

  return (
    <div
      className="public-language-switch"
      role="group"
      aria-label={t("label")}
      aria-busy={isPending}
    >
      {routing.locales.map((value) => (
        <Button
          key={value}
          variant={value === locale ? "secondary" : "ghost"}
          size="sm"
          lang={value}
          aria-label={t("switchTo", { language: t(value) })}
          aria-pressed={value === locale}
          disabled={isPending}
          onClick={() => switchLocale(value)}
        >
          {value.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
