import { createPublicMetadata } from "@/features/public-site/metadata";
import { TermsAndConditionsPage } from "@/features/public-site/pages/terms-and-conditions-page";
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
    title: t("terms.title"),
    description: t("metadata.termsDescription"),
    path: "/terms-and-conditions",
  });
}

export default function Page() {
  return <TermsAndConditionsPage />;
}
