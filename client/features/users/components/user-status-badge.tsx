"use client";

import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/shared/status-badge";

import type { InternalUser } from "../users.schema";

const userStatusColors: Record<InternalUser["status"], string> = {
  active:
    "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300",
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  locked: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
};

export function UserStatusBadge({
  status,
}: {
  status: InternalUser["status"];
}) {
  const t = useTranslations("users");

  return (
    <StatusBadge className={userStatusColors[status]}>
      {t(`statuses.${status}`)}
    </StatusBadge>
  );
}
