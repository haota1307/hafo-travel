"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { type Table } from "./table-features";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableFacetedFilter } from "./faceted-filter";
import { DataTableViewOptions } from "./view-options";

export type DataTableToolbarProps<TData extends object> = {
  table: Table<TData>;
  container: HTMLElement | null;
  label: (id: string) => string;
  children?: React.ReactNode;
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
};

export function DataTableToolbar<TData extends object>({
  table,
  searchPlaceholder,
  label,
  container,
  children,
  searchKey,
  filters = [],
}: DataTableToolbarProps<TData>) {
  const t = useTranslations("template");
  const isFiltered =
    table.state.columnFilters.length > 0 || table.state.globalFilter;

  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchKey ? (
          <Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-37.5 rounded-md shadow-xs lg:w-62.5"
          />
        ) : (
          <Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={table.state.globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-8 w-37.5 rounded-md shadow-xs lg:w-62.5"
          />
        )}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId);

            if (!column) {
              return null;
            }

            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                container={container}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            );
          })}
        </div>
        {children}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            {t("reset")} <Cross2Icon className="ms-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} label={label} container={container} />
    </div>
  );
}
