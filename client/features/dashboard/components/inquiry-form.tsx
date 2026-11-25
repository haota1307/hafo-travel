"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormCombobox } from "./form-combobox";
import { Textarea } from "@/components/ui/textarea";
import { staff } from "../fixtures";
import { useWorkspace } from "./workspace";
import type { DashboardRecord } from "../records";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

export function InquiryForm({
  row,
  onDone,
}: {
  row?: DashboardRecord;
  onDone: () => void;
}) {
  const t = useTranslations("dashboard");
  const { data, inquiryState, addInquiry, editInquiries } = useWorkspace();
  const current = row ? inquiryState(row.id) : undefined;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const value = (key: string) => String(values.get(key) ?? "").trim();
    const update = {
      status: value("status"),
      owner: value("owner"),
      followUp: value("followUp"),
      note: value("note"),
    };

    if (row) {
      editInquiries({ [row.id]: update });
    } else {
      const nextId =
        Math.max(...data.inquiries.map((item) => Number(item.id.slice(3)))) + 1;
      addInquiry({
        id: `TV-${nextId}`,
        name: value("guest"),
        email: value("email"),
        tour: value("tour"),
        message: value("message"),
        ...update,
      });
    }

    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {!row && (
        <>
          <FormField label={t("fields.guest")}>
            <Input name="guest" required pattern=".*\S.*" maxLength={120} />
          </FormField>
          <FormField label={t("fields.email")}>
            <Input name="email" type="email" required maxLength={200} />
          </FormField>
          <FormCombobox
            label={t("fields.tour")}
            name="tour"
            required
            options={data.tours.map((item) => ({
              value: item.id,
              label: item.title,
            }))}
          />
          <FormField label={t("message")}>
            <Textarea name="message" rows={3} required maxLength={2000} />
          </FormField>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormCombobox
          label={t("status")}
          name="status"
          defaultValue={current?.status ?? "new"}
          options={["new", "working", "closed"].map((value) => ({
            value,
            label: t(`statuses.${value}`),
          }))}
        />
        <FormCombobox
          label={t("fields.owner")}
          name="owner"
          defaultValue={current?.owner ?? ""}
          options={[
            { value: "", label: t("unassigned") },
            ...staff.map((item) => ({ value: item.id, label: item.name })),
          ]}
        />
      </div>
      <FormField label={t("fields.followUp")}>
        <Input name="followUp" type="date" defaultValue={current?.followUp} />
      </FormField>
      <FormField label={t("internalNote")}>
        <Textarea
          name="note"
          rows={3}
          defaultValue={current?.note}
          maxLength={2000}
        />
      </FormField>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit">{row ? t("save") : t("addInquiry")}</Button>
      </div>
    </form>
  );
}
