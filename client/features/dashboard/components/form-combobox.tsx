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
  disabled,
  selection,
}: {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  selection?: {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    invalid: boolean;
    describedBy?: string;
  };
}) {
  const id = useId();
  const { container } = useWorkspace();
  const t = useTranslations("dashboard");

  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-1 text-destructive">
            *
          </span>
        )}
      </label>
      <Combobox
        name={name}
        items={options}
        {...(selection
          ? {
              value:
                options.find((option) => option.value === selection.value) ??
                null,
              onValueChange: (option: Option | null) =>
                selection.onChange(option?.value ?? ""),
            }
          : {
              defaultValue:
                options.find((option) => option.value === defaultValue) ??
                options[0] ??
                null,
            })}
        isItemEqualToValue={(item, value) => item?.value === value?.value}
        required={required}
        disabled={disabled}
      >
        <ComboboxTrigger
          id={id}
          onBlur={selection?.onBlur}
          aria-invalid={selection?.invalid}
          aria-describedby={selection?.describedBy}
          render={
            <Button
              variant="outline"
              type="button"
              className="w-full min-w-0 justify-between font-normal"
            />
          }
        >
          <span className="truncate">
            <ComboboxValue placeholder={label} />
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
