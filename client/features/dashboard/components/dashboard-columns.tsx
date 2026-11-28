"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/shared/data-table/column-header";
import type { ColumnDef } from "@/components/shared/data-table/table-features";
import type { DashboardRecord, SampleSection } from "../records";
import { listColumns } from "../records";
import { StatusBadge } from "./record-ui";

export function useDashboardColumns(
  section: SampleSection,
  container: HTMLElement | null,
  openRecord: (id: string) => void,
) {
  const t = useTranslations("dashboard");
  const labels = useTranslations("template");

  return useMemo<ColumnDef<DashboardRecord>[]>(() => {
    const fields: ColumnDef<DashboardRecord>[] = listColumns[section].map(
      (field) => ({
        id: field,
        accessorFn: (row) => row.values[field] ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader
            container={container}
            column={column}
            title={t(`fields.${field}`)}
          />
        ),
        enableSorting: !["date", "price", "amount", "capacity"].includes(field),
        filterFn: (row, id, values: string[]) =>
          values.includes(row.getValue(id)),
        cell: ({ getValue }) => (
          <LabeledTooltip
            label={String(getValue())}
            portalContainer={container}
          >
            <span className="block max-w-64 truncate" tabIndex={0}>
              {String(getValue())}
            </span>
          </LabeledTooltip>
        ),
      }),
    );

    fields.push({
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          container={container}
          column={column}
          title={t("status")}
        />
      ),
      filterFn: (row, id, values: string[]) =>
        values.includes(row.getValue(id)),
      cell: ({ row }) =>
        row.original.status && <StatusBadge status={row.original.status} />,
    });

    return [
      {
        id: "select",
        enableHiding: false,
        enableSorting: false,
        meta: { className: "w-8" },
        header: ({ table }) => (
          <Checkbox
            className="rounded-full shadow-xs"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
            aria-label={labels("selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            className="rounded-full shadow-xs"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value)}
            aria-label={labels("selectRow") + " · " + row.original.title}
          />
        ),
      },
      {
        accessorKey: "title",
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            container={container}
            column={column}
            title={t(`primary.${section}`)}
          />
        ),
        cell: ({ row }) => (
          <button
            onClick={() => openRecord(row.original.id)}
            className="inline-flex max-w-80 items-baseline gap-2 text-start hover:underline"
          >
            <span className="truncate font-medium">{row.original.title}</span>
            {row.original.subtitle && (
              <span className="truncate text-muted-foreground">
                {row.original.subtitle}
              </span>
            )}
          </button>
        ),
      },
      ...fields,
      {
        id: "actions",
        meta: { className: "w-10 text-end" },
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">{t("detail")}</span>,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("viewRecord", { name: row.original.title })}
            onClick={() => openRecord(row.original.id)}
          >
            <Ellipsis />
          </Button>
        ),
      },
    ];
  }, [section, container, openRecord, t, labels]);
}
