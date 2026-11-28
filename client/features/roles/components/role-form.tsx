"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  useForm,
  type FieldErrors,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

import type { useCreateRole, useUpdateRole } from "../roles.queries";
import {
  RoleInfoFormSchema,
  type Role,
  type RoleInfoFormValues,
} from "../roles.schema";
import { getRoleErrorKey, getRoleName } from "../roles-ui";

function RoleInfoFields({
  register,
  errors,
  disabled,
}: {
  register: (field: keyof RoleInfoFormValues) => UseFormRegisterReturn;
  errors: FieldErrors<RoleInfoFormValues>;
  disabled: boolean;
}) {
  const t = useTranslations("roles");
  const id = useId();

  return (
    <div className="grid gap-4">
      {(["displayNameVi", "displayNameEn", "name"] as const).map((field) => (
        <Field key={field} data-invalid={!!errors[field] || undefined}>
          <FieldLabel htmlFor={`${id}-${field}`}>
            <span>
              {t(`fields.${field}`)}
              <span aria-hidden="true" className="ms-1 text-destructive">
                *
              </span>
            </span>
          </FieldLabel>
          <Input
            id={`${id}-${field}`}
            required
            maxLength={field === "name" ? 64 : 100}
            disabled={disabled}
            aria-invalid={!!errors[field]}
            aria-describedby={
              errors[field] ? `${id}-${field}-error` : undefined
            }
            autoComplete="off"
            {...register(field)}
          />
          {errors[field] && (
            <FieldError id={`${id}-${field}-error`}>
              {t(field === "name" ? "errors.name" : "errors.displayName")}
            </FieldError>
          )}
        </Field>
      ))}
      <Field data-invalid={!!errors.description || undefined}>
        <FieldLabel htmlFor={`${id}-description`}>
          {t("fields.description")}
        </FieldLabel>
        <Textarea
          id={`${id}-description`}
          maxLength={500}
          disabled={disabled}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? `${id}-description-error` : undefined
          }
          {...register("description")}
        />
        {errors.description && (
          <FieldError id={`${id}-description-error`}>
            {t("errors.description")}
          </FieldError>
        )}
      </Field>
    </div>
  );
}

export function CreateRoleForm({
  mutation,
  onClose,
}: {
  mutation: ReturnType<typeof useCreateRole>;
  onClose: () => void;
}) {
  const t = useTranslations("roles");
  const form = useForm({
    resolver: zodResolver(RoleInfoFormSchema),
    defaultValues: {
      displayNameVi: "",
      displayNameEn: "",
      name: "",
      description: "",
    },
  });
  const pending = mutation.isPending;

  const submit = form.handleSubmit((values) => {
    if (pending) {
      return;
    }

    mutation.mutate(
      { ...values, permissions: [] },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: t("created") });
          onClose();
        },
        onError: (error) => {
          toast.add({ type: "error", title: t(getRoleErrorKey(error)) });
        },
      },
    );
  });

  return (
    <form noValidate className="grid gap-4" onSubmit={submit}>
      <RoleInfoFields
        register={form.register}
        errors={form.formState.errors}
        disabled={pending}
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

export function RoleInfoForm({
  role,
  mutation,
  onCancel,
  onSaved,
}: {
  role: Role;
  mutation: ReturnType<typeof useUpdateRole>;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("roles");
  const form = useForm({
    resolver: zodResolver(RoleInfoFormSchema),
    defaultValues: {
      displayNameVi: getRoleName(role, t, "vi"),
      displayNameEn: getRoleName(role, t, "en"),
      name: role.name,
      description: role.description,
    },
  });
  const { errors, isDirty } = form.formState;
  const pending = mutation.isPending;

  const submit = form.handleSubmit((values) => {
    if (pending || !isDirty) {
      return;
    }

    mutation.mutate(values, {
      onSuccess: () => {
        toast.add({ type: "success", title: t("updated") });
        onSaved();
      },
      onError: (error) => {
        toast.add({ type: "error", title: t(getRoleErrorKey(error)) });
      },
    });
  });

  return (
    <form noValidate className="grid gap-4" onSubmit={submit}>
      <RoleInfoFields
        register={form.register}
        errors={errors}
        disabled={pending}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={pending || !isDirty}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
