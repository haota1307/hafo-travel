"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AccountAction } from "../auth.schema";
import { AccountEmailForm } from "./account-email-form";
import { AccountPasswordForm } from "./account-password-form";

const titles = {
  register: "register",
  "forgot-password": "forgot",
  "verify-email": "verify",
  "reset-password": "reset",
  "accept-invitation": "acceptInvitation",
} as const;

export function AccountActionScreen({ action }: { action: AccountAction }) {
  const t = useTranslations("auth");
  const title = t(titles[action]);

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-primary">
        {title}
      </h1>
      {action === "register" || action === "forgot-password" ? (
        <AccountEmailForm action={action} />
      ) : (
        <AccountPasswordForm action={action} submitLabel={title} />
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
