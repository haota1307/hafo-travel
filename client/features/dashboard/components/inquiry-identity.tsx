import Image from "next/image";
import type { DashboardRecord } from "../records";

export function InquiryIdentity({ row }: { row: DashboardRecord }) {
  const initials = row.title
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("");

  return (
    <span className="flex items-center gap-3 text-start">
      {row.image && (
        <Image
          src={row.image}
          width={64}
          height={48}
          alt=""
          className="h-10 w-14 shrink-0 rounded-md object-cover"
        />
      )}
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
        {initials}
      </span>
      <span>
        <span className="block font-medium">{row.title}</span>
        {row.subtitle && (
          <span className="block text-xs leading-5 text-muted-foreground">
            {row.subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
