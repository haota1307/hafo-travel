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

export const templateTableFeatures = tableFeatures({
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
  typeof templateTableFeatures,
  TData
>;

export type Row<TData extends object> = TableRow<
  typeof templateTableFeatures,
  TData
>;

export type Column<TData extends object, TValue = unknown> = TableColumn<
  typeof templateTableFeatures,
  TData,
  TValue
>;

export type ColumnDef<TData extends object, TValue = unknown> = TableColumnDef<
  typeof templateTableFeatures,
  TData,
  TValue
>;
