"use client";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeaderSearchButton({
  label,
  className,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <Button
      {...props}
      type="button"
      variant="outline"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "group relative h-8 w-full min-w-0 flex-1 justify-start rounded-md bg-muted/25 px-3 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent sm:w-40 sm:pe-12 md:flex-none lg:w-52 xl:w-64",
        className,
      )}
    >
      <SearchIcon
        aria-hidden="true"
        className="absolute inset-s-1.5 top-1/2 size-4 -translate-y-1/2"
      />
      <span className="ms-4 truncate">{label}</span>
      <kbd
        aria-hidden="true"
        className="pointer-events-none absolute inset-e-[0.3rem] top-[0.3rem] hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium select-none group-hover:bg-accent sm:flex"
      >
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
