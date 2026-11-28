"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { ColumnFiltersState } from "@tanstack/react-table";

import { DataTableGrid } from "@/components/shared/data-table/grid";
import { DataTablePagination } from "@/components/shared/data-table/pagination";
import { useDataTable } from "@/components/shared/data-table/use-data-table";
import { DataTableToolbar } from "@/components/shared/data-table/toolbar";
import { PageError } from "@/components/shared/page-error";
import { useDashboardLayout } from "@/features/dashboard/components/dashboard-layout-context";
import { normalizeSearch } from "@/features/dashboard/sections";
import { RoleIdSchema } from "@/features/roles/roles.schema";
import { getRoleName } from "@/features/roles/roles-ui";
import { HttpError } from "@/lib/http";

import { useGetUsers } from "../users.queries";
import { UserStatusSchema, type InternalUser } from "../users.schema";
import { getUserName } from "../users-ui";
import type { UserActionProps } from "./user-row-actions";
import { UsersBulkActions } from "./users-bulk-actions";
import { useUsersColumns } from "./users-columns";

const noUsers: InternalUser[] = [];

export function UsersTable({
  actorId,
  access,
  resendingInvitation,
  onAction,
}: UserActionProps) {
  const t = useTranslations("users");
  const roleLabels = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const locale = useLocale();
  const { container } = useDashboardLayout();
  const params = useSearchParams();
  const query = useGetUsers(actorId, true);
  const rows = query.isSuccess ? query.data : noUsers;
  const columns = useUsersColumns({
    actorId,
    access,
    resendingInvitation,
    onAction,
    container,
  });
  const columnFilters = useMemo<ColumnFiltersState>(
    () =>
      ["status", "role"]
        .map((id) => ({
          id,
          value: params
            .getAll(id)
            .filter(
              (value) =>
                (id === "status" ? UserStatusSchema : RoleIdSchema).safeParse(
                  value,
                ).success,
            ),
        }))
        .filter(({ value }) => value.length > 0),
    [params],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.userId,
    globalFilterFn: (row, _columnId, value) =>
      normalizeSearch(
        [
          getUserName(row.original, locale),
          row.original.email,
          getRoleName(row.original.role, roleLabels, locale),
          row.original.role.name,
        ].join(" "),
      ).includes(normalizeSearch(String(value))),
    columnFilters: {
      state: columnFilters,
      onChange: (update) => {
        const next =
          typeof update === "function" ? update(columnFilters) : update;
        const url = new URL(window.location.href);
        url.searchParams.delete("status");
        url.searchParams.delete("role");

        for (const { id, value } of next) {
          for (const option of value as string[]) {
            url.searchParams.append(id, option);
          }
        }

        window.history.replaceState(null, "", url);
      },
    },
  });

  if (query.isError) {
    return (
      <PageError
        status={
          query.error instanceof HttpError ? query.error.status : undefined
        }
        onRetry={() => query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const roles = new Map(
    rows.map(({ role }) => [role.id, getRoleName(role, roleLabels, locale)]),
  );
  const filters = [
    {
      columnId: "status",
      title: t("fields.status"),
      options: UserStatusSchema.options.map((status) => ({
        value: status,
        label: t(`statuses.${status}`),
      })),
    },
    {
      columnId: "role",
      title: t("fields.role"),
      options: [...roles.entries()].map(([value, label]) => ({ value, label })),
    },
  ];
  const label = (id: string) =>
    id === "email" || id === "role" || id === "status"
      ? t(`fields.${id}`)
      : t("fields.name");
  const empty = query.isLoading ? (
    <p role="status">{t("loading")}</p>
  ) : rows.length ? (
    dashboard("noResults")
  ) : (
    t("noAccounts")
  );

  return (
    <div className="flex flex-1 flex-col gap-4 has-[[role=toolbar]]:pb-16">
      <DataTableToolbar
        table={table}
        container={container}
        label={label}
        filters={filters}
        searchPlaceholder={dashboard("filterSearch")}
      />
      <DataTableGrid table={table} empty={empty} />
      <DataTablePagination table={table} container={container} />
      <UsersBulkActions
        table={table}
        actorId={actorId}
        canAssignRole={access.assign}
      />
    </div>
  );
}
