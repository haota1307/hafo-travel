"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "./form-combobox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { dashboardPath, type Section } from "../sections";
import type { Column, DashboardRecord } from "../records";
import { InquiryForm } from "./inquiry-form";
import { StatusBadge } from "./record-ui";
import { useWorkspace } from "./workspace";

export function RecordSheet({
  section,
  row,
  create = false,
  onClose,
}: {
  section: Section;
  row?: DashboardRecord;
  create?: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("dashboard");
  const { container, data, changeSetting, destinations } = useWorkspace();
  const publicPath =
    section === "tours" && row
      ? "/" + row.id
      : section === "content"
        ? row?.values.path
        : undefined;
  const relatedPayments =
    section === "bookings" && destinations.includes("payments")
      ? data.payments.filter((item) => item.values.booking === row?.id)
      : [];
  const relatedUsers =
    section === "roles" && destinations.includes("users")
      ? data.users.filter((item) => item.links?.role?.id === row?.id)
      : [];

  if (!container || (!row && !create)) {
    return null;
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        portalContainer={container}
        className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="gap-1 border-b p-5 pe-12">
          <SheetDescription>{t(`nav.${section}`)}</SheetDescription>
          <SheetTitle className="text-xl font-semibold">
            {row?.title ?? t("addInquiry")}
          </SheetTitle>
          {row?.subtitle && (
            <p className="text-sm text-muted-foreground">{row.subtitle}</p>
          )}
        </SheetHeader>
        <div className="grid gap-5 px-5 pb-6">
          {row && (
            <>
              {row.image && (
                <Image
                  src={row.image}
                  width={640}
                  height={300}
                  alt=""
                  className="aspect-[2.25] w-full rounded-lg object-cover"
                />
              )}
              {row.status && (
                <div>
                  <StatusBadge status={row.status} />
                </div>
              )}
              <dl className="divide-y rounded-lg border px-3">
                {Object.entries(row.values).map(([key, value]) => {
                  const link = row.links?.[key as Column];

                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(0,1.3fr)] items-baseline gap-3 py-2.5"
                    >
                      <dt className="text-muted-foreground">
                        {t(`fields.${key}`)}
                      </dt>
                      <dd className="break-words text-end font-medium">
                        {link && destinations.includes(link.section) ? (
                          <Link
                            className="text-primary underline-offset-2 hover:underline"
                            href={dashboardPath(link.section, link.id)}
                          >
                            {value} <ArrowUpRight className="inline size-3" />
                          </Link>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {row.message && (
                <div>
                  <h3 className="mb-1 font-medium">
                    {section === "inquiries" ? t("message") : t("theme")}
                  </h3>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {row.message}
                  </p>
                </div>
              )}
              {publicPath && (
                <Link
                  href={publicPath}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {t("previewPage")}
                  <ArrowUpRight className="size-4" />
                </Link>
              )}
              {relatedPayments.map((item) => (
                <Link
                  key={item.id}
                  href={dashboardPath("payments", item.id)}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  {t("transaction")} · {item.title}
                  <ArrowUpRight className="size-4" />
                </Link>
              ))}
              {relatedUsers.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">{t("nav.users")}</h3>
                  {relatedUsers.map((item) => (
                    <Link
                      className="flex items-center justify-between border-t py-2.5"
                      key={item.id}
                      href={dashboardPath("users", item.id)}
                    >
                      {item.title}
                      <ArrowUpRight className="size-4" />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          {section === "inquiries" && (
            <InquiryForm key={row?.id ?? "new"} row={row} onDone={onClose} />
          )}
          {row &&
            (section === "users" ||
              section === "content" ||
              section === "tours") && (
              <form
                key={row.id}
                className="grid gap-3 border-t pt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const choice = String(
                    new FormData(event.currentTarget).get("choice"),
                  );
                  changeSetting(
                    section === "users" ? "userRoles" : "publication",
                    [row.id],
                    choice,
                  );
                  onClose();
                }}
              >
                <FormCombobox
                  name="choice"
                  required
                  label={section === "users" ? t("fields.role") : t("status")}
                  defaultValue={
                    section === "users" ? row.links?.role?.id : row.status
                  }
                  options={
                    section === "users"
                      ? data.roles.map((role) => ({
                          value: role.id,
                          label: role.title,
                        }))
                      : ["draft", "review", "published"].map((value) => ({
                          value,
                          label: t(`statuses.${value}`),
                        }))
                  }
                />
                <Button type="submit" className="justify-self-end">
                  {t("save")}
                </Button>
              </form>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
