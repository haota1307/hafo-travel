"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/shared/data-table/column-header";
import { DataTableGrid } from "@/components/shared/data-table/grid";
import { DataTablePagination } from "@/components/shared/data-table/pagination";
import {
  dataTableFeatures,
  type ColumnDef,
} from "@/components/shared/data-table/table-features";
import { DataTableToolbar } from "@/components/shared/data-table/toolbar";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { PageError } from "@/components/shared/page-error";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/features/dashboard/components/workspace";
import { normalizeSearch } from "@/features/dashboard/sections";
import { HttpError } from "@/lib/http";

import { useGetUsers } from "../users.queries";
import {
  UserRoleIdSchema,
  UserStatusSchema,
  type InternalUser,
} from "../users.schema";
import {
  getUserName,
  getUserRoleName,
  type UserAccess,
  type UserAction,
} from "../users-ui";
import { UserStatusBadge } from "./user-detail-sheet";
import { UserActionsMenu } from "./user-row-actions";
import { UsersBulkActions } from "./users-bulk-actions";

const noUsers: InternalUser[] = [];

type UsersTableProps = {
  actorId: string;
  access: UserAccess;
  resendingInvitation: boolean;
  onAction: (action: UserAction, user: InternalUser) => void;
};

function useUsersColumns({
  actorId,
  access,
  resendingInvitation,
  onAction,
}: UsersTableProps) {
  const t = useTranslations("users");
  const common = useTranslations("template");
  const locale = useLocale();
  const { container } = useWorkspace();

  return useMemo<ColumnDef<InternalUser>[]>(() => {
    const roleLabel = (user: InternalUser) =>
      getUserRoleName(user.role.name, t);
    const headers = {
      name: t("fields.name"),
      email: t("fields.email"),
      role: t("fields.role"),
      status: t("fields.status"),
    };
    const columns: ColumnDef<InternalUser>[] = [
      {
        id: "select",
        enableHiding: false,
        enableSorting: false,
        meta: { className: "w-8" },
        header: ({ table }) => (
          <Checkbox
            className="rounded-full shadow-xs"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
            aria-label={common("selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            className="rounded-full shadow-xs"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value)}
            aria-label={
              common("selectRow") + " · " + getUserName(row.original, locale)
            }
          />
        ),
      },
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
    t,
  ]);
}

export function UsersTable({
  actorId,
  access,
  resendingInvitation,
  onAction,
}: UsersTableProps) {
  const t = useTranslations("users");
  const dashboard = useTranslations("dashboard");
  const locale = useLocale();
  const { container } = useWorkspace();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const query = useGetUsers(actorId, true);
  const rows = query.isSuccess ? query.data : noUsers;
  const columns = useUsersColumns({
    actorId,
    access,
    resendingInvitation,
    onAction,
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
                (id === "status"
                  ? UserStatusSchema
                  : UserRoleIdSchema
                ).safeParse(value).success,
            ),
        }))
        .filter(({ value }) => value.length > 0),
    [params],
  );
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.userId,
    autoResetPageIndex: false,
    state: {
      globalFilter: search,
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setSelection,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, value) =>
      normalizeSearch(
        [
          getUserName(row.original, locale),
          row.original.email,
          getUserRoleName(row.original.role.name, t),
        ].join(" "),
      ).includes(normalizeSearch(String(value))),
    onGlobalFilterChange: (update) => {
      setSearch(update);
      setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    },
    onColumnFiltersChange: (update) => {
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
      setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    },
  });
  const lastPage = Math.max(0, table.getPageCount() - 1);

  useEffect(() => {
    if (pagination.pageIndex > lastPage) {
      table.setPageIndex(lastPage);
    }
  }, [lastPage, pagination.pageIndex, table]);

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
    rows.map(({ role }) => [role.id, getUserRoleName(role.name, t)]),
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
