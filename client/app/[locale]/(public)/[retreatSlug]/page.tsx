import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  getRetreatPage,
  retreatPages,
} from "@/features/public-site/pages/retreat-pages";
import { RetreatPage } from "@/features/public-site/pages/retreat-page";
import { createPublicMetadata } from "@/features/public-site/metadata";

type PageProps = { params: Promise<{ locale: string; retreatSlug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Object.keys(retreatPages).map((retreatSlug) => ({ locale, retreatSlug })),
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, retreatSlug } = await params;
  const t = await getTranslations({ locale, namespace: "publicSite" });
  const retreat = getRetreatPage(retreatSlug, t);

  if (!retreat) {
    notFound();
  }

  return createPublicMetadata({
    locale,
    title: retreat.title,
    description: retreat.description,
    path: `/${retreat.slug}`,
  });
}

export default async function Page({ params }: PageProps) {
  const { locale, retreatSlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "publicSite" });
  const retreat = getRetreatPage(retreatSlug, t);

  if (!retreat) {
    notFound();
  }

  return <RetreatPage retreat={retreat} />;
}
