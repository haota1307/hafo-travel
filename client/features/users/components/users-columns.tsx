"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/shared/data-table/column-header";
import type { ColumnDef } from "@/components/shared/data-table/table-features";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { createSelectionColumn } from "@/components/shared/data-table/selection-column";
import { getRoleName } from "@/features/roles/roles-ui";

import type { InternalUser } from "../users.schema";
import { getUserName } from "../users-ui";
import { UserActionsMenu, type UserActionProps } from "./user-row-actions";
import { UserStatusBadge } from "./user-status-badge";

export function useUsersColumns({
  actorId,
  access,
  resendingInvitation,
  onAction,
  container,
}: UserActionProps & { container: HTMLElement | null }) {
  const t = useTranslations("users");
  const roles = useTranslations("roles");
  const common = useTranslations("template");
  const locale = useLocale();

  return useMemo<ColumnDef<InternalUser>[]>(() => {
    const roleLabel = (user: InternalUser) =>
      getRoleName(user.role, roles, locale);
    const headers = {
      name: t("fields.name"),
      email: t("fields.email"),
      role: t("fields.role"),
      status: t("fields.status"),
    };
    const columns: ColumnDef<InternalUser>[] = [
      createSelectionColumn<InternalUser>(
        common("selectAll"),
        (user) => common("selectRow") + " · " + getUserName(user, locale),
      ),
      {
        id: "name",
        accessorFn: (user) => getUserName(user, locale),
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={headers.name}
          />
        ),
        sortFn: (left, right) =>
          getUserName(left.original, locale).localeCompare(
            getUserName(right.original, locale),
            locale,
          ),
        cell: ({ row, getValue }) =>
          access.detail ? (
            <button
              type="button"
              onClick={() => onAction("viewDetails", row.original)}
              className="block max-w-80 truncate text-start font-medium hover:underline"
            >
              {String(getValue())}
            </button>
          ) : (
            <span className="block max-w-80 truncate font-medium">
              {String(getValue())}
            </span>
          ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={headers.email}
          />
        ),
        cell: ({ row }) => (
          <LabeledTooltip
            label={row.original.email}
            portalContainer={container}
          >
            <span className="block max-w-64 truncate" tabIndex={0}>
              {row.original.email}
            </span>
          </LabeledTooltip>
        ),
      },
      {
        id: "role",
        accessorFn: (user) => user.role.id,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={headers.role}
          />
        ),
        sortFn: (left, right) =>
          roleLabel(left.original).localeCompare(
            roleLabel(right.original),
            locale,
          ),
        filterFn: (row, columnId, values: string[]) =>
          values.includes(row.getValue(columnId)),
        cell: ({ row }) => (
          <LabeledTooltip
            label={roleLabel(row.original)}
            portalContainer={container}
          >
            <span className="block max-w-64 truncate" tabIndex={0}>
              {roleLabel(row.original)}
            </span>
          </LabeledTooltip>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={headers.status}
          />
        ),
        filterFn: (row, columnId, values: string[]) =>
          values.includes(row.getValue(columnId)),
        sortFn: (left, right) =>
          t(`statuses.${left.original.status}`).localeCompare(
            t(`statuses.${right.original.status}`),
            locale,
          ),
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      },
    ];

    if (access.detail) {
      columns.push({
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        meta: { className: "w-10 text-end" },
        header: () => <span className="sr-only">{t("actions")}</span>,
        cell: ({ row }) => (
          <UserActionsMenu
            actorId={actorId}
            user={row.original}
            access={access}
            resendingInvitation={resendingInvitation}
            onAction={onAction}
          />
        ),
      });
    }

    return columns;
  }, [
    access,
    actorId,
    common,
    container,
    locale,
    onAction,
    resendingInvitation,
    roles,
    t,
  ]);
}
