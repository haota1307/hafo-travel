"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { HttpError } from "@/lib/http";

import { getUserErrorKey, type UserLabels } from "../users-ui";
import { useUpdateUserName, type useInviteUser } from "../users.queries";
import {
  InviteUserFormSchema,
  UserNameSchema,
  UserRoleFormSchema,
  type InternalUser,
  type UserInvitationResult,
} from "../users.schema";
import {
  UserNameFields,
  UserRoleField,
  UserTextField,
  useInternalRoleOptions,
} from "./user-fields";

export function showInvitationResult(
  { invitationDelivery }: UserInvitationResult,
  t: UserLabels,
) {
  const sent = invitationDelivery === "sent";

  toast.add({
    type: sent ? "success" : "warning",
    title: t(sent ? "invitationSent" : "invitationUnconfirmed"),
    description: sent ? undefined : t("invitationUnconfirmedDescription"),
  });
}

export function InviteUserForm({
  actorId,
  mutation,
  onDone,
  onCancel,
}: {
  actorId: string;
  mutation: ReturnType<typeof useInviteUser>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("users");
  const locale = useLocale();
  const roles = useInternalRoleOptions(actorId);
  const form = useForm({
    resolver: zodResolver(InviteUserFormSchema),
    defaultValues: { firstName: "", lastName: "", email: "", roleId: "" },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((values) => {
    mutation.mutate(
      { form: values, locale },
      {
        onSuccess: (result) => {
          showInvitationResult(result, t);
          onDone();
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: t(
              error instanceof HttpError && error.status === 409
                ? "errors.emailUsed"
                : getUserErrorKey(error),
            ),
          });
        },
      },
    );
  });

  return (
    <form noValidate className="grid gap-4" onSubmit={submit}>
      <UserNameFields
        firstName={{
          registration: form.register("firstName"),
          invalid: !!errors.firstName,
        }}
        lastName={{
          registration: form.register("lastName"),
          invalid: !!errors.lastName,
        }}
        disabled={mutation.isPending}
      />
      <UserTextField
        name="email"
        field={{
          registration: form.register("email"),
          invalid: !!errors.email,
        }}
        disabled={mutation.isPending}
      />
      <Controller
        name="roleId"
        control={form.control}
        render={({ field, fieldState }) => (
          <UserRoleField
            field={field}
            invalid={fieldState.invalid}
            roles={roles}
            disabled={mutation.isPending}
          />
        )}
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending || roles.options.length === 0}
        >
          {t("sendInvitation")}
        </Button>
      </div>
    </form>
  );
}

export function EditUserNameForm({
  actorId,
  user,
  onDone,
}: {
  actorId: string;
  user: InternalUser;
  onDone: () => void;
}) {
  const t = useTranslations("users");
  const mutation = useUpdateUserName(actorId, user.userId);
  const form = useForm({
    resolver: zodResolver(UserNameSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });
  const { errors } = form.formState;
  const submit = form.handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.add({ type: "success", title: t("nameUpdated") });
        onDone();
      },
      onError: (error) =>
        toast.add({ type: "error", title: t(getUserErrorKey(error)) }),
    });
  });

  return (
    <form noValidate className="grid gap-4" onSubmit={submit}>
      <UserNameFields
        firstName={{
          registration: form.register("firstName"),
          invalid: !!errors.firstName,
        }}
        lastName={{
          registration: form.register("lastName"),
          invalid: !!errors.lastName,
        }}
        disabled={mutation.isPending}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={mutation.isPending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

export function UserRoleForm({
  actorId,
  currentRole,
  pending,
  onSubmit,
  onCancel,
}: {
  actorId: string;
  currentRole?: string;
  pending: boolean;
  onSubmit: (roleId: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("users");
  const roles = useInternalRoleOptions(actorId);
  const form = useForm({
    resolver: zodResolver(UserRoleFormSchema),
    defaultValues: { roleId: currentRole ?? "" },
  });

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={form.handleSubmit(({ roleId }) => {
        if (
          roles.options.some(({ value }) => value === roleId) &&
          roleId !== currentRole
        ) {
          onSubmit(roleId);
        }
      })}
    >
      <Controller
        name="roleId"
        control={form.control}
        render={({ field, fieldState }) => (
          <UserRoleField
            field={field}
            invalid={fieldState.invalid}
            roles={roles}
            disabled={pending}
          />
        )}
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
        <Button
          type="submit"
          disabled={
            pending ||
            roles.options.length === 0 ||
            (!!currentRole && !form.formState.isDirty)
          }
        >
          {t("changeRole")}
        </Button>
      </div>
    </form>
  );
}
