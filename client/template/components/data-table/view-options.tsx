"use client";
import {
  DataTableViewOptions as SharedControl,
  type DataTableViewOptionsProps,
} from "@/components/shared/data-table/view-options";
import { usePortalContainer } from "@/template/context/portal-container-provider";
import { useI18n } from "@/template/i18n/provider";
export function DataTableViewOptions<TData extends object>(
  props: Omit<DataTableViewOptionsProps<TData>, "container" | "label">,
) {
  const container = usePortalContainer();
  const { t } = useI18n();

  return <SharedControl {...props} container={container} label={t} />;
}
