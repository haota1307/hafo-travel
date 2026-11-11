import { createPublicMetadata } from "@/features/public-site/metadata";
import { ContactsPage } from "@/features/public-site/pages/contacts-page";
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
    title: t("contacts"),
    description: t("metadata.contactsDescription"),
    path: "/contacts",
  });
}

export default function Page() {
  return <ContactsPage />;
}
