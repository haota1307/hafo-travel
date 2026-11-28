"use client";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableGrid } from "@/components/shared/data-table/grid";
import { DataTableToolbar } from "@/components/shared/data-table/toolbar";
import { DataTablePagination } from "@/components/shared/data-table/pagination";
import { useDataTable } from "@/components/shared/data-table/use-data-table";
import { PageHeading } from "@/components/shared/page-heading";
import { useRouter } from "@/i18n/navigation";
import { sampleDate } from "../fixtures";
import type { Column } from "../records";
import {
  dashboardPath,
  normalizeSearch,
  type SampleSection,
} from "../sections";
import { useDashboardLayout } from "./dashboard-layout-context";
import { useDashboardSampleData } from "./dashboard-sample-data";
import { RecordSheet } from "./record-sheet";
import { DashboardBulkActions } from "./dashboard-bulk-actions";
import { useDashboardColumns } from "./dashboard-columns";

const facetFields: Partial<Record<SampleSection, Column>> = {
  inquiries: "owner",
  bookings: "tour",
  payments: "method",
  content: "owner",
};

export function DashboardList({
  section,
  recordId,
  queue,
}: {
  section: SampleSection;
  recordId?: string;
  queue?: string;
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const params = useSearchParams();
  const { container } = useDashboardLayout();
  const { data, inquiryState } = useDashboardSampleData();
  const [create, setCreate] = useState(false);
  const rows = data[section];
  const scoped = useMemo(
    () =>
      rows.filter((row) => {
        if (section === "inquiries" && queue === "follow-up") {
          return (
            inquiryState(row.id)?.followUp === sampleDate &&
            row.status !== "closed"
          );
        }
        if (section === "inquiries" && queue === "unassigned") {
          return !inquiryState(row.id)?.owner;
        }

        return true;
      }),
    [rows, section, queue, inquiryState],
  );

  const navigate = useCallback(
    (changes: Record<string, string | undefined>) => {
      const next = new URLSearchParams(window.location.search);

      for (const [key, value] of Object.entries(changes)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }

      router.replace(
        dashboardPath(section) + (next.size ? "?" + next.toString() : ""),
        { scroll: false },
      );
    },
    [section, router],
  );
  const openRecord = useCallback(
    (id: string) => navigate({ record: id }),
    [navigate],
  );
  const columns = useDashboardColumns(section, container, openRecord);
  const facet = facetFields[section];
  const filterIds = ["status", ...(facet ? [facet] : [])];
  const columnFilters: ColumnFiltersState = filterIds
    .filter((id) => params.has(id))
    .map((id) => ({ id, value: params.getAll(id) }));
  const table = useDataTable({
    data: scoped,
    columns,
    getRowId: (row) => row.id,
    globalFilterFn: (row, _id, query) =>
      normalizeSearch(
        [
          row.original.title,
          row.original.subtitle,
          row.id,
          ...Object.values(row.original.values),
        ].join(" "),
      ).includes(normalizeSearch(String(query))),
    columnFilters: {
      state: columnFilters,
      onChange: (update) => {
        const next =
          typeof update === "function" ? update(columnFilters) : update;
        const query = new URLSearchParams(window.location.search);

        for (const id of filterIds) {
          query.delete(id);
        }

        for (const filter of next) {
          for (const value of filter.value as string[]) {
            query.append(filter.id, value);
          }
        }

        window.history.replaceState(
          null,
          "",
          window.location.pathname +
            (query.size ? "?" + query.toString() : "") +
            window.location.hash,
        );
      },
    },
  });

  const filters = filterIds
    .filter((id) => table.getColumn(id))
    .map((id) => {
      const values = rows
        .map((row) => (id === "status" ? row.status : row.values[id as Column]))
        .filter((value): value is string => !!value);

      return {
        columnId: id,
        title: id === "status" ? t("status") : t(`fields.${id}`),
        options: [...new Set(values)].map((value) => ({
          value,
          label: id === "status" ? t(`statuses.${value}`) : value,
        })),
      };
    });

  return (
    <>
      <PageHeading
        title={t(`nav.${section}`)}
        description={t(`descriptions.${section}`)}
        action={
          section === "inquiries" && (
            <Button onClick={() => setCreate(true)}>
              <Plus />
              {t("addInquiry")}
            </Button>
          )
        }
      />
      <div className="flex flex-1 flex-col gap-4 has-[[role=toolbar]]:pb-16">
        <DataTableToolbar
          table={table}
          container={container}
          label={(id) => (id === "status" ? t("status") : t(`fields.${id}`))}
          filters={filters}
          searchPlaceholder={t("filterSearch")}
        >
          {queue && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                table.setPageIndex(0);
                navigate({ queue: undefined });
              }}
            >
              {queue === "follow-up" ? t("followUps") : t("unassigned")}
              <X />
            </Button>
          )}
        </DataTableToolbar>
        <DataTableGrid table={table} empty={t("noResults")} />
        <DataTablePagination table={table} container={container} />
        <DashboardBulkActions section={section} table={table} />
      </div>
      <RecordSheet
        section={section}
        row={rows.find((row) => row.id === recordId)}
        create={create}
        onClose={() => {
          setCreate(false);

          if (recordId) {
            navigate({ record: undefined });
          }
        }}
      />
    </>
  );
}
