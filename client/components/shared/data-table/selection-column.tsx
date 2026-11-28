import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "./table-features";

export function createSelectionColumn<TData extends object>(
  selectAllLabel: string,
  getRowLabel: (row: TData) => string,
): ColumnDef<TData> {
  return {
    id: "select",
    enableHiding: false,
    enableSorting: false,
    meta: { className: "w-8" },
    header: ({ table }) => (
      <Checkbox
        className="rounded-full shadow-xs"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={
          table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
        aria-label={selectAllLabel}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="rounded-full shadow-xs"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value)}
        aria-label={getRowLabel(row.original)}
      />
    ),
  };
}
