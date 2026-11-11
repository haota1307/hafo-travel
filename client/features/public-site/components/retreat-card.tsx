import { publicSiteConfig } from "../site.config";
import { PublicButton } from "@/features/public-site/components/public-button";
import { Fragment } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicImage } from "./public-image";
import type { Retreat } from "../data/retreats";

const propertyIcons = [MapPin, CalendarDays, Users];

export function RetreatCard({ retreat }: { retreat: Retreat }) {
  const t = useTranslations("publicSite");
  const format = useFormatter();
  const mobileImage = (
    <div className="featured-item__visual mobile-visible">
      <PublicImage
        src={retreat.image}
        alt={retreat.title.join(" ")}
        className="featured-item__illustration"
      />
    </div>
  );

  return (
    <Card className="featured-item rounded-none bg-transparent py-0 ring-0">
      <CardContent className="featured-item__text px-0">
        <CardHeader className="featured-item__head px-0">
          <CardTitle
            data-animation="featured-item-head"
            className="h4"
            role="heading"
            aria-level={3}
          >
            {retreat.title.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </CardTitle>
          <div
            data-animation="featured-item-cost"
            className="featured-item__cost"
          >
            <div className="body-md color-white-60">{t("from")}</div>
            <div className="body-lg-semibold">
              {retreat.price === null
                ? t("priceOnRequest")
                : format.number(retreat.price, {
                    style: "currency",
                    currency: publicSiteConfig.currency,
                    maximumFractionDigits: 0,
                  })}
            </div>
          </div>
        </CardHeader>
        {!retreat.mobileImageInBody && mobileImage}
        <div className="featured-item__body">
          {retreat.mobileImageInBody && mobileImage}
          <div className="featured-item__properties">
            {retreat.properties.map(({ label, detail }, index) => {
              const Icon = propertyIcons[index];

              return (
                <div
                  key={index}
                  data-animation="featured-item-property"
                  className="featured-item-property"
                >
                  <div className="featured-item-property__title">
                    <div className="title-xs">
                      {label}
                      {detail && (
                        <>
                          {" "}
                          <span className="color-white-60">{detail}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {Icon ? (
                    <Icon
                      className="retreat-property-icon"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="retreat-rating" aria-hidden="true">
                      <Sparkles />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div
            data-animation="featured-item-button"
            className="featured-item__button"
          >
            <PublicButton href={`/${retreat.slug}`} variant="secondary">
              {t("exploreRetreat")}
            </PublicButton>
          </div>
        </div>
      </CardContent>
      <div className="featured-item__visual mobile-hidden">
        <PublicImage
          src={retreat.image}
          alt={retreat.title.join(" ")}
          data-animation="featured-item-illustration"
          className="featured-item__illustration"
        />
      </div>
    </Card>
  );
}
