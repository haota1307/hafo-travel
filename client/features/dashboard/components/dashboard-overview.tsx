"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  CalendarDays,
  CalendarClock,
  Inbox,
  UserRoundSearch,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PageHeading, RecordIdentity, StatusBadge } from "./record-ui";
import { useWorkspace } from "./workspace";
import { sampleDate } from "../fixtures";
import { dashboardPath } from "../sections";
import { formatDate } from "../records";

export function DashboardOverview() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const { data, inquiryState } = useWorkspace();
  const cards = [
    {
      label: "newInquiries",
      value: data.inquiries.filter((item) => item.status === "new").length,
      icon: Inbox,
      href: "/dashboard/inquiries?status=new",
    },
    {
      label: "unassigned",
      value: data.inquiries.filter((item) => !inquiryState(item.id)?.owner)
        .length,
      icon: UserRoundSearch,
      href: "/dashboard/inquiries?queue=unassigned",
    },
    {
      label: "followUps",
      value: data.inquiries.filter(
        (item) =>
          item.status !== "closed" &&
          inquiryState(item.id)?.followUp === sampleDate,
      ).length,
      icon: CalendarClock,
      href: "/dashboard/inquiries?queue=follow-up",
    },
    {
      label: "nav.departures",
      value: data.departures.length,
      icon: CalendarDays,
      href: "/dashboard/departures",
    },
  ];
  const [next, ...upcoming] = data.departures;

  return (
    <>
      <PageHeading
        title={t("nav.overview")}
        description={t("descriptions.overview")}
        action={
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            {formatDate(sampleDate, locale)}
          </span>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-start justify-between rounded-xl border bg-card p-4 text-card-foreground transition-colors hover:border-primary/50 sm:p-5"
          >
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t(label)}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
            </div>
            <span className="rounded-lg bg-accent p-2 text-accent-foreground">
              <Icon className="size-4" />
            </span>
          </Link>
        ))}
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 sm:p-5">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("recentInquiries")}
            </h2>
            <Link
              href="/dashboard/inquiries"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("viewAll")}
              <ArrowRight />
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-t bg-muted/40">
                <TableHead className="ps-5">{t("fields.guest")}</TableHead>
                <TableHead>{t("fields.tour")}</TableHead>
                <TableHead className="pe-5">{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.inquiries.slice(0, 6).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="py-3 ps-5">
                    <Link
                      href={dashboardPath("inquiries", row.id)}
                      className="hover:underline"
                    >
                      <RecordIdentity section="inquiries" row={row} />
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-52 whitespace-normal">
                    {row.values.tour}
                  </TableCell>
                  <TableCell className="pe-5">
                    <StatusBadge status={row.status!} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        <section className="min-w-0 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between gap-2 p-4 sm:p-5">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("upcoming")}
            </h2>
            <Link
              href="/dashboard/departures"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("viewAll")}
              <ArrowRight />
            </Link>
          </div>
          <div className="space-y-1 px-4 pb-3 sm:px-5">
            <Link
              href={dashboardPath("departures", next.id)}
              className="group relative mb-2 flex min-h-40 items-end overflow-hidden rounded-lg bg-slate-800 p-4 text-white"
            >
              {next.image && (
                <Image
                  fill
                  sizes="(min-width:1280px) 33vw, (min-width:768px) 75vw, 95vw"
                  alt=""
                  src={next.image}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <span className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
              <span className="relative">
                <span className="mb-1 flex items-center gap-1.5 text-xs">
                  <CalendarDays className="size-3.5" />
                  {next.values.date}
                </span>
                <span className="text-lg font-semibold">{next.title}</span>
              </span>
            </Link>
            {upcoming.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={dashboardPath("departures", item.id)}
                className="flex items-center gap-3 border-b py-3 last:border-0 hover:text-primary"
              >
                {item.image && (
                  <Image
                    src={item.image}
                    width={52}
                    height={42}
                    alt=""
                    className="h-10 w-12 rounded object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.values.date}
                  </span>
                </span>
                <StatusBadge status={item.status!} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
