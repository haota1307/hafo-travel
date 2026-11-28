"use client";

import { useLocale, useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTableRowActionsMenu } from "@/components/shared/data-table/row-actions-menu";
import { toast } from "@/components/ui/toast";
import { useDashboardLayout } from "@/features/dashboard/components/dashboard-layout-context";

import { useDeleteRole } from "../roles.queries";
import type { Role } from "../roles.schema";
import { getRoleErrorKey, getRoleName, isSystemRole } from "../roles-ui";

export type RoleAction = "viewDetails" | "editRole" | "delete";

export type RoleActionProps = {
  allowed: {
    viewDetails: boolean;
    update: boolean;
    delete: boolean;
  };
  onAction: (action: RoleAction, role: Role) => void;
};

export function RoleActionsMenu({
  role,
  allowed,
  onAction,
}: RoleActionProps & { role: Role }) {
  const t = useTranslations("roles");
  const locale = useLocale();
  const { container } = useDashboardLayout();
  const protectedRole = isSystemRole(role);
  const actions: RoleAction[] = [];

  if (allowed.viewDetails) {
    actions.push("viewDetails");
  }
  if (allowed.update && !protectedRole) {
    actions.push("editRole");
  }
  if (allowed.delete && !protectedRole) {
    actions.push("delete");
  }

  if (!container || !actions.length) {
    return null;
  }

  return (
    <DataTableRowActionsMenu
      container={container}
      label={t("actionsFor", { name: getRoleName(role, t, locale) })}
      actions={actions.map((action) => ({
        id: action,
        label: t(action),
        destructive: action === "delete",
      }))}
      onAction={(action) => onAction(action, role)}
    />
  );
}

export function DeleteRoleDialog({
  actorId,
  role,
  onClose,
  onDeleted,
}: {
  actorId: string;
  role: Role;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("roles");
  const locale = useLocale();
  const { container } = useDashboardLayout();
  const mutation = useDeleteRole(actorId, role.id);

  function confirm() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.add({ type: "success", title: t("deleted") });
        onDeleted();
      },
      onError: (error) =>
        toast.add({
          type: "error",
          title: t(getRoleErrorKey(error, true)),
        }),
    });
  }

  return (
    <ConfirmDialog
      portalContainer={container}
      title={t("delete")}
      description={t("deleteDescription", {
        name: getRoleName(role, t, locale),
      })}
      cancelLabel={t("cancel")}
      confirmLabel={t("delete")}
      confirmVariant="destructive"
      pending={mutation.isPending}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
