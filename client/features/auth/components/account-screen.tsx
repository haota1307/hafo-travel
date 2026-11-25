"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, getPathname } from "@/i18n/navigation";
import { useGetSession, useLogout } from "../auth.queries";
import { signedInPath } from "../route-access";
import { AuthErrorToast } from "./auth-error-toast";

export function AccountScreen() {
  const t = useTranslations("auth");
  const dashboard = useTranslations("dashboard");
  const locale = useLocale();
  const session = useGetSession();
  const logout = useLogout();

  if (session.isPending) {
    return <p role="status">{t("loading")}</p>;
  }
  if (session.isError) {
    return (
      <div className="space-y-3">
        <AuthErrorToast
          key={session.errorUpdatedAt}
          message={t("unavailable")}
        />
        <Button onClick={() => session.refetch()}>{t("retry")}</Button>
      </div>
    );
  }
  if (!session.data) {
    return <Link href="/auth/login">{t("signIn")}</Link>;
  }

  const { user, permissions } = session.data;
  const workspaceHref = signedInPath(permissions, locale);

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-primary">
        {t("account")}
      </h1>
      <div>
        <p className="font-medium">
          {user.firstName} {user.lastName}
        </p>
        <p>{user.email}</p>
      </div>
      {workspaceHref !== "/" && (
        <Link
          className="block text-primary hover:underline"
          href={workspaceHref}
        >
          {dashboard("workspace")}
        </Link>
      )}
      <Button
        className="w-full"
        disabled={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            onSuccess: () =>
              window.location.replace(getPathname({ locale, href: "/" })),
          })
        }
      >
        {t("signOut")}
      </Button>
      {logout.isError && (
        <AuthErrorToast key={logout.submittedAt} message={t("unavailable")} />
      )}
    </section>
  );
}
