"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell,
  Languages,
  Moon,
  ArrowRight,
  Sun,
  UserRound,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { HeaderSearchButton } from "@/components/shared/header-search-button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { publicSiteConfig } from "@/features/public-site/site.config";
import {
  dashboardPath,
  type Destination,
  normalizeSearch,
  sectionIcons,
} from "../sections";
import { WorkspaceProvider, useWorkspace } from "./workspace";
import { cn } from "@/lib/utils";

function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const auth = useTranslations("auth");
  const pathname = usePathname();
  const { container, destinations, navigation } = useWorkspace();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon" portalContainer={container}>
      <SidebarHeader className="mb-2">
        <Link
          href={dashboardPath(destinations[0])}
          onClick={() => setOpenMobile(false)}
          className="flex h-14 items-center gap-2.5 rounded-lg px-2 group-data-[collapsible=icon]:px-0"
          aria-label={publicSiteConfig.name}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent">
            <Image
              src={publicSiteConfig.brand.icon}
              alt=""
              width={28}
              height={28}
              className="size-7 dark:brightness-0 dark:invert"
            />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block text-sm">{publicSiteConfig.name}</strong>
            <span className="text-xs text-muted-foreground">
              {t("workspace")}
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-2">
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {group.pages.map((section) => {
                const Icon = sectionIcons[section];
                const href = dashboardPath(section);
                const active = href === pathname;
                const label = t(`nav.${section}`);

                return (
                  <SidebarMenuItem key={section}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={active}
                      aria-current={active ? "page" : undefined}
                      tooltip={{ children: label, portalContainer: container }}
                      aria-label={label}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/account" />}
              aria-label={auth("account")}
              tooltip={{
                children: auth("account"),
                portalContainer: container,
              }}
            >
              <UserRound />
              <span>{auth("account")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function PageSearch() {
  const t = useTranslations("dashboard");
  const { container, navigation } = useWorkspace();
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

function Toolbar({
  dark,
  toggleTheme,
}: {
  dark: boolean;
  toggleTheme: () => void;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { container } = useWorkspace();
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
      <PageSearch />
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

export function DashboardShell({
  destinations,
  initialDark,
  sidebarOpen,
  children,
}: {
  destinations: Destination[];
  initialDark: boolean;
  sidebarOpen: boolean;
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(initialDark);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.cookie = `dashboard-theme=${next ? "dark" : "light"}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <div
      ref={setContainer}
      className={cn(
        "template-scope min-h-svh bg-background text-foreground",
        dark ? "dark scheme-dark" : "light scheme-light",
      )}
    >
      <WorkspaceProvider container={container} destinations={destinations}>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <DashboardSidebar />
          <SidebarInset className="@container/content min-w-0">
            <Toolbar dark={dark} toggleTheme={toggleTheme} />
            <div className="w-full space-y-6 px-4 py-6 sm:px-5">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </WorkspaceProvider>
    </div>
  );
}
