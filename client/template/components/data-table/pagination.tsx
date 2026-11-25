"use client";
import {
  DataTablePagination as SharedControl,
  type DataTablePaginationProps,
} from "@/components/shared/data-table/pagination";
import { usePortalContainer } from "@/template/context/portal-container-provider";
export function DataTablePagination<TData extends object>(
  props: Omit<DataTablePaginationProps<TData>, "container">,
) {
  const container = usePortalContainer();

  return <SharedControl {...props} container={container} />;
}
