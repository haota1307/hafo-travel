"use client";

import type { ReactNode } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DashboardSheet } from "@/features/dashboard/components/dashboard-sheet";
import {
  accessibleDestinations,
  dashboardPath,
} from "@/features/dashboard/sections";
import { Link } from "@/i18n/navigation";

import {
  getOtherPermissions,
  getPermissionRows,
  getPermissionSelection,
} from "../role-permissions";
import { useCreateRole, useGetRole, useUpdateRole } from "../roles.queries";
import type { Role } from "../roles.schema";
import {
  getPermissionLabel,
  getRoleErrorKey,
  getRoleName,
  isSystemRole,
  isVisiblePermission,
} from "../roles-ui";
import { CreateRoleForm, RoleInfoForm } from "./role-form";

function RoleSheet({
  title,
  description,
  pending,
  onClose,
  children,
}: {
  title: string;
  description: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <DashboardSheet onClose={onClose} pending={pending}>
      <SheetHeader className="gap-1 border-b p-5 pe-12">
        <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-5 px-5 pb-6">{children}</div>
    </DashboardSheet>
  );
}

export function CreateRoleSheet({
  actorId,
  onClose,
}: {
  actorId: string;
  onClose: () => void;
}) {
  const t = useTranslations("roles");
  const mutation = useCreateRole(actorId);

  return (
    <RoleSheet
      title={t("add")}
      description={t("createDescription")}
      pending={mutation.isPending}
      onClose={onClose}
    >
      <CreateRoleForm mutation={mutation} onClose={onClose} />
    </RoleSheet>
  );
}

export function RoleDetailSheet({
  actorId,
  roleId,
  editing,
  canUpdate,
  canViewAccounts,
  onCancelEdit,
  onSaved,
  onClose,
}: {
  actorId: string;
  roleId: string;
  editing: boolean;
  canUpdate: boolean;
  canViewAccounts: boolean;
  onCancelEdit: () => void;
  onSaved: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("roles");
  const locale = useLocale();
  const detail = useGetRole(actorId, roleId);
  const mutation = useUpdateRole(actorId, roleId);
  const role = detail.isSuccess ? detail.data : undefined;
  const roleName = role ? getRoleName(role, t, locale) : undefined;
  const editingRole = editing && canUpdate && (!role || !isSystemRole(role));
  const detailStatus = (
    <>
      {detail.isLoading && <p role="status">{t("loadingDetail")}</p>}
      {detail.isError && (
        <div className="grid justify-items-start gap-2">
          <p role="alert">{t(getRoleErrorKey(detail.error))}</p>
          <Button variant="outline" size="sm" onClick={() => detail.refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <RoleSheet
      title={editingRole ? t("editRole") : (roleName ?? t("detail"))}
      description={editingRole ? (roleName ?? t("detail")) : t("detail")}
      pending={mutation.isPending}
      onClose={onClose}
    >
      {detailStatus}
      {role &&
        (editingRole ? (
          <RoleInfoForm
            role={role}
            mutation={mutation}
            onCancel={onCancelEdit}
            onSaved={onSaved}
          />
        ) : (
          <RoleDetail role={role} canViewAccounts={canViewAccounts} />
        ))}
    </RoleSheet>
  );
}

function RoleDetail({
  role,
  canViewAccounts,
}: {
  role: Role;
  canViewAccounts: boolean;
}) {
  const t = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const format = useFormatter();
  const selected = new Set(role.permissions);
  const rows = getPermissionRows();
  const grantedPermissions = rows
    .map(({ page, actions }) => ({
      page,
      actions: [...actions]
        .map(([action, permissions]) => ({
          action,
          ...getPermissionSelection(permissions, selected),
        }))
        .filter(({ checked, partial }) => checked || partial),
    }))
    .filter(({ actions }) => actions.length > 0);
  const otherPermissions = getOtherPermissions(role.permissions, rows).filter(
    isVisiblePermission,
  );
  const accountsLink =
    canViewAccounts && accessibleDestinations(role.permissions).length > 0
      ? dashboardPath("users") + "?" + new URLSearchParams({ role: role.id })
      : undefined;
  const dateFormat = { dateStyle: "medium", timeStyle: "short" } as const;
  const fields = [
    { label: t("fields.name"), value: role.name },
    { label: t("fields.description"), value: role.description || "—" },
    {
      label: dashboard("fields.members"),
      value:
        role.memberCount === undefined ? "—" : format.number(role.memberCount),
    },
    {
      label: t("fields.createdAt"),
      value: format.dateTime(new Date(role.createdAt), dateFormat),
    },
    {
      label: t("fields.updatedAt"),
      value: format.dateTime(new Date(role.updatedAt), dateFormat),
    },
  ];

  return (
    <>
      {isSystemRole(role) && (
        <p className="text-muted-foreground">{t("systemRole")}</p>
      )}
      <dl className="divide-y rounded-lg border px-3">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(0,1.3fr)] items-baseline gap-3 py-2.5"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="break-words text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {(grantedPermissions.length > 0 || otherPermissions.length === 0) && (
        <section className="grid gap-1.5">
          <h3 className="font-medium">{t("permissionSummary")}</h3>
          {grantedPermissions.length > 0 ? (
            <ul className="divide-y rounded-lg border px-3">
              {grantedPermissions.map(({ page, actions }) => (
                <li
                  key={page}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2"
                >
                  <span>{dashboard(`nav.${page}`)}</span>
                  <div className="flex flex-wrap gap-1">
                    {actions.map(({ action, partial }) => {
                      const label = t(`permissionControls.${action}`);

                      return (
                        <Badge
                          key={action}
                          variant={partial ? "outline" : "secondary"}
                        >
                          {partial
                            ? t("partialPermission", { action: label })
                            : label}
                        </Badge>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{t("noPermissions")}</p>
          )}
        </section>
      )}
      {otherPermissions.length > 0 && (
        <section className="grid gap-1.5">
          <h3 className="font-medium">{t("permissionControls.other")}</h3>
          <ul className="divide-y rounded-lg border px-3">
            {otherPermissions.map((permission) => (
              <li key={permission} className="py-2 wrap-break-word">
                {getPermissionLabel(permission, t)}
              </li>
            ))}
          </ul>
        </section>
      )}
      {accountsLink && (
        <Link
          href={accountsLink}
          className="inline-flex w-fit items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
        >
          {t("viewAccounts")}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </>
  );
}
