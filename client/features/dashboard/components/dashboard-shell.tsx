"use client";

import { useState, type ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { Destination } from "../sections";
import { DashboardLayoutProvider } from "./dashboard-layout-context";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardToolbar } from "./dashboard-toolbar";

export function DashboardShell({
  destinations,
  initialDark,
  sidebarOpen,
  children,
}: {
  destinations: Destination[];
  initialDark: boolean;
  sidebarOpen: boolean;
  children: ReactNode;
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
      <DashboardLayoutProvider
        container={container}
        destinations={destinations}
      >
        <SidebarProvider defaultOpen={sidebarOpen}>
          <DashboardSidebar />
          <SidebarInset className="@container/content min-w-0">
            <DashboardToolbar dark={dark} toggleTheme={toggleTheme} />
            <div className="w-full space-y-6 px-4 py-6 sm:px-5">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </DashboardLayoutProvider>
    </div>
  );
}
