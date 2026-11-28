"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Link } from "@/i18n/navigation";
import { HttpError } from "@/lib/http";

import { useAccountAction } from "../auth.queries";
import { ResetPasswordSchema, VerifyEmailSchema } from "../auth.schema";
import { AuthErrorToast } from "./auth-error-toast";

const passwordSuccessMessages = {
  "verify-email": "registered",
  "reset-password": "passwordChanged",
  "accept-invitation": "invitationAccepted",
} as const;

export function AccountPasswordForm({
  action,
  submitLabel,
}: {
  action: keyof typeof passwordSuccessMessages;
  submitLabel: string;
}) {
  const t = useTranslations("auth");
  const verify = action === "verify-email";
  const acceptInvitation = action === "accept-invitation";
  const mutation = useAccountAction();
  const schema = z
    .object({
      firstName: verify ? VerifyEmailSchema.shape.firstName : z.string(),
      lastName: verify ? VerifyEmailSchema.shape.lastName : z.string(),
      password: z.string().min(1).pipe(ResetPasswordSchema.shape.password),
      confirmPassword: z.string().min(1),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ["confirmPassword"],
    });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });
  const errorStatus =
    mutation.error instanceof HttpError ? mutation.error.status : undefined;
  const invalidLink = errorStatus === 400 || !!form.formState.errors.root;

  const submit = form.handleSubmit(
    ({ firstName, lastName, password }) => {
      const token = window.location.hash.slice(1);

      if (!token || token.length > 4096) {
        form.setError("root", { type: "token" });
        toast.add({ type: "error", title: t("badLink") });

        return;
      }

      const command = verify
        ? ({
            action,
            body: { token, firstName, lastName, password },
          } as const)
        : ({ action, body: { token, password } } as const);
      mutation.mutate(command, {
        onSuccess: () => {
          form.reset();
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname,
          );
        },
      });
    },
    (errors) => {
      const messages = [];

      if (errors.firstName || errors.lastName) {
        messages.push(t("nameRule"));
      }
      if (errors.password && errors.password.type !== "too_small") {
        messages.push(t("passwordRule"));
      }
      if (
        errors.confirmPassword &&
        errors.confirmPassword.type !== "too_small"
      ) {
        messages.push(t("passwordMismatch"));
      }

      if (messages.length) {
        toast.add({ type: "error", title: messages.join(" ") });
      }
    },
  );

  if (mutation.isSuccess) {
    return <p role="status">{t(passwordSuccessMessages[action])}</p>;
  }

  return (
    <form noValidate onSubmit={submit}>
      <FieldGroup>
        {verify &&
          (["lastName", "firstName"] as const).map((name) => (
            <Field key={name}>
              <FieldLabel htmlFor={name}>{t(name)}</FieldLabel>
              <Input
                id={name}
                autoComplete={
                  name === "firstName" ? "given-name" : "family-name"
                }
                maxLength={100}
                aria-invalid={!!form.formState.errors[name]}
                {...form.register(name)}
              />
            </Field>
          ))}
        <Field>
          <FieldLabel htmlFor="password">{t("newPassword")}</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password", { deps: "confirmPassword" })}
          />
          {form.formState.errors.password?.type === "too_small" && (
            <FieldError>{t("passwordRequired")}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">
            {t("confirmPassword")}
          </FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.confirmPassword}
            aria-describedby={
              form.formState.errors.confirmPassword?.type === "too_small"
                ? "confirm-password-error"
                : undefined
            }
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword?.type === "too_small" && (
            <FieldError id="confirm-password-error">
              {t("confirmPasswordRequired")}
            </FieldError>
          )}
        </Field>
        <Button disabled={mutation.isPending} type="submit">
          {submitLabel}
        </Button>
        {(mutation.isError || form.formState.errors.root) && (
          <div>
            {mutation.isError && (
              <AuthErrorToast
                key={mutation.submittedAt}
                message={t(
                  errorStatus === 400
                    ? "badLink"
                    : errorStatus === 429
                      ? "limited"
                      : "unavailable",
                )}
              />
            )}
            {acceptInvitation ? (
              invalidLink && <p role="status">{t("requestInvitationAgain")}</p>
            ) : (
              <Link
                className="text-primary underline"
                href={verify ? "/auth/register" : "/auth/forgot-password"}
              >
                {t("requestAgain")}
              </Link>
            )}
          </div>
        )}
      </FieldGroup>
    </form>
  );
}
