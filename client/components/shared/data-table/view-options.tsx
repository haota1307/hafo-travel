"use client";

import {
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { type Table } from "./table-features";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type DataTableViewOptionsProps<TData extends object> = {
  container: HTMLElement | null;
  table: Table<TData>;
  label: (id: string) => string;
};

export function DataTableViewOptions<TData extends object>({
  container,
  label,
  table,
}: DataTableViewOptionsProps<TData>) {
  const t = useTranslations("template");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="ms-auto h-8 gap-1.5 rounded-md px-2.5 text-sm shadow-xs"
          />
        }
      >
        <MixerHorizontalIcon className="size-4" />
        {t("view")}
      </DropdownMenuTrigger>
      {container && (
        <DropdownMenuContent
          portalContainer={container}
          align="end"
          className="w-37.5"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide(),
            )
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  closeOnClick={false}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {label(column.id)}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
