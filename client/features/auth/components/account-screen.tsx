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
import { Link } from "@/i18n/navigation";
import { HttpError } from "@/lib/http";
import { useGetSession, useLogin, useLogout } from "../auth.queries";
import { LoginSchema, type LoginInput } from "../auth.schema";
import { GoogleLoginButton } from "./google-login-button";

export function AccountScreen() {
  const t = useTranslations("auth");
  const session = useGetSession();
  const login = useLogin();
  const logout = useLogout();
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const user = session.data?.user;
  const error = login.error ?? logout.error;
  const loginError =
    login.error instanceof HttpError && [400, 401].includes(login.error.status);
  const limited = error instanceof HttpError && error.status === 429;

  return (
    <section aria-labelledby="account-title" className="space-y-8">
      <h1
        id="account-title"
        className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl"
      >
        {user ? t("account") : t("signIn")}
      </h1>
      {session.isPending ? (
        <p role="status" className="text-muted-foreground">
          {t("loading")}
        </p>
      ) : session.isError ? (
        <div className="space-y-3">
          <p role="alert">{t("unavailable")}</p>
          <Button onClick={() => session.refetch()}>{t("retry")}</Button>
        </div>
      ) : user ? (
        <section className="space-y-4">
          <div>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p>{user.email}</p>
          </div>
          <Button
            className="w-full text-base"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            {t("signOut")}
          </Button>
        </section>
      ) : (
        <div className="space-y-5">
          <form
            noValidate
            onSubmit={form.handleSubmit((body) =>
              login.mutate(body, { onSuccess: () => form.reset() }),
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
                    form.formState.errors.password
                      ? "password-error"
                      : undefined
                  }
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <FieldError id="password-error">
                    {t("invalidPassword")}
                  </FieldError>
                )}
              </Field>
              <Button
                className="mt-1 w-full text-base"
                type="submit"
                disabled={login.isPending}
              >
                {t("signIn")}
              </Button>
            </FieldGroup>
          </form>
          <div className="flex flex-wrap justify-between gap-3 text-sm font-medium text-primary">
            <Link href="/auth/register" className="hover:underline">
              {t("register")}
            </Link>
            <Link href="/auth/forgot-password" className="hover:underline">
              {t("forgot")}
            </Link>
          </div>
          <GoogleLoginButton />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(
            limited
              ? "limited"
              : loginError
                ? "invalidCredentials"
                : "unavailable",
          )}
        </p>
      )}
    </section>
  );
}
