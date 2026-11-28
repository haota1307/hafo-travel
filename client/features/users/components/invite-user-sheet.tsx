"use client";

import { useTranslations } from "next-intl";

import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DashboardSheet } from "@/features/dashboard/components/dashboard-sheet";

import { useInviteUser } from "../users.queries";
import { InviteUserForm } from "./user-forms";

export function InviteUserSheet({
  actorId,
  onClose,
}: {
  actorId: string;
  onClose: () => void;
}) {
  const t = useTranslations("users");
  const mutation = useInviteUser(actorId);

  return (
    <DashboardSheet onClose={onClose} pending={mutation.isPending}>
      <SheetHeader className="gap-1 border-b p-5 pe-12">
        <SheetTitle className="text-xl font-semibold">{t("invite")}</SheetTitle>
        <SheetDescription>{t("inviteDescription")}</SheetDescription>
      </SheetHeader>
      <div className="px-5 pb-6">
        <InviteUserForm
          actorId={actorId}
          mutation={mutation}
          onDone={onClose}
          onCancel={onClose}
        />
      </div>
    </DashboardSheet>
  );
}
