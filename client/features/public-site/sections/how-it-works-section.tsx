import { publicImages } from "@/features/public-site/data/image-assets";
import { useTranslations } from "next-intl";
import { PublicImage } from "@/features/public-site/components/public-image";

export function HowItWorksSection() {
  const t = useTranslations("publicSite");

  return (
    <>
      <section className="how-works-section padding-global">
        <div className="container">
          <div className="head">
            <div className="row align-end mobile-column">
              <div className="column column-6">
                <div className="head__description mobile-margin-bottom-16">
                  <h2
                    data-animation="how-works-headline"
                    className="h2 mobile-h3"
                  >
                    {t("howItWorks.headline")}
                  </h2>
                </div>
              </div>
              <div className="column column-6">
                <div className="featured-section__head">
                  <div
                    data-animation="how-works-description"
                    className="body-md color-white-60"
                  >
                    {t.rich("howItWorks.description", { br: () => <br /> })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="how-works">
            <div data-animation="how-works-item-1" className="how-works-item">
              <div
                data-animation="how-works-item-head-1"
                className="how-works-item__head"
              >
                <PublicImage
                  src={publicImages.icons.inspiration}
                  loading="lazy"
                  alt=""
                  className="how-works-item__icon"
                />
                <div className="how-works-item__count">{"01"}</div>
              </div>
              <div className="how-works-item__body">
                <div
                  data-animation="how-works-item-title-1"
                  className="body-md"
                >
                  {t.rich("howItWorks.goalsTitle", {
                    emphasis: (chunks) => (
                      <span className="mobile-fw">{chunks}</span>
                    ),
                  })}
                </div>
                <div
                  data-animation="how-works-item-description-1"
                  className="body-md color-white-50 mobile-no-br"
                >
                  {t.rich("howItWorks.goalsDescription", { br: () => <br /> })}
                </div>
              </div>
            </div>
            <div data-animation="how-works-item-2" className="how-works-item">
              <div
                data-animation="how-works-item-head-2"
                className="how-works-item__head"
              >
                <PublicImage
                  src={publicImages.icons.destination}
                  loading="lazy"
                  alt=""
                  className="how-works-item__icon"
                />
                <div className="how-works-item__count">{"02"}</div>
              </div>
              <div className="how-works-item__body">
                <div
                  data-animation="how-works-item-title-2"
                  className="body-md"
                >
                  {t.rich("howItWorks.matchesTitle", {
                    emphasis: (chunks) => (
                      <span className="mobile-fw">{chunks}</span>
                    ),
                  })}
                </div>
                <div
                  data-animation="how-works-item-description-2"
                  className="body-md color-white-50 mobile-no-br"
                >
                  {t.rich("howItWorks.matchesDescription", {
                    br: () => <br />,
                  })}
                </div>
              </div>
            </div>
            <div data-animation="how-works-item-3" className="how-works-item">
              <div
                data-animation="how-works-item-head-3"
                className="how-works-item__head"
              >
                <PublicImage
                  src={publicImages.icons.conversation}
                  loading="lazy"
                  alt=""
                  className="how-works-item__icon"
                />
                <div className="how-works-item__count">{"03"}</div>
              </div>
              <div className="how-works-item__body">
                <div
                  data-animation="how-works-item-title-3"
                  className="body-md"
                >
                  {t.rich("howItWorks.packageTitle", {
                    emphasis: (chunks) => (
                      <span className="mobile-fw">{chunks}</span>
                    ),
                  })}
                </div>
                <div
                  data-animation="how-works-item-description-3"
                  className="body-md color-white-50 mobile-no-br"
                >
                  {t.rich("howItWorks.packageDescription", {
                    br: () => <br />,
                  })}
                </div>
              </div>
            </div>
            <div data-animation="how-works-item-4" className="how-works-item">
              <div
                data-animation="how-works-item-head-4"
                className="how-works-item__head"
              >
                <PublicImage
                  src={publicImages.icons.journey}
                  loading="lazy"
                  alt=""
                  className="how-works-item__icon"
                />
                <div className="how-works-item__count">{"04"}</div>
              </div>
              <div className="how-works-item__body">
                <div
                  data-animation="how-works-item-title-4"
                  className="body-md"
                >
                  {t.rich("howItWorks.progressTitle", {
                    emphasis: (chunks) => (
                      <span className="mobile-fw">{chunks}</span>
                    ),
                  })}
                </div>
                <div
                  data-animation="how-works-item-description-4"
                  className="body-md color-white-50 mobile-no-br"
                >
                  {t.rich("howItWorks.progressDescription", {
                    br: () => <br />,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
