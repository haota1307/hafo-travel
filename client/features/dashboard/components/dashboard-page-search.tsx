import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { HeaderSearchButton } from "@/components/shared/header-search-button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { dashboardPath, normalizeSearch } from "../sections";
import { useDashboardLayout } from "./dashboard-layout-context";

export function DashboardPageSearch() {
  const t = useTranslations("dashboard");
  const { container, navigation } = useDashboardLayout();
  const [open, setOpen] = useState(false);
  const common = useTranslations("template");
  const router = useRouter();

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", shortcut);

    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<HeaderSearchButton label={common("search")} />} />
      {container && (
        <DialogContent
          portalContainer={container}
          className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">{common("search")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("findPage")}
          </DialogDescription>
          <Command
            label={t("findPage")}
            filter={(value, search, keywords = []) =>
              normalizeSearch([value, ...keywords].join(" ")).includes(
                normalizeSearch(search),
              )
                ? 1
                : 0
            }
          >
            <CommandInput
              aria-label={t("findPage")}
              placeholder={t("findPage")}
              className="pe-9"
            />
            <CommandList className="h-72">
              <CommandEmpty>{t("noResults")}</CommandEmpty>
              {navigation.map((group) => (
                <CommandGroup key={group.label} heading={t(group.label)}>
                  {group.pages.map((section) => (
                    <CommandItem
                      key={section}
                      value={section}
                      keywords={[t(`nav.${section}`)]}
                      onSelect={() => {
                        setOpen(false);
                        router.push(dashboardPath(section));
                      }}
                    >
                      <ArrowRight />
                      {t(`nav.${section}`)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      )}
    </Dialog>
  );
}
