"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

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
import { useLogin } from "../auth.queries";
import {
  EmailActionSchema,
  LoginSchema,
  type LoginInput,
} from "../auth.schema";
import { AuthErrorToast } from "./auth-error-toast";
import { GoogleLoginButton } from "./google-login-button";

const loginFormSchema = LoginSchema.extend({
  email: EmailActionSchema.shape.email,
});

export function LoginScreen() {
  const t = useTranslations("auth");
  const login = useLogin();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const error = login.error;
  const loginError =
    login.error instanceof HttpError && [400, 401].includes(login.error.status);
  const limited = error instanceof HttpError && error.status === 429;

  return (
    <section aria-labelledby="account-title" className="space-y-8">
      <h1
        id="account-title"
        className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl"
      >
        {t("signIn")}
      </h1>
      <div className="space-y-5">
        <form
          noValidate
          onSubmit={form.handleSubmit(
            (body) => login.mutate(body),
            (errors) => {
              if (errors.password?.type === "too_big") {
                toast.add({ type: "error", title: t("invalidPassword") });
              }
            },
          )}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
              <Input
                id="email"
                className="px-4 text-base"
                type="email"
                autoComplete="username"
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={
                  form.formState.errors.email ? "email-error" : undefined
                }
                {...form.register("email", {
                  setValueAs: (value: string) => value.trim(),
                })}
              />
              {form.formState.errors.email && (
                <FieldError id="email-error">{t("invalidEmail")}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
              <Input
                id="password"
                className="px-4 text-base"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!form.formState.errors.password}
                aria-describedby={
                  form.formState.errors.password?.type === "too_small"
                    ? "password-error"
                    : undefined
                }
                {...form.register("password")}
              />
              {form.formState.errors.password?.type === "too_small" && (
                <FieldError id="password-error">
                  {t("passwordRequired")}
                </FieldError>
              )}
            </Field>
            <Button
              className="mt-1 h-10 w-full rounded-full text-base"
              type="submit"
              disabled={login.isPending}
            >
              {t("signIn")}
            </Button>
          </FieldGroup>
        </form>
        <GoogleLoginButton />
        <div className="flex flex-wrap justify-between gap-3 text-sm font-medium text-primary">
          <Link href="/auth/register" className="hover:underline">
            {t("register")}
          </Link>
          <Link href="/auth/forgot-password" className="hover:underline">
            {t("forgot")}
          </Link>
        </div>
      </div>
      {error && (
        <AuthErrorToast
          key={login.submittedAt}
          message={t(
            limited
              ? "limited"
              : loginError
                ? "invalidCredentials"
                : "unavailable",
          )}
        />
      )}
    </section>
  );
}
