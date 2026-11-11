import { publicImages } from "@/features/public-site/data/image-assets";
import { SiteMark } from "@/features/public-site/components/site-mark";
import { useTranslations } from "next-intl";
import { HowWorksItem } from "@/features/public-site/components/how-works-item";
import { ExperienceCard } from "@/features/public-site/components/experience-card";
import { getExperiences } from "@/features/public-site/data/experiences";

const values = [
  {
    icon: publicImages.icons.clarity,
    title: "experiencesPage.honestyTitle",
    description: "experiencesPage.honestyDescription",
  },
  {
    icon: publicImages.icons.respect,
    title: "experiencesPage.responsibilityTitle",
    description: "experiencesPage.responsibilityDescription",
  },
  {
    icon: publicImages.icons.pace,
    title: "experiencesPage.kindnessTitle",
    description: "experiencesPage.kindnessDescription",
  },
  {
    icon: publicImages.icons.details,
    title: "experiencesPage.dedicationTitle",
    description: "experiencesPage.dedicationDescription",
  },
  {
    icon: publicImages.icons.connection,
    title: "experiencesPage.serviceTitle",
    description: "experiencesPage.serviceDescription",
  },
  {
    icon: publicImages.icons.beauty,
    title: "experiencesPage.beautyTitle",
    description: "experiencesPage.beautyDescription",
  },
  {
    icon: publicImages.icons.rest,
    title: "experiencesPage.wellbeingTitle",
    description: "experiencesPage.wellbeingDescription",
  },
  {
    icon: publicImages.icons.discovery,
    title: "experiencesPage.progressTitle",
    description: "experiencesPage.progressDescription",
  },
] as const;

export function ExperiencesPage() {
  const t = useTranslations("publicSite");
  const experiences = getExperiences(t);

  return (
    <>
      <div className="page-padding">
        <section className="experiences-section padding-global">
          <div className="container">
            <div className="head">
              <div className="row mobile-column">
                <div className="column column-3">
                  <div
                    data-anim="experiences-page-title"
                    className="head__title mobile-margin-bottom-24"
                  >
                    <SiteMark className="logo-mini" />
                    <div className="body-md">{t("experiences")}</div>
                  </div>
                </div>
                <div className="column column-9">
                  <div className="head__description">
                    <h1
                      data-anim="experiences-page-headline"
                      className="h2 mobile-font-size-36"
                    >
                      {t("experiencesPage.headline")}
                    </h1>
                    <div
                      data-anim="experiences-page-description"
                      className="body-xl mobile-no-br"
                    >
                      {t.rich("experiencesPage.description", {
                        br: () => <br />,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="experiences">
              {experiences.map((experience) => (
                <ExperienceCard key={experience.name} experience={experience} />
              ))}
            </div>
          </div>
        </section>
        <section className="how-works-section padding-global">
          <div className="container">
            <div className="head">
              <div className="row align-end mobile-column">
                <div className="column column-6">
                  <div className="head__description mobile-margin-bottom-16">
                    <h2 data-animation="how-works-headline" className="h2">
                      {t("experiencesPage.valuesTitle")}
                    </h2>
                  </div>
                </div>
                <div className="column column-6">
                  <div className="featured-section__head">
                    <div
                      data-animation="how-works-description"
                      className="body-md color-white-60 mobile-no-br"
                    >
                      {t.rich("experiencesPage.valuesDescription", {
                        br: () => <br />,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="how-works">
              {values.map((value, index) => (
                <HowWorksItem
                  key={value.title}
                  icon={value.icon}
                  number={index + 1}
                  compact
                  title={t.rich(value.title, {
                    emphasis: (chunks) => (
                      <span className="mobile-fw">{chunks}</span>
                    ),
                  })}
                  description={t.rich(value.description, { br: () => <br /> })}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
