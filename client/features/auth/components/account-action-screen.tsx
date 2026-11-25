"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
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
import { AuthErrorToast } from "./auth-error-toast";
import { GoogleLoginButton } from "./google-login-button";
import {
  EmailActionSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  type AccountAction,
} from "../auth.schema";

const titles = {
  register: "register",
  "forgot-password": "forgot",
  "verify-email": "verify",
  "reset-password": "reset",
} as const;

export function AccountActionScreen({ action }: { action: AccountAction }) {
  const t = useTranslations("auth");

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-primary">
        {t(titles[action])}
      </h1>
      {action === "register" || action === "forgot-password" ? (
        <EmailForm action={action} />
      ) : (
        <PasswordForm action={action} />
      )}
      <Link
        href="/auth/login"
        className="inline-flex text-sm font-medium text-primary hover:underline"
      >
        {t("signIn")}
      </Link>
    </section>
  );
}

function EmailForm({ action }: { action: "register" | "forgot-password" }) {
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

function PasswordForm({
  action,
}: {
  action: "verify-email" | "reset-password";
}) {
  const t = useTranslations("auth");
  const verify = action === "verify-email";
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

  if (mutation.isSuccess) {
    return <p role="status">{t(verify ? "registered" : "passwordChanged")}</p>;
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(
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
      )}
    >
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
          {t(titles[action])}
        </Button>
        {(mutation.isError || form.formState.errors.root) && (
          <div>
            {mutation.isError && (
              <AuthErrorToast
                key={mutation.submittedAt}
                message={t(
                  mutation.error instanceof HttpError &&
                    mutation.error.status === 400
                    ? "badLink"
                    : mutation.error instanceof HttpError &&
                        mutation.error.status === 429
                      ? "limited"
                      : "unavailable",
                )}
              />
            )}
            <Link
              className="text-primary underline"
              href={verify ? "/auth/register" : "/auth/forgot-password"}
            >
              {t("requestAgain")}
            </Link>
          </div>
        )}
      </FieldGroup>
    </form>
  );
}
