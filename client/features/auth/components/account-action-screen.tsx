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
import { Link } from "@/i18n/navigation";
import { HttpError } from "@/lib/http";
import { useAccountAction } from "../auth.queries";
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
          <p role="alert">
            {t(
              mutation.error instanceof HttpError &&
                mutation.error.status === 429
                ? "limited"
                : "unavailable",
            )}
          </p>
        )}
      </FieldGroup>
    </form>
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
      password: ResetPasswordSchema.shape.password,
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
      onSubmit={form.handleSubmit(({ firstName, lastName, password }) => {
        const token = window.location.hash.slice(1);

        if (!token || token.length > 4096) {
          form.setError("root", { type: "token" });

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
      })}
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
              {form.formState.errors[name] && (
                <FieldError>{t("nameRule")}</FieldError>
              )}
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
          {form.formState.errors.password && (
            <FieldError>{t("passwordRule")}</FieldError>
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
              form.formState.errors.confirmPassword
                ? "confirm-password-error"
                : undefined
            }
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <FieldError id="confirm-password-error">
              {t(
                form.formState.errors.confirmPassword.type === "too_small"
                  ? "confirmPasswordRequired"
                  : "passwordMismatch",
              )}
            </FieldError>
          )}
        </Field>
        <Button disabled={mutation.isPending} type="submit">
          {t(titles[action])}
        </Button>
        {(mutation.isError || form.formState.errors.root) && (
          <div role="alert">
            <p>
              {t(
                form.formState.errors.root ||
                  (mutation.error instanceof HttpError &&
                    mutation.error.status === 400)
                  ? "badLink"
                  : mutation.error instanceof HttpError &&
                      mutation.error.status === 429
                    ? "limited"
                    : "unavailable",
              )}
            </p>
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
