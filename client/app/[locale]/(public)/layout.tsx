import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicExperience } from "@/features/public-site/components/public-experience";
import { SiteHeader } from "@/features/public-site/components/site-header";
import { SiteFooter } from "@/features/public-site/components/site-footer";
import { CookieNotice } from "@/features/public-site/components/cookie-notice";
import { publicSiteConfig } from "@/features/public-site/site.config";
import { createPublicMetadata } from "@/features/public-site/metadata";
import "@/features/public-site/styles/public-site.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "publicSite" });

  return {
    ...createPublicMetadata({
      locale,
      title: publicSiteConfig.title,
      description: t(publicSiteConfig.descriptionKey),
    }),
    title: {
      default: publicSiteConfig.title,
      template: `%s | ${publicSiteConfig.title}`,
    },
    description: t(publicSiteConfig.descriptionKey),
    icons: {
      icon: [
        { url: publicSiteConfig.brand.favicon, type: "image/svg+xml" },
        { url: "/hafo/brand/favicon.ico" },
      ],
      apple: publicSiteConfig.brand.appleIcon,
    },
  };
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("publicSite");

  return (
    <PublicExperience>
      <a href="#public-main" className="skip-link">
        {t("skipToContent")}
      </a>
      <SiteHeader />
      <div className="page-wrapper">
        <main id="public-main" className="main-wrapper" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </div>
      <CookieNotice />
    </PublicExperience>
  );
}
