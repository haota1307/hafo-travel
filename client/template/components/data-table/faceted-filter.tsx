"use client";
import {
  DataTableFacetedFilter as SharedControl,
  type DataTableFacetedFilterProps,
} from "@/components/shared/data-table/faceted-filter";
import { usePortalContainer } from "@/template/context/portal-container-provider";
import { useI18n } from "@/template/i18n/provider";
export function DataTableFacetedFilter<TData extends object, TValue>(
  props: Omit<DataTableFacetedFilterProps<TData, TValue>, "container">,
) {
  const container = usePortalContainer();
  const { t } = useI18n();

  return (
    <SharedControl
      {...props}
      container={container}
      title={t(props.title ?? "")}
      options={props.options.map((option) => ({
        ...option,
        label: t(option.label),
      }))}
    />
  );
}
