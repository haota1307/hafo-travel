"use client";

import { useState } from "react";
import { type Table } from "@/template/components/data-table/table-features";
import { Trash2, CircleArrowUp, ArrowUpDown, Download } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/template/i18n/provider";
import { sleep } from "@/template/lib/utils";
import { Button } from "@/template/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/template/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/template/components/ui/tooltip";
import { DataTableBulkActions as BulkActionsToolbar } from "@/template/components/data-table";

import { priorities, statuses } from "../data/data";
import { type Task } from "../data/schema";
import { TasksMultiDeleteDialog } from "./tasks-multi-delete-dialog";

type DataTableBulkActionsProps<TData extends object> = {
  table: Table<TData>;
};

export function DataTableBulkActions<TData extends object>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleBulkStatusChange = (status: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task);
    toast.promise(sleep(2000), {
      loading: t("Updating status..."),
      success: () => {
        table.resetRowSelection();

        return t('Status updated to "{status}" for {count} task(s).', {
          status: t(status),
          count: selectedTasks.length,
        });
      },
      error: t("Error"),
    });
    table.resetRowSelection();
  };

  const handleBulkPriorityChange = (priority: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task);
    toast.promise(sleep(2000), {
      loading: t("Updating priority..."),
      success: () => {
        table.resetRowSelection();

        return t('Priority updated to "{priority}" for {count} task(s).', {
          priority: t(priority),
          count: selectedTasks.length,
        });
      },
      error: t("Error"),
    });
    table.resetRowSelection();
  };

  const handleBulkExport = () => {
    const selectedTasks = selectedRows.map((row) => row.original as Task);
    toast.promise(sleep(2000), {
      loading: t("Exporting tasks..."),
      success: () => {
        table.resetRowSelection();

        return t("Exported {count} task(s) to CSV.", {
          count: selectedTasks.length,
        });
      },
      error: t("Error"),
    });
    table.resetRowSelection();
  };

  return (
    <>
      <BulkActionsToolbar table={table} entityName="task">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label={t("Update status")}
                  title={t("Update status")}
                >
                  <CircleArrowUp />
                  <span className="sr-only">{t("Update status")}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("Update status")}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                defaultValue={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className="size-4 text-muted-foreground" />
                )}
                {t(status.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label={t("Update priority")}
                  title={t("Update priority")}
                >
                  <ArrowUpDown />
                  <span className="sr-only">{t("Update priority")}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("Update priority")}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {priorities.map((priority) => (
              <DropdownMenuItem
                key={priority.value}
                defaultValue={priority.value}
                onClick={() => handleBulkPriorityChange(priority.value)}
              >
                {priority.icon && (
                  <priority.icon className="size-4 text-muted-foreground" />
                )}
                {t(priority.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleBulkExport()}
              className="size-8"
              aria-label={t("Export tasks")}
              title={t("Export tasks")}
            >
              <Download />
              <span className="sr-only">{t("Export tasks")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("Export tasks")}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="size-8"
              aria-label={t("Delete selected tasks")}
              title={t("Delete selected tasks")}
            >
              <Trash2 />
              <span className="sr-only">{t("Delete selected tasks")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("Delete selected tasks")}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <TasksMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  );
}
