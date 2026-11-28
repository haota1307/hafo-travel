"use client";

import { useMemo } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/shared/data-table/column-header";
import type { ColumnDef } from "@/components/shared/data-table/table-features";
import { createSelectionColumn } from "@/components/shared/data-table/selection-column";
import { accessibleDestinations } from "@/features/dashboard/sections";

import type { Role } from "../roles.schema";
import { getRoleName, groupRolePermissions } from "../roles-ui";
import { RoleActionsMenu, type RoleActionProps } from "./role-actions";

export function getRoleScope(
  permissions: string[],
  t: ReturnType<typeof useTranslations<"roles">>,
) {
  const { api } = groupRolePermissions(permissions);
  const pages = accessibleDestinations(permissions);

  return t("scopeSummary", { pages: pages.length, api: api.length });
}

export function useRolesColumns({
  allowed,
  container,
  onAction,
}: RoleActionProps & { container: HTMLElement | null }) {
  const t = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const common = useTranslations("template");
  const locale = useLocale();
  const format = useFormatter();

  return useMemo<ColumnDef<Role>[]>(() => {
    const fields: ColumnDef<Role>[] = [
      createSelectionColumn<Role>(
        common("selectAll"),
        (role) => common("selectRow") + " · " + getRoleName(role, t, locale),
      ),
      {
        id: "name",
        accessorFn: (role) => getRoleName(role, t, locale),
        enableHiding: false,
        sortFn: (left, right) =>
          getRoleName(left.original, t, locale).localeCompare(
            getRoleName(right.original, t, locale),
            locale,
          ),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={t("fields.displayName")}
          />
        ),
        cell: ({ row, getValue }) =>
          allowed.viewDetails ? (
            <button
              type="button"
              className="block max-w-80 truncate text-start font-medium hover:underline"
              onClick={() => onAction("viewDetails", row.original)}
            >
              {getValue<string>()}
            </button>
          ) : (
            <span className="block max-w-80 truncate font-medium">
              {getValue<string>()}
            </span>
          ),
      },
      {
        id: "code",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={t("fields.name")}
          />
        ),
        cell: ({ getValue }) => (
          <span className="block max-w-64 truncate text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "scope",
        accessorFn: (role) => getRoleScope(role.permissions, t),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={dashboard("fields.scope")}
          />
        ),
      },
      {
        id: "members",
        accessorFn: (role) => role.memberCount,
        sortUndefined: "last",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            container={container}
            title={dashboard("fields.members")}
          />
        ),
        cell: ({ row }) => {
          const count = row.original.memberCount;

          return count === undefined ? "—" : format.number(count);
        },
      },
    ];

    if (allowed.viewDetails || allowed.update || allowed.delete) {
      fields.push({
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        meta: { className: "w-10 text-end" },
        header: () => <span className="sr-only">{t("actions")}</span>,
        cell: ({ row }) => (
          <RoleActionsMenu
            role={row.original}
            allowed={allowed}
            onAction={onAction}
          />
        ),
      });
    }

    return fields;
  }, [allowed, common, container, dashboard, format, locale, onAction, t]);
}
