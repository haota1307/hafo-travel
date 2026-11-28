import type { ReactNode } from "react";
import {
  BedDouble,
  Check,
  Coffee,
  Flower2,
  HandHeart,
  Leaf,
  MapPin,
  Sparkles,
  Users,
  Utensils,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PublicImage } from "../components/public-image";
import { RetreatIntro } from "../components/retreat-intro";
import { RetreatNavigation } from "../components/retreat-navigation";
import { RetreatSummary } from "../components/retreat-summary";
import { photoAssetsBySource } from "../data/image-assets";
import type { RetreatDetails } from "../data/retreat-details";
import { FeaturedRetreats } from "../sections/featured-retreats";

const inclusionIcons: Record<string, LucideIcon> = {
  accomodation: BedDouble,
  meals: Utensils,
  tea: Coffee,
  meditation: Flower2,
  workshops: Sparkles,
  "integration-icon": Users,
  optional: Leaf,
  integration: HandHeart,
  support: HandHeart,
  wifi: Wifi,
};

function RetreatText({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="retreat-prose body-md-regular color-white-60">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function RetreatSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="retreat-page-content-item">
      <h2 className="h4">{title}</h2>
      {children}
    </section>
  );
}

export function RetreatPage({ retreat }: { retreat: RetreatDetails }) {
  const t = useTranslations("publicSite");

  return (
    <div className="page-padding">
      <RetreatIntro retreat={retreat} />
      <div className="retreat-page-content">
        <div className="container">
          <div className="retreat-page-content__in">
            <div className="retreat-page-content__description">
              <RetreatNavigation className="mobile-visible" />
              <RetreatSection id="about" title={t("aboutRetreats")}>
                <RetreatText paragraphs={retreat.about} />
              </RetreatSection>
              <RetreatSection title={t("included")}>
                <div className="retreat-columns">
                  {retreat.included.map((column, index) => (
                    <ul key={index} className="retreat-checklist">
                      {column.map(({ icon, label }) => {
                        const Icon = inclusionIcons[icon] ?? Check;

                        return (
                          <li key={label}>
                            <Icon aria-hidden="true" />
                            <span>{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ))}
                </div>
              </RetreatSection>
              <RetreatSection title={t("special")}>
                <RetreatText paragraphs={retreat.special} />
              </RetreatSection>
              <RetreatSection id="full-program" title={t("fullProgram")}>
                <div className="retreat-check-times">
                  <span>
                    {t("checkIn")} {retreat.program.checkIn}
                  </span>
                  <span>
                    {t("checkOut")} {retreat.program.checkOut}
                  </span>
                </div>
                <RetreatText paragraphs={retreat.program.description} />
              </RetreatSection>
              <RetreatSection title={t("dailySchedule")}>
                <div className="retreat-page-content-item-calendar">
                  {retreat.schedule.map((item) => (
                    <div
                      key={item.time}
                      className="retreat-page-content-item-calendar__item"
                    >
                      <div className="body-lg">{item.time}</div>
                      <div className="body-md color-white-40">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
                <RetreatText paragraphs={retreat.scheduleDescription} />
              </RetreatSection>
              <RetreatSection id="food" title={t("food")}>
                <RetreatText paragraphs={retreat.food.description} />
                <div className="retreat-columns">
                  {[
                    { label: t("mealsProvided"), items: retreat.food.meals },
                    { label: t("dietsCatered"), items: retreat.food.diets },
                  ].map(({ label, items }) => (
                    <div key={label}>
                      <h3 className="body-lg">{label}</h3>
                      <ul className="retreat-checklist">
                        {items.map((item) => (
                          <li key={item}>
                            <Check aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="retreat-page-content-item__photos">
                  {retreat.food.images.map((src) => (
                    <figure key={src} className="site-food-photo">
                      <PublicImage
                        src={src}
                        alt=""
                        className="retreat-page-content-item__photo"
                        sizes="(max-width: 479px) 42vw, 15vw"
                      />
                      <figcaption>
                        {photoAssetsBySource[src]?.location}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </RetreatSection>
              <RetreatSection id="team" title={t("team")}>
                {retreat.team.map((member) => (
                  <div key={member.name} className="retreat-page-team">
                    <div className="retreat-page-team__column padding-left-0">
                      <div className="retreat-page-team__head">
                        <h3 className="body-lg">{member.name}</h3>
                        <div className="body-sm">{member.role}</div>
                      </div>
                      <RetreatText paragraphs={member.bio} />
                    </div>
                    <div className="retreat-page-team__column">
                      <div className="retreat-page-team__visual">
                        <PublicImage
                          src={member.image}
                          alt={member.name}
                          className="retreat-page-team__photo"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </RetreatSection>
              <RetreatSection id="location" title={t("meetingPlace")}>
                <div className="retreat-address">
                  <MapPin aria-hidden="true" />
                  <address>
                    {retreat.meeting.address.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </address>
                </div>
                <RetreatText paragraphs={retreat.meeting.description} />
                <PublicImage
                  src={retreat.meeting.image}
                  alt={retreat.locationLabel}
                  className="img-fw mobile-square"
                />
              </RetreatSection>
              <RetreatSection title={t("notIncluded")}>
                <div className="retreat-columns">
                  {retreat.excluded.map((column, index) => (
                    <ul className="retreat-checklist" key={index}>
                      {column.map((item) => (
                        <li key={item}>
                          <X aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ))}
                </div>
              </RetreatSection>
            </div>
            <RetreatSummary retreat={retreat} />
          </div>
        </div>
      </div>
      <FeaturedRetreats relatedSlugs={retreat.relatedSlugs} />
    </div>
  );
}
