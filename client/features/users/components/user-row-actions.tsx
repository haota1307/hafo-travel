"use client";

import { useLocale, useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTableRowActionsMenu } from "@/components/shared/data-table/row-actions-menu";
import { toast } from "@/components/ui/toast";
import { useDashboardLayout } from "@/features/dashboard/components/dashboard-layout-context";

import {
  getUserErrorKey,
  getUserName,
  type UserAccess,
  type UserAction,
} from "../users-ui";
import { useUpdateUserStatus } from "../users.queries";
import type { InternalUser } from "../users.schema";

export type UserActionProps = {
  actorId: string;
  access: UserAccess;
  resendingInvitation: boolean;
  onAction: (action: UserAction, user: InternalUser) => void;
};

export function UserActionsMenu({
  actorId,
  user,
  access,
  resendingInvitation,
  onAction,
}: UserActionProps & { user: InternalUser }) {
  const t = useTranslations("users");
  const locale = useLocale();
  const { container } = useDashboardLayout();
  const protectedAccess = user.accessProtected || user.userId === actorId;
  const actions: UserAction[] = ["viewDetails"];

  if (access.edit) {
    actions.push("editName");
  }
  if (access.assign && !protectedAccess) {
    actions.push("changeRole");
  }
  if (access.edit && !protectedAccess) {
    actions.push(user.status === "locked" ? "unlock" : "lock");
  }
  if (access.resend && user.status === "pending") {
    actions.push("resendInvitation");
  }

  return (
    <DataTableRowActionsMenu
      container={container}
      label={t("actionsFor", { name: getUserName(user, locale) })}
      actions={actions.map((action) => ({
        id: action,
        label: t(action),
        destructive: action === "lock",
        disabled: action === "resendInvitation" && resendingInvitation,
      }))}
      onAction={(action) => onAction(action, user)}
    />
  );
}

export function UserStatusDialog({
  actorId,
  user,
  action,
  onClose,
}: {
  actorId: string;
  user: InternalUser;
  action: "lock" | "unlock";
  onClose: () => void;
}) {
  const t = useTranslations("users");
  const locale = useLocale();
  const { container } = useDashboardLayout();
  const mutation = useUpdateUserStatus(actorId, user.userId);
  const locking = action === "lock";

  function confirm() {
    mutation.mutate(locking, {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: t(locking ? "locked" : "unlocked"),
        });
        onClose();
      },
      onError: (error) =>
        toast.add({ type: "error", title: t(getUserErrorKey(error)) }),
    });
  }

  return (
    <ConfirmDialog
      portalContainer={container}
      title={t(action)}
      description={t(locking ? "lockDescription" : "unlockDescription", {
        name: getUserName(user, locale),
      })}
      cancelLabel={t("cancel")}
      confirmLabel={t(action)}
      confirmVariant={locking ? "destructive" : "default"}
      pending={mutation.isPending}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
