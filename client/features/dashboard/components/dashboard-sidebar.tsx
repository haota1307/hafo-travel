import Image from "next/image";
import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { publicSiteConfig } from "@/features/public-site/site.config";
import { Link, usePathname } from "@/i18n/navigation";
import { dashboardPath, sectionIcons } from "../sections";
import { useDashboardLayout } from "./dashboard-layout-context";

export function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const auth = useTranslations("auth");
  const pathname = usePathname();
  const { container, destinations, navigation } = useDashboardLayout();
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
