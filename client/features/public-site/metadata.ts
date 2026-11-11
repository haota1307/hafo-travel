import type { Metadata } from "next";
import { publicSiteConfig } from "./site.config";

type PublicMetadataOptions = {
  locale: string;
  title: string;
  description: string;
  path?: string;
};

export function createPublicMetadata({
  locale,
  title,
  description,
  path = "",
}: PublicMetadataOptions): Metadata {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  const socialTitle =
    title === publicSiteConfig.title
      ? title
      : `${title} | ${publicSiteConfig.title}`;

  return {
    metadataBase: new URL(origin || "http://localhost:3000"),
    title,
    description,
    ...(origin
      ? {
          alternates: {
            canonical: `/${locale}${path}`,
            languages: { vi: `/vi${path}`, en: `/en${path}` },
          },
        }
      : {}),
    openGraph: {
      title: socialTitle,
      description,
      siteName: publicSiteConfig.name,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}
