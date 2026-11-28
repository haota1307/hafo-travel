"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormCombobox } from "@/features/dashboard/components/form-combobox";
import { accessibleDestinations } from "@/features/dashboard/sections";
import { useGetRoles } from "@/features/roles/roles.queries";
import { getRoleOptionLabel } from "@/features/roles/roles-ui";

type UserFormField = "firstName" | "lastName" | "email";

type TextField = { registration: UseFormRegisterReturn; invalid: boolean };

export function UserTextField({
  name,
  disabled,
  field,
}: {
  name: UserFormField;
  disabled: boolean;
  field: TextField;
}) {
  const t = useTranslations("users");
  const id = useId();
  const email = name === "email";
  const autoComplete = email
    ? "email"
    : name === "firstName"
      ? "given-name"
      : "family-name";

  return (
    <Field data-invalid={field.invalid || undefined}>
      <FieldLabel htmlFor={id}>
        <span>
          {t(`fields.${name}`)}
          <span aria-hidden="true" className="ms-1 text-destructive">
            *
          </span>
        </span>
      </FieldLabel>
      <Input
        id={id}
        type={email ? "email" : "text"}
        autoComplete={autoComplete}
        maxLength={email ? 254 : 100}
        disabled={disabled}
        required
        aria-invalid={field.invalid}
        aria-describedby={field.invalid ? id + "-error" : undefined}
        {...field.registration}
      />
      {field.invalid && (
        <FieldError id={id + "-error"}>
          {t(email ? "errors.email" : "errors.name")}
        </FieldError>
      )}
    </Field>
  );
}

export function UserNameFields({
  firstName,
  lastName,
  disabled,
}: {
  firstName: TextField;
  lastName: TextField;
  disabled: boolean;
}) {
  const locale = useLocale();
  const names =
    locale === "vi"
      ? (["lastName", "firstName"] as const)
      : (["firstName", "lastName"] as const);

  return names.map((name) => (
    <UserTextField
      key={name}
      name={name}
      field={name === "firstName" ? firstName : lastName}
      disabled={disabled}
    />
  ));
}

export function useInternalRoleOptions(actorId: string) {
  const locale = useLocale();
  const roles = useTranslations("roles");
  const query = useGetRoles(actorId);
  const options = query.isSuccess
    ? query.data
        .filter((role) => accessibleDestinations(role.permissions).length > 0)
        .map((role) => ({
          value: role.id,
          label: getRoleOptionLabel(role, roles, locale),
        }))
        .sort((left, right) => left.label.localeCompare(right.label, locale))
    : [];

  return {
    options,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}

export function UserRoleField({
  field,
  invalid,
  roles,
  disabled,
}: {
  field: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
  };
  invalid: boolean;
  roles: ReturnType<typeof useInternalRoleOptions>;
  disabled: boolean;
}) {
  const t = useTranslations("users");
  const errorId = useId();

  return (
    <Field data-invalid={invalid || undefined}>
      <FormCombobox
        name={field.name}
        label={t("fields.role")}
        options={roles.options}
        required
        disabled={disabled || roles.options.length === 0}
        selection={{
          value: field.value,
          onChange: field.onChange,
          onBlur: field.onBlur,
          invalid,
          describedBy: invalid ? errorId : undefined,
        }}
      />
      {invalid && <FieldError id={errorId}>{t("errors.role")}</FieldError>}
      {roles.isLoading && <p role="status">{t("loadingRoles")}</p>}
      {roles.isError && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status">{t("errors.rolesUnavailable")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => roles.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      )}
      {roles.isSuccess && roles.options.length === 0 && (
        <p role="status">{t("noRoles")}</p>
      )}
    </Field>
  );
}
