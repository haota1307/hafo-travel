import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/vietnamese-400.css";
import "@fontsource/inter/vietnamese-500.css";
import "@fontsource/inter/vietnamese-600.css";
import "@fontsource/inter/vietnamese-700.css";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { publicSiteConfig } from "@/features/public-site/site.config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");

  return {
    title: `${t("workspace")} · ${publicSiteConfig.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferences = await cookies();

  return (
    <DashboardShell
      initialDark={preferences.get("dashboard-theme")?.value === "dark"}
      sidebarOpen={preferences.get("sidebar_state")?.value !== "false"}
    >
      {children}
    </DashboardShell>
  );
}
