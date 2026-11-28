"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageError } from "@/components/shared/page-error";
import { toast } from "@/components/ui/toast";
import { PageHeading } from "@/components/shared/page-heading";
import { useDashboardLayout } from "@/features/dashboard/components/dashboard-layout-context";
import { accessibleDestinations } from "@/features/dashboard/sections";
import { useRouter } from "@/i18n/navigation";
import { HttpError } from "@/lib/http";

import { applyPermissionChanges } from "../role-permissions";
import { getRoleErrorKey, getRoleName, isSystemRole } from "../roles-ui";
import {
  useGetRolePermissions,
  useGetRoles,
  useUpdateRolePermissions,
} from "../roles.queries";
import type { Role, RolePermissionChanges } from "../roles.schema";
import { PermissionMatrix } from "./permission-matrix";

type PermissionChange = { role: Role; permissions: RolePermissionChanges };

export function PermissionsScreen({
  actorId,
  actorRoleId,
  permissions,
}: {
  actorId: string;
  actorRoleId: string;
  permissions: string[];
}) {
  const t = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const canEdit =
    permissions.includes("role.update") &&
    permissions.includes("role.get_by_id");

  return (
    <>
      <PageHeading
        title={dashboard("nav.permissions")}
        description={dashboard("descriptions.permissions")}
      />
      {permissions.includes("role.get_all") ? (
        <PermissionsEditor
          actorId={actorId}
          actorRoleId={actorRoleId}
          canEdit={canEdit}
        />
      ) : (
        <PageError status={403} description={t("matrix.noAccess")} />
      )}
    </>
  );
}

function PermissionsEditor({
  actorId,
  actorRoleId,
  canEdit,
}: {
  actorId: string;
  actorRoleId: string;
  canEdit: boolean;
}) {
  const t = useTranslations("roles");
  const locale = useLocale();
  const router = useRouter();
  const { container } = useDashboardLayout();
  const rolesQuery = useGetRoles(actorId);
  const catalogQuery = useGetRolePermissions(actorId);
  const mutation = useUpdateRolePermissions(actorId);
  const saving = useRef(false);
  const [confirmation, setConfirmation] = useState<PermissionChange>();

  if (rolesQuery.isError || catalogQuery.isError) {
    const failed = rolesQuery.isError ? rolesQuery : catalogQuery;

    return (
      <PageError
        status={
          failed.error instanceof HttpError ? failed.error.status : undefined
        }
        description={t(getRoleErrorKey(failed.error))}
        onRetry={() => failed.refetch()}
        retrying={failed.isFetching}
      />
    );
  }

  if (!rolesQuery.isSuccess || !catalogQuery.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t("loadingPermissions")}
      </p>
    );
  }

  const roles = rolesQuery.data;
  const catalog = new Set(catalogQuery.data);

  if (
    roles.length === 0 ||
    (catalog.size === 0 && roles.every((role) => role.permissions.length === 0))
  ) {
    return (
      <p className="text-muted-foreground">
        {t(roles.length === 0 ? "empty" : "noPermissions")}
      </p>
    );
  }

  const pending = mutation.isPending ? mutation.variables : undefined;

  async function save({ role, permissions }: PermissionChange) {
    if (!canEdit || saving.current) {
      return;
    }

    saving.current = true;
    setConfirmation(undefined);

    try {
      await mutation.mutateAsync({ id: role.id, permissions });

      if (role.id === actorRoleId) {
        router.refresh();
      }
    } catch (error) {
      toast.add({
        type: "error",
        title: t("matrix.saveFailed", { role: getRoleName(role, t, locale) }),
        description: t(getRoleErrorKey(error)),
      });
    } finally {
      saving.current = false;
    }
  }

  function changePermission(
    role: Role,
    permissions: string[],
    checked: boolean,
  ) {
    if (!canEdit || saving.current || confirmation || isSystemRole(role)) {
      return;
    }

    const changes = new Map(
      permissions.map((permission) => [permission, checked]),
    );
    const next = applyPermissionChanges(role.permissions, changes);

    if (next.some((permission) => !catalog.has(permission))) {
      toast.add({
        type: "error",
        title: t("matrix.saveFailed", { role: getRoleName(role, t, locale) }),
        description: t("errors.permissions"),
      });

      return;
    }

    const change = { role, permissions: changes };

    if (
      role.memberCount !== 0 &&
      accessibleDestinations(role.permissions).length > 0 &&
      accessibleDestinations(next).length === 0
    ) {
      setConfirmation(change);

      return;
    }

    void save(change);
  }

  return (
    <div className="grid min-w-0 gap-3">
      {canEdit ? (
        <span role="status" className="sr-only">
          {pending
            ? t("matrix.saving")
            : mutation.isSuccess
              ? t("permissionsUpdated")
              : ""}
        </span>
      ) : (
        <p className="text-sm text-muted-foreground">{t("matrix.readOnly")}</p>
      )}
      <PermissionMatrix
        roles={roles}
        catalog={catalog}
        pending={pending}
        editable={canEdit && !pending && !confirmation}
        onChange={changePermission}
      />
      {container && confirmation && (
        <ConfirmDialog
          portalContainer={container}
          title={t("removeAccessTitle")}
          subject={getRoleName(confirmation.role, t, locale)}
          description={
            confirmation.role.memberCount === undefined
              ? t("removeAccessUnknown")
              : t("removeAccessDescription", {
                  count: confirmation.role.memberCount,
                })
          }
          cancelLabel={t("cancel")}
          confirmLabel={t("confirmRemoveAccess")}
          confirmVariant="destructive"
          onCancel={() => setConfirmation(undefined)}
          onConfirm={() => void save(confirmation)}
        />
      )}
    </div>
  );
}
