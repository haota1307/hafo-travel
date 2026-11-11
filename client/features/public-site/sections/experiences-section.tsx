import { publicImages } from "@/features/public-site/data/image-assets";
import { SiteMark } from "@/features/public-site/components/site-mark";
import { useTranslations } from "next-intl";
import { PublicImage } from "@/features/public-site/components/public-image";
import { ExperienceCard } from "@/features/public-site/components/experience-card";
import { getExperiences } from "@/features/public-site/data/experiences";

export function ExperiencesSection() {
  const t = useTranslations("publicSite");
  const experiences = getExperiences(t);

  return (
    <section className="practitioners-section padding-global">
      <div className="practitioners">
        <div className="practitioners__list">
          {[0, 3, 7, 11].map((index) => (
            <ExperienceCard
              key={experiences[index].name}
              experience={experiences[index]}
            />
          ))}
        </div>
        <div className="practitioners__text">
          <div className="practitioners__row">
            <div className="head head--column">
              <div data-animation="practitioners-title" className="head__title">
                <SiteMark className="logo-mini" />
                <div className="body-md">{t("practitioners.label")}</div>
              </div>
              <div className="head__description">
                <h2
                  data-animation="practitioners-headline"
                  className="h2 mobile-font-size-36"
                >
                  {t.rich("practitioners.headline", { br: () => <br /> })}
                </h2>
              </div>
            </div>
          </div>
          <div className="practitioners__row padding-top-0">
            <div className="practitioners__items">
              <div className="practitioners-item">
                <PublicImage
                  src={publicImages.icons.plus}
                  loading="lazy"
                  data-animation="practitioners-plus-1"
                  alt=""
                  className="practitioners-item__icon"
                />
                <div className="practitioners-item__content">
                  <div
                    data-animation="practitioners-item-title-1"
                    className="body-lg"
                  >
                    {t("practitioners.expertsTitle")}
                  </div>
                  <div
                    data-animation="practitioners-item-description-1"
                    className="body-md color-white-60"
                  >
                    {t.rich("practitioners.expertsDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="practitioners-item">
                <PublicImage
                  src={publicImages.icons.plus}
                  loading="lazy"
                  data-animation="practitioners-plus-2"
                  alt=""
                  className="practitioners-item__icon"
                />
                <div className="practitioners-item__content">
                  <div
                    data-animation="practitioners-item-description-2"
                    className="body-xl mobile-font-size-22"
                  >
                    {t.rich("practitioners.network", { br: () => <br /> })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
