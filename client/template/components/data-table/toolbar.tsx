"use client";
import {
  DataTableToolbar as SharedToolbar,
  type DataTableToolbarProps,
} from "@/components/shared/data-table/toolbar";
import { useI18n } from "@/template/i18n/provider";
import { usePortalContainer } from "@/template/context/portal-container-provider";
export function DataTableToolbar<TData extends object>({
  filters = [],
  searchPlaceholder = "Filter...",
  ...props
}: Omit<DataTableToolbarProps<TData>, "container" | "label">) {
  const { t } = useI18n();
  const container = usePortalContainer();

  return (
    <SharedToolbar
      {...props}
      label={t}
      container={container}
      searchPlaceholder={t(searchPlaceholder)}
      filters={filters.map((filter) => ({
        ...filter,
        title: t(filter.title),
        options: filter.options.map((option) => ({
          ...option,
          label: t(option.label),
        })),
      }))}
    />
  );
}
