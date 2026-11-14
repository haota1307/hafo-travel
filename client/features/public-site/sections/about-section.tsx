import { publicImages } from "../data/image-assets";
import { publicSiteConfig } from "../site.config";
import { getRetreats } from "../data/retreats";
import { SiteMark } from "@/features/public-site/components/site-mark";
import { useTranslations } from "next-intl";
import { PublicImage } from "@/features/public-site/components/public-image";

export function AboutSection() {
  const t = useTranslations("publicSite");

  return (
    <>
      <section className="about-section padding-global">
        <div className="container">
          <div className="head">
            <div className="row mobile-column">
              <div className="column column-3">
                <div
                  data-anim="about-section-head"
                  className="head__title mobile-margin-bottom-24"
                >
                  <SiteMark className="logo-mini" />
                  <div className="body-md">{t("about.label")}</div>
                </div>
              </div>
              <div className="column column-9">
                <div className="head__description">
                  <h2
                    data-anim="about-head-description"
                    className="h2 mobile-font-size-36 mobile-no-br"
                  >
                    {t.rich("about.headline", { br: () => <br /> })}
                  </h2>
                </div>
              </div>
            </div>
          </div>
          <div className="about">
            <div className="about__visual">
              <PublicImage
                src={publicImages.about}
                loading="lazy"
                data-animation="about-illustration"
                alt=""
                className="about__illustration"
              />
            </div>
            <div className="about__content">
              <div className="about__head">
                <div
                  data-animation="about-head"
                  className="body-xl mobile-font-size-22 mobile-no-br"
                >
                  {t.rich("about.description", { br: () => <br /> })}
                </div>
              </div>
              <div className="about__items">
                <div className="about-item">
                  <div className="about-item__head">
                    <div data-animation="about-item-head-1" className="h3">
                      {String(publicSiteConfig.regions).padStart(2, "0")}
                    </div>
                    <div
                      data-animation="about-item-description-1"
                      className="body-l"
                    >
                      {t.rich("about.countries", { br: () => <br /> })}
                    </div>
                  </div>
                  <div className="about-item__footer">
                    <div
                      data-animation="about-item-footer"
                      className="body-md color-white-60"
                    >
                      {t("about.trust")}
                    </div>
                  </div>
                </div>
                <div className="about-item">
                  <div className="about-item__head">
                    <div data-animation="about-item-head-2" className="h3">
                      {String(getRetreats(t).length).padStart(2, "0")}
                    </div>
                    <div
                      data-animation="about-item-description-2"
                      className="body-l"
                    >
                      {t.rich("about.retreats", { br: () => <br /> })}
                    </div>
                  </div>
                  <div className="about-item__footer">
                    <div
                      data-animation="about-item-footer-logos"
                      className="about-item__logos"
                    >
                      <span className="site-brand-value">
                        {t("about.nature")}
                      </span>
                      <span className="site-brand-value">
                        {t("about.culture")}
                      </span>
                      <span className="site-brand-value">
                        {t("about.rest")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
