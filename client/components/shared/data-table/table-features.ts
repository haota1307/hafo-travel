import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  type Column as TableColumn,
  type ColumnDef as TableColumnDef,
  type ReactTable,
  type Row as TableRow,
} from "@tanstack/react-table";

type ColumnMeta = {
  className?: string;
  tdClassName?: string;
  thClassName?: string;
};

export const dataTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns,
  sortFns,
  columnMeta: {} as ColumnMeta,
});

export type Table<TData extends object> = ReactTable<
  typeof dataTableFeatures,
  TData
>;

export type Row<TData extends object> = TableRow<
  typeof dataTableFeatures,
  TData
>;

export type Column<TData extends object, TValue = unknown> = TableColumn<
  typeof dataTableFeatures,
  TData,
  TValue
>;

export type ColumnDef<TData extends object, TValue = unknown> = TableColumnDef<
  typeof dataTableFeatures,
  TData,
  TValue
>;
