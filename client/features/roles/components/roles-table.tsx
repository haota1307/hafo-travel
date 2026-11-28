"use client";

import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";

import { DataTableBulkActions } from "@/components/shared/data-table/bulk-actions";
import { DataTableGrid } from "@/components/shared/data-table/grid";
import { DataTablePagination } from "@/components/shared/data-table/pagination";
import { useDataTable } from "@/components/shared/data-table/use-data-table";
import { DataTableToolbar } from "@/components/shared/data-table/toolbar";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { PageError } from "@/components/shared/page-error";
import { Button } from "@/components/ui/button";
import { useDashboardLayout } from "@/features/dashboard/components/dashboard-layout-context";
import { normalizeSearch } from "@/features/dashboard/sections";
import { downloadCsv } from "@/lib/download-csv";
import { HttpError } from "@/lib/http";

import { useGetRoles } from "../roles.queries";
import type { Role } from "../roles.schema";
import { getRoleName } from "../roles-ui";
import type { RoleActionProps } from "./role-actions";
import { getRoleScope, useRolesColumns } from "./roles-columns";

const noRoles: Role[] = [];

export function RolesTable({
  actorId,
  allowed,
  onAction,
}: {
  actorId: string;
} & RoleActionProps) {
  const t = useTranslations("roles");
  const dashboard = useTranslations("dashboard");
  const locale = useLocale();
  const { container } = useDashboardLayout();
  const query = useGetRoles(actorId);
  const rows = query.data ?? noRoles;
  const columns = useRolesColumns({ allowed, container, onAction });

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (role) => role.id,
    globalFilterFn: (row, _id, value) =>
      normalizeSearch(
        [
          getRoleName(row.original, t, locale),
          row.original.name,
          row.original.description,
          ...row.original.permissions,
        ].join(" "),
      ).includes(normalizeSearch(String(value))),
  });

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
