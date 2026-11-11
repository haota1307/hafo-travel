import { publicImages } from "@/features/public-site/data/image-assets";
import { SiteMark } from "@/features/public-site/components/site-mark";
import { useTranslations } from "next-intl";
import { PublicImage } from "@/features/public-site/components/public-image";
import { ExperienceCard } from "@/features/public-site/components/experience-card";
import { getExperiences } from "@/features/public-site/data/experiences";

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
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.clarity}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"01"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t("experiencesPage.honestyTitle")}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.honestyDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.respect}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"02"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t("experiencesPage.responsibilityTitle")}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.responsibilityDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.pace}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"03"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t("experiencesPage.kindnessTitle")}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.kindnessDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.details}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"04"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t("experiencesPage.dedicationTitle")}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.dedicationDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.connection}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"05"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t("experiencesPage.serviceTitle")}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.serviceDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.beauty}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"06"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t("experiencesPage.beautyTitle")}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.beautyDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.rest}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"07"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t.rich("experiencesPage.wellbeingTitle", {
                      emphasis: (chunks) => (
                        <span className="mobile-fw">{chunks}</span>
                      ),
                    })}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.wellbeingDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
              <div className="how-works-item size-s">
                <div className="how-works-item__head">
                  <PublicImage
                    src={publicImages.icons.discovery}
                    loading="lazy"
                    alt=""
                    className="how-works-item__icon"
                  />
                  <div className="how-works-item__count">{"08"}</div>
                </div>
                <div className="how-works-item__body">
                  <div className="body-md">
                    {t("experiencesPage.progressTitle")}
                  </div>
                  <div className="body-md color-white-50 mobile-no-br mobile-body-sm">
                    {t.rich("experiencesPage.progressDescription", {
                      br: () => <br />,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
