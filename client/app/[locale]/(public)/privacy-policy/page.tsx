import { createPublicMetadata } from "@/features/public-site/metadata";
import { PrivacyPolicyPage } from "@/features/public-site/pages/privacy-policy-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "publicSite" });

  return createPublicMetadata({
    locale,
    title: t("privacy.title"),
    description: t("metadata.privacyDescription"),
    path: "/privacy-policy",
  });
}

export default function Page() {
  return <PrivacyPolicyPage />;
}
