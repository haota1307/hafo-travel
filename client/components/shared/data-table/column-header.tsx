"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons";
import { type Column } from "./table-features";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DataTableColumnHeaderProps<
  TData extends object,
  TValue,
> = React.HTMLAttributes<HTMLDivElement> & {
  container: HTMLElement | null;
  column: Column<TData, TValue>;
  title: string;
};

export function DataTableColumnHeader<TData extends object, TValue>({
  container,
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const t = useTranslations("template");

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="-ms-2.5 h-8 rounded-md text-sm data-popup-open:bg-accent"
            />
          }
        >
          <span>{title}</span>
          {column.getIsSorted() === "desc" ? (
            <ArrowDownIcon className="ms-2 h-4 w-4" />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUpIcon className="ms-2 h-4 w-4" />
          ) : (
            <CaretSortIcon className="ms-2 h-4 w-4" />
          )}
        </DropdownMenuTrigger>
        {container && (
          <DropdownMenuContent portalContainer={container} align="start">
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUpIcon className="size-3.5 text-muted-foreground/70" />
              {t("asc")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDownIcon className="size-3.5 text-muted-foreground/70" />
              {t("desc")}
            </DropdownMenuItem>
            {column.getCanHide() && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => column.toggleVisibility(false)}
                >
                  <EyeNoneIcon className="size-3.5 text-muted-foreground/70" />
                  {t("hide")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
