import { CalendarDays, MapPin, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RetreatDetails } from "../data/retreat-details";
import { publicSiteConfig } from "../site.config";
import { PublicButton } from "./public-button";
import { RetreatNavigation } from "./retreat-navigation";

export function RetreatSummary({ retreat }: { retreat: RetreatDetails }) {
  const t = useTranslations("publicSite");
  const format = useFormatter();
  const details = [
    { icon: MapPin, value: retreat.locationLabel },
    { icon: CalendarDays, value: retreat.dates },
    { icon: Users, value: retreat.guests },
  ];

  return (
    <aside className="retreat-page-content__sidebar">
      <Card className="retreat-page-info gap-6 p-6">
        <CardHeader className="p-0">
          <CardTitle className="retreat-price">
            <span>{t("from")}</span>
            <strong>
              {retreat.price === null
                ? t("priceOnRequest")
                : format.number(retreat.price, {
                    style: "currency",
                    currency: publicSiteConfig.currency,
                    maximumFractionDigits: 0,
                  })}
            </strong>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="retreat-summary-details">
            {details.map(({ icon: Icon, value }) => (
              <li key={value}>
                <Icon aria-hidden="true" />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <Separator />
        <RetreatNavigation className="mobile-hidden" />
        <PublicButton href="/contacts">{t("getInTouch")}</PublicButton>
      </Card>
    </aside>
  );
}
