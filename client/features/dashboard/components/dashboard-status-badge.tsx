"use client";

import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/shared/status-badge";

const tones: Record<string, string> = {
  new: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  working:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  published:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  cancelled:
    "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300",
};

const statusTones: Record<string, string> = {
  active: "published",
  confirmed: "published",
  paid: "published",
  open: "published",
  review: "working",
  pending: "working",
  invited: "new",
  locked: "cancelled",
  refunded: "new",
  full: "working",
};

export function DashboardStatusBadge({ status }: { status: string }) {
  const t = useTranslations("dashboard.statuses");
  const className =
    tones[statusTones[status] ?? status] ??
    "border-border bg-muted text-muted-foreground";

  return <StatusBadge className={className}>{t(status)}</StatusBadge>;
}
