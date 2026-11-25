import { notFound } from "next/navigation";

import { LoginScreen } from "@/features/auth/components/login-screen";
import { PageAccess } from "@/features/auth/components/page-access";
import { GoogleEmailConfirmation } from "@/features/auth/components/google-email-confirmation";
import { isAccountAction } from "@/features/auth/auth.schema";
import { AccountActionScreen } from "@/features/auth/components/account-action-screen";

export default async function AccountActionPage({
  params,
  searchParams,
}: {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { action } = await params;

  if (action === "login" || action === "register") {
    const { next } = await searchParams;

    return (
      <PageAccess
        scope="guest"
        next={typeof next === "string" ? next : undefined}
      >
        {action === "login" ? (
          <LoginScreen />
        ) : (
          <AccountActionScreen action="register" />
        )}
      </PageAccess>
    );
  }

  if (action === "verify-google") {
    return <GoogleEmailConfirmation />;
  }

  if (!isAccountAction(action)) {
    notFound();
  }

  return <AccountActionScreen key={action} action={action} />;
}
