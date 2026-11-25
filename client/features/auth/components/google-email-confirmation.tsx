import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { GoogleLoginButton } from "./google-login-button";

export async function GoogleEmailConfirmation() {
  const t = await getTranslations("auth");

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-primary">
        {t("confirmGoogle")}
      </h1>
      <GoogleLoginButton confirmEmail />
      <Link
        href="/auth/login"
        className="text-sm font-medium text-primary hover:underline"
      >
        {t("signIn")}
      </Link>
    </section>
  );
}
