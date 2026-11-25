"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LabeledTooltip } from "@/components/shared/labeled-tooltip";

type Props = {
  count: number;
  entity: string;
  container: HTMLElement | null;
  onClear: () => void;
  children: React.ReactNode;
};

export function DataTableBulkActions({
  count,
  entity,
  container,
  onClear,
  children,
}: Props) {
  const t = useTranslations("template");
  const description = useId();

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      !(event.target instanceof HTMLElement) ||
      !event.currentTarget.contains(event.target)
    ) {
      return;
    }

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ),
    );
    const index = buttons.indexOf(
      event.target.closest("button") as HTMLButtonElement,
    );

    if (event.key === "Escape") {
      if (event.target.closest("[aria-haspopup]")) {
        return;
      }

      event.preventDefault();
      onClear();

      return;
    }

    const destinations: Record<string, number> = {
      ArrowRight: (index + 1) % buttons.length,
      ArrowLeft: (index + buttons.length - 1) % buttons.length,
      Home: 0,
      End: buttons.length - 1,
    };

    if (Object.hasOwn(destinations, event.key)) {
      event.preventDefault();
      buttons[destinations[event.key]]?.focus();
    }
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {count > 0 &&
          t("countSelectedBulkActionsToolbarIsAvailable", { count })}
      </div>
      {count > 0 && (
        <div
          role="toolbar"
          aria-label={t("bulkActionsForCountSelectedItems", { count })}
          aria-describedby={description}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-xl transition-transform motion-safe:sm:hover:scale-105"
        >
          <div className="flex items-center gap-x-2 rounded-xl border bg-background/95 p-2 shadow-xl backdrop-blur-lg supports-backdrop-filter:bg-background/60">
            <LabeledTooltip
              label={t("clearSelectionEscape")}
              portalContainer={container}
            >
              <Button
                variant="outline"
                size="icon"
                className="size-6 rounded-full"
                onClick={onClear}
                aria-label={t("clearSelection")}
              >
                <X />
              </Button>
            </LabeledTooltip>
            <Separator
              className="h-5 data-vertical:self-center"
              orientation="vertical"
            />
            <div
              id={description}
              className="flex items-center gap-x-1 whitespace-nowrap text-sm"
            >
              <Badge className="min-w-8 rounded-lg">{count}</Badge>
              <span className="hidden sm:inline">{entity}</span>
              {t("selected")}
            </div>
            <Separator
              className="h-5 data-vertical:self-center"
              orientation="vertical"
            />
            {children}
          </div>
        </div>
      )}
    </>
  );
}
