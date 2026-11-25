"use client";
import {
  DataTableColumnHeader as SharedControl,
  type DataTableColumnHeaderProps,
} from "@/components/shared/data-table/column-header";
import { usePortalContainer } from "@/template/context/portal-container-provider";
import { useI18n } from "@/template/i18n/provider";
export function DataTableColumnHeader<TData extends object, TValue>(
  props: Omit<DataTableColumnHeaderProps<TData, TValue>, "container">,
) {
  const container = usePortalContainer();
  const { t } = useI18n();

  return (
    <SharedControl {...props} container={container} title={t(props.title)} />
  );
}
