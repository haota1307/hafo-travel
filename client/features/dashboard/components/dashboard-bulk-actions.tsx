"use client";

import { useTranslations } from "next-intl";
import { CircleArrowUp, Download, UserRoundCheck } from "lucide-react";
import { DataTableBulkActions } from "@/components/shared/data-table/bulk-actions";
import type { Table } from "@/components/shared/data-table/table-features";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "@/lib/download-csv";
import { staff } from "../fixtures";
import {
  listColumns,
  type DashboardRecord,
  type InquiryUpdate,
  type SampleSection,
} from "../records";
import { useWorkspace } from "./workspace";

export function DashboardBulkActions({
  section,
  table,
}: {
  section: SampleSection;
  table: Table<DashboardRecord>;
}) {
  const t = useTranslations("dashboard");
  const common = useTranslations("template");
  const { container, changePublication, inquiryState, editInquiries } =
    useWorkspace();
  const records = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const ids = records.map((row) => row.id);
  const publication = section === "tours" || section === "content";
  function clear() {
    table.resetRowSelection();
  }

  function modifyInquiries(field: "status" | "owner", value: string) {
    const updates: Record<string, InquiryUpdate> = {};

    for (const id of ids) {
      const current = inquiryState(id);

      if (current) {
        updates[id] = { ...current, [field]: value };
      }
    }

    editInquiries(updates);
  }

  function menu(
    label: string,
    icon: React.ReactNode,
    choices: { value: string; label: string }[],
    apply: (value: string) => void,
  ) {
    return (
      <DropdownMenu>
        <LabeledTooltip label={label} portalContainer={container}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label={label}
              />
            }
          >
            {icon}
          </DropdownMenuTrigger>
        </LabeledTooltip>
        {container && (
          <DropdownMenuContent
            portalContainer={container}
            side="top"
            sideOffset={12}
            className="w-max max-w-64"
          >
            {choices.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  apply(option.value);
                  clear();
                }}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    );
  }

  function exportSelected() {
    const fields = listColumns[section].filter((field) =>
      table.getColumn(field)?.getIsVisible(),
    );
    const showStatus =
      section !== "roles" && table.getColumn("status")?.getIsVisible();
    downloadCsv(section, [
      [
        "ID",
        t(`primary.${section}`),
        ...fields.map((field) => t(`fields.${field}`)),
        ...(showStatus ? [t("status")] : []),
      ],
      ...records.map((row) => [
        row.id,
        row.title,
        ...fields.map((field) => row.values[field] ?? ""),
        ...(showStatus && row.status ? [t(`statuses.${row.status}`)] : []),
      ]),
    ]);
    clear();
  }

  return (
    <DataTableBulkActions
      container={container}
      count={records.length}
      entity={t("bulkEntity", { section, count: records.length })}
      onClear={clear}
    >
      {(section === "inquiries" || publication) &&
        menu(
          common("updateStatus"),
          <CircleArrowUp />,
          (publication
            ? ["draft", "review", "published"]
            : ["new", "working", "closed"]
          ).map((value) => ({ value, label: t(`statuses.${value}`) })),
          (value) => {
            if (publication) {
              changePublication(ids, value);
            } else {
              modifyInquiries("status", value);
            }
          },
        )}
      {section === "inquiries" &&
        menu(
          t("assignOwner"),
          <UserRoundCheck />,
          [
            { value: "", label: t("unassigned") },
            ...staff.map((item) => ({ value: item.id, label: item.name })),
          ],
          (value) => modifyInquiries("owner", value),
        )}
      <LabeledTooltip label={t("exportSelected")} portalContainer={container}>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={t("exportSelected")}
          onClick={exportSelected}
        >
          <Download />
        </Button>
      </LabeledTooltip>
    </DataTableBulkActions>
  );
}
