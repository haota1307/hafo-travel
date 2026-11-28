"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDashboardLayout } from "./dashboard-layout-context";

export function DashboardSheet({
  children,
  onClose,
  pending = false,
}: {
  children: ReactNode;
  onClose: () => void;
  pending?: boolean;
}) {
  const { container } = useDashboardLayout();

  if (!container) {
    return null;
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
    >
      <SheetContent
        portalContainer={container}
        className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
