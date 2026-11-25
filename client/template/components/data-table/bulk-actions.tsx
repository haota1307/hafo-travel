"use client";
import { DataTableBulkActions as SelectionToolbar } from "@/components/shared/data-table/bulk-actions";
import type { Table } from "./table-features";
import { useI18n } from "@/template/i18n/provider";
import { usePortalContainer } from "@/template/context/portal-container-provider";

export function DataTableBulkActions<TData extends object>({
  table,
  entityName,
  children,
}: {
  table: Table<TData>;
  entityName: string;
  children: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const container = usePortalContainer();
  const count = table.getFilteredSelectedRowModel().rows.length;
  const entity = t(entityName) + (locale === "en" && count > 1 ? "s" : "");

  return (
    <SelectionToolbar
      count={count}
      entity={entity}
      container={container}
      onClear={() => table.resetRowSelection()}
    >
      {children}
    </SelectionToolbar>
  );
}
