"use client";

import { useEffect, useState } from "react";
import {
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type Updater,
} from "@tanstack/react-table";
import { dataTableFeatures } from "./table-features";

type DataTableOptions<TData extends object> = Pick<
  TableOptions<typeof dataTableFeatures, TData>,
  "columns" | "data" | "getRowId" | "globalFilterFn"
> & {
  columnFilters?: {
    state: ColumnFiltersState;
    onChange: OnChangeFn<ColumnFiltersState>;
  };
};

export function useDataTable<TData extends object>({
  columnFilters,
  ...options
}: DataTableOptions<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  function resetPageIndex() {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }

  const table = useTable({
    ...options,
    features: dataTableFeatures,
    autoResetPageIndex: false,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
      ...(columnFilters && { columnFilters: columnFilters.state }),
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: (update) => {
      setGlobalFilter(update);
      resetPageIndex();
    },
    ...(columnFilters && {
      onColumnFiltersChange: (update: Updater<ColumnFiltersState>) => {
        columnFilters.onChange(update);
        resetPageIndex();
      },
    }),
  });
  const lastPage = Math.max(0, table.getPageCount() - 1);

  useEffect(() => {
    if (pagination.pageIndex > lastPage) {
      table.setPageIndex(lastPage);
    }
  }, [lastPage, pagination.pageIndex, table]);

  return table;
}
