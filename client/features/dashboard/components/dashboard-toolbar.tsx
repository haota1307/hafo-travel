import { useLocale, useTranslations } from "next-intl";
import { Bell, Languages, Moon, Sun } from "lucide-react";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useDashboardLayout } from "./dashboard-layout-context";
import { DashboardPageSearch } from "./dashboard-page-search";

export function DashboardToolbar({
  dark,
  toggleTheme,
}: {
  dark: boolean;
  toggleTheme: () => void;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { container } = useDashboardLayout();
  const pathname = usePathname();
  const router = useRouter();

  function switchLanguage() {
    router.replace(pathname + window.location.search + window.location.hash, {
      locale: locale === "vi" ? "en" : "vi",
      scroll: false,
    });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 rounded-t-xl bg-background/95 px-4 backdrop-blur sm:gap-4">
      <SidebarTrigger
        variant="outline"
        className="size-7 rounded-md shadow-xs max-md:scale-125"
        aria-label={t("toggleSidebar")}
      />
      <Separator
        orientation="vertical"
        className="h-6 data-vertical:self-center"
      />
      <DashboardPageSearch />
      <div className="ms-auto flex items-center gap-1 sm:gap-2">
        <Popover>
          <LabeledTooltip
            label={t("notifications")}
            side="bottom"
            portalContainer={container}
          >
            <PopoverTrigger
              render={<Button variant="ghost" size="icon" />}
              aria-label={t("notifications")}
            >
              <Bell />
            </PopoverTrigger>
          </LabeledTooltip>
          {container && (
            <PopoverContent align="end" portalContainer={container}>
              <PopoverTitle>{t("notifications")}</PopoverTitle>
              <PopoverDescription>{t("noNotifications")}</PopoverDescription>
            </PopoverContent>
          )}
        </Popover>
        <LabeledTooltip
          label={dark ? t("light") : t("dark")}
          side="bottom"
          portalContainer={container}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={dark ? t("light") : t("dark")}
          >
            {dark ? <Moon /> : <Sun />}
          </Button>
        </LabeledTooltip>
        <LabeledTooltip
          label={t("switchLanguage")}
          side="bottom"
          portalContainer={container}
        >
          <Button
            variant="ghost"
            onClick={switchLanguage}
            aria-label={t("switchLanguage")}
          >
            <Languages />
            <span className="hidden sm:inline">
              {locale === "vi" ? "Tiếng Việt" : "English"}
            </span>
            <span className="sm:hidden">{locale.toUpperCase()}</span>
          </Button>
        </LabeledTooltip>
      </div>
    </header>
  );
}
