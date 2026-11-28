import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ErrorState({
  code,
  title,
  description,
  actions,
  className,
}: {
  code?: number;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center",
        className,
      )}
    >
      {code !== undefined && (
        <p
          aria-hidden="true"
          className="text-6xl leading-tight font-bold sm:text-[7rem]"
        >
          {code}
        </p>
      )}
      <div role="alert" className="max-w-lg space-y-2">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      )}
    </section>
  );
}
