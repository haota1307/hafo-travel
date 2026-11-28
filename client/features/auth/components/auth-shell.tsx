import { ArrowLeft, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { ReactNode } from "react";
import { PublicImage } from "@/features/public-site/components/public-image";
import { publicImages } from "@/features/public-site/data/image-assets";
import { publicSiteConfig } from "@/features/public-site/site.config";
import { Link } from "@/i18n/navigation";

export async function AuthShell({ children }: { children: ReactNode }) {
  const [auth, destination] = await Promise.all([
    getTranslations("auth"),
    getTranslations("publicSite.experienceProfiles.ninhBinh"),
  ]);

  return (
    <main className="account-screen min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh max-w-[110rem] content-start gap-y-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_1fr] lg:content-stretch lg:gap-x-8 lg:p-6">
        <header className="flex items-center justify-between gap-4 lg:px-6 lg:pt-4">
          <Image
            src={publicSiteConfig.brand.logo}
            alt={publicSiteConfig.name}
            width={150}
            height={32}
            className="h-7 w-auto sm:h-8"
          />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {auth("home")}
          </Link>
        </header>
        <figure className="relative isolate h-36 overflow-hidden rounded-2xl bg-secondary sm:h-48 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto">
          <PublicImage
            src={publicImages.north}
            alt=""
            sizes="(min-width: 1760px) 900px, (min-width: 1024px) 55vw, 100vw"
            loading="eager"
            className="absolute inset-0 size-full object-cover"
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-t from-black/65 to-transparent px-5 pt-10 pb-4 text-sm font-medium text-white lg:px-8 lg:pt-16 lg:pb-7">
            <MapPin aria-hidden="true" className="size-4" />
            {destination("location")}
          </figcaption>
        </figure>
        <div className="mx-auto w-full min-w-0 max-w-sm py-3 sm:py-8 lg:col-start-1 lg:row-start-2 lg:self-center lg:pb-20">
          {children}
        </div>
      </div>
    </main>
  );
}
