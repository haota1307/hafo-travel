import { notFound } from "next/navigation";

import { AccountScreen } from "@/features/auth/components/account-screen";
import { GoogleEmailConfirmation } from "@/features/auth/components/google-email-confirmation";
import { isAccountAction } from "@/features/auth/auth.schema";
import { AccountActionScreen } from "@/features/auth/components/account-action-screen";

export default async function AccountActionPage({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const { action } = await params;

  if (action === "login") {
    return <AccountScreen />;
  }

  if (action === "verify-google") {
    return <GoogleEmailConfirmation />;
  }

  if (!isAccountAction(action)) {
    notFound();
  }

  return <AccountActionScreen key={action} action={action} />;
}
