"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardRecord } from "../records";
import type { Section } from "../sections";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

const tones: Record<string, string> = {
  new: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  working:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  published:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  cancelled:
    "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("dashboard.statuses");
  const colors: Record<string, string> = {
    active: "published",
    confirmed: "published",
    paid: "published",
    open: "published",
    review: "working",
    pending: "working",
    invited: "new",
    locked: "cancelled",
    refunded: "new",
    full: "working",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[colors[status] ?? status] ??
          "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? t(status)}
    </span>
  );
}

export function RecordIdentity({
  section,
  row,
}: {
  section: Section;
  row: DashboardRecord;
}) {
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
      {(section === "users" || section === "inquiries") && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
          {initials}
        </span>
      )}
      {(section === "roles" || section === "content") && (
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          {section === "roles" ? (
            <ShieldCheck className="size-4" />
          ) : (
            <FileText className="size-4" />
          )}
        </span>
      )}
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
