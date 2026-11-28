"use client";

import { useRef } from "react";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowAction<ActionId extends string> = {
  id: ActionId;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
};

export function DataTableRowActionsMenu<ActionId extends string>({
  actions,
  container,
  label,
  onAction,
}: {
  actions: RowAction<ActionId>[];
  container: HTMLElement | null;
  label: string;
  onAction: (action: ActionId) => void;
}) {
  const selectedAction = useRef<ActionId | null>(null);

  return (
    <DropdownMenu
      modal={false}
      onOpenChangeComplete={(open) => {
        if (!open && selectedAction.current !== null) {
          const action = selectedAction.current;
          selectedAction.current = null;
          onAction(action);
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 data-popup-open:bg-accent"
            aria-label={label}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      {container && (
        <DropdownMenuContent
          portalContainer={container}
          align="end"
          className="w-max"
        >
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              variant={action.destructive ? "destructive" : "default"}
              disabled={action.disabled}
              onClick={() => {
                selectedAction.current = action.id;
              }}
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
