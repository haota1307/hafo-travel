"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useWorkspace } from "./workspace";

type Option = { value: string; label: string };

export function FormCombobox({
  name,
  label,
  options,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
}) {
  const id = useId();
  const { container } = useWorkspace();
  const t = useTranslations("dashboard");

  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Combobox
        name={name}
        items={options}
        defaultValue={
          options.find((option) => option.value === defaultValue) ??
          options[0] ??
          null
        }
        isItemEqualToValue={(item, value) => item.value === value.value}
        required={required}
      >
        <ComboboxTrigger
          id={id}
          render={
            <Button
              variant="outline"
              type="button"
              className="w-full min-w-0 justify-between font-normal"
            />
          }
        >
          <span className="truncate">
            <ComboboxValue />
          </span>
        </ComboboxTrigger>
        {container && (
          <ComboboxContent
            portalContainer={container}
            className="min-w-(--anchor-width)"
          >
            <ComboboxInput
              aria-label={label}
              placeholder={t("filterSearch")}
              showTrigger={false}
            />
            <ComboboxEmpty>{t("noResults")}</ComboboxEmpty>
            <ComboboxList>
              {(option: Option) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        )}
      </Combobox>
    </div>
  );
}
