"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Download } from "lucide-react";

import { DataTableBulkActions } from "@/components/shared/data-table/bulk-actions";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/features/dashboard/components/workspace";
import {
  accessibleDestinations,
  normalizeSearch,
} from "@/features/dashboard/sections";
import { downloadCsv } from "@/lib/download-csv";
import { HttpError } from "@/lib/http";

import { useGetRoles } from "../roles.queries";
import type { Role } from "../roles.schema";
import { getRoleName, groupRolePermissions } from "../roles-ui";
import {
  RoleActionsMenu,
  type RoleAction,
  type RoleActions,
} from "./role-actions";

const noRoles: Role[] = [];

function getRoleScope(
  permissions: string[],
  t: ReturnType<typeof useTranslations<"roles">>,
) {
  const { api } = groupRolePermissions(permissions);
  const pages = accessibleDestinations(permissions);

  return t("scopeSummary", { pages: pages.length, api: api.length });
}

export function RolesTable({
  actorId,
  allowed,
  onAction,
}: {
  actorId: string;
  allowed: RoleActions;
  onAction: (action: RoleAction, role: Role) => void;
}) {
  const t = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const common = useTranslations("template");
  const locale = useLocale();
  const format = useFormatter();
  const { container } = useWorkspace();
  const query = useGetRoles(actorId);
  const rows = query.data ?? noRoles;
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const columns = useMemo<ColumnDef<Role>[]>(() => {
    const fields: ColumnDef<Role>[] = [
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
              common("selectRow") + " · " + getRoleName(row.original, t, locale)
            }
          />
        ),
      },
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
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: rows,
    getRowId: (role) => role.id,
    autoResetPageIndex: false,
    state: {
      globalFilter: search,
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
    globalFilterFn: (row, _id, value) =>
      normalizeSearch(
        [
          getRoleName(row.original, t, locale),
          row.original.name,
          row.original.description,
          ...row.original.permissions,
        ].join(" "),
      ).includes(normalizeSearch(String(value))),
    onGlobalFilterChange: (update) => {
      setSearch(update);
      setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setSelection,
    onPaginationChange: setPagination,
  });
  const lastPage = Math.max(0, table.getPageCount() - 1);

  useEffect(() => {
    if (pagination.pageIndex > lastPage) {
      table.setPageIndex(lastPage);
    }
  }, [lastPage, pagination.pageIndex, table]);

  function columnLabel(id: string) {
    if (id === "code") {
      return t("fields.name");
    }
    if (id === "scope" || id === "members") {
      return dashboard(`fields.${id}`);
    }

    return t("fields.displayName");
  }

  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  function exportSelected() {
    const optionalFields = [
      { id: "code", get: (role: Role) => role.name },
      { id: "scope", get: (role: Role) => getRoleScope(role.permissions, t) },
      {
        id: "members",
        get: (role: Role) => role.memberCount?.toString() ?? "",
      },
    ].filter(({ id }) => table.getColumn(id)?.getIsVisible());

    downloadCsv("roles", [
      [
        "ID",
        t("fields.displayName"),
        ...optionalFields.map(({ id }) => columnLabel(id)),
      ],
      ...selected.map((role) => [
        role.id,
        getRoleName(role, t, locale),
        ...optionalFields.map(({ get }) => get(role)),
      ]),
    ]);
    table.resetRowSelection();
  }

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

  const empty = query.isLoading ? (
    <p role="status">{t("loading")}</p>
  ) : rows.length ? (
    dashboard("noResults")
  ) : (
    t("empty")
  );

  return (
    <div className="flex flex-1 flex-col gap-4 has-[[role=toolbar]]:pb-16">
      <DataTableToolbar
        table={table}
        container={container}
        label={columnLabel}
        searchPlaceholder={dashboard("filterSearch")}
      />
      <DataTableGrid table={table} empty={empty} />
      <DataTablePagination table={table} container={container} />
      <DataTableBulkActions
        container={container}
        count={selected.length}
        entity={dashboard("bulkEntity", {
          section: "roles",
          count: selected.length,
        })}
        onClear={() => table.resetRowSelection()}
      >
        <LabeledTooltip
          label={dashboard("exportSelected")}
          portalContainer={container}
        >
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={dashboard("exportSelected")}
            onClick={exportSelected}
          >
            <Download />
          </Button>
        </LabeledTooltip>
      </DataTableBulkActions>
    </div>
  );
}
