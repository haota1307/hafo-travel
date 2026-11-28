import { Fragment } from "react";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import type { RetreatDetails } from "../data/retreat-details";
import { PublicGallery } from "./public-gallery";

export function RetreatIntro({ retreat }: { retreat: RetreatDetails }) {
  const t = useTranslations("publicSite");

  return (
    <div className="retreat-page-intro padding-global">
      <div className="container">
        <div className="retreat-page-intro__in">
          <div className="retreat-page-intro__head">
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/" />}>
                    {t("home")}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate">
                    {retreat.headline.join(" ")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="h2 mobile-no-br line-height-100">
              {retreat.headline.map((line, index) => (
                <Fragment key={line}>
                  {index > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </h1>
          </div>
          <PublicGallery images={retreat.images} />
        </div>
      </div>
    </div>
  );
}
