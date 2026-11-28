"use client";

import { createContext, useContext, type ReactNode } from "react";
import { visibleNavigation, type Destination } from "../sections";

type DashboardLayoutContextValue = {
  destinations: Destination[];
  navigation: ReturnType<typeof visibleNavigation>;
  container: HTMLDivElement | null;
};

const DashboardLayoutContext =
  createContext<DashboardLayoutContextValue | null>(null);

export function DashboardLayoutProvider({
  destinations,
  container,
  children,
}: {
  destinations: Destination[];
  container: HTMLDivElement | null;
  children: ReactNode;
}) {
  return (
    <DashboardLayoutContext.Provider
      value={{
        destinations,
        navigation: visibleNavigation(destinations),
        container,
      }}
    >
      {children}
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext);

  if (!context) {
    throw new Error("Dashboard layout provider is missing.");
  }

  return context;
}
