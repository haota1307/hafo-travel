import { getTranslations } from "next-intl/server";
import { ExperiencesPage } from "@/features/public-site/pages/experiences-page";
import { createPublicMetadata } from "@/features/public-site/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "publicSite" });

  return createPublicMetadata({
    locale,
    title: t("experiences"),
    description: t("metadata.experiencesDescription"),
    path: "/trai-nghiem",
  });
}

export default function Page() {
  return <ExperiencesPage />;
}
