"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HttpError } from "@/lib/http";

import { useAccountAction } from "../auth.queries";
import { EmailActionSchema } from "../auth.schema";
import { AuthErrorToast } from "./auth-error-toast";
import { GoogleLoginButton } from "./google-login-button";

export function AccountEmailForm({
  action,
}: {
  action: "register" | "forgot-password";
}) {
  const t = useTranslations("auth");
  const locale = useLocale() === "en" ? "en" : "vi";
  const mutation = useAccountAction();
  const form = useForm({
    resolver: zodResolver(EmailActionSchema.pick({ email: true })),
    defaultValues: { email: "" },
  });

  if (mutation.isSuccess) {
    return <p role="status">{t("checkInbox")}</p>;
  }

  return (
    <>
      <form
        noValidate
        onSubmit={form.handleSubmit(({ email }) =>
          mutation.mutate({ action, body: { email, locale } }),
        )}
      >
        <FieldGroup>
          <p>{t(action === "register" ? "registerHint" : "forgotHint")}</p>
          <Field>
            <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email", {
                setValueAs: (value: string) => value.trim(),
              })}
            />
            {form.formState.errors.email && (
              <FieldError>{t("invalidEmail")}</FieldError>
            )}
          </Field>
          <Button disabled={mutation.isPending} type="submit">
            {t("sendLink")}
          </Button>
          {mutation.isError && (
            <AuthErrorToast
              key={mutation.submittedAt}
              message={t(
                mutation.error instanceof HttpError &&
                  mutation.error.status === 429
                  ? "limited"
                  : "unavailable",
              )}
            />
          )}
        </FieldGroup>
      </form>
      {action === "register" && <GoogleLoginButton text="signup_with" />}
    </>
  );
}
