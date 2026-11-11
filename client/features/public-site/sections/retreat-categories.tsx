import { publicImages } from "../data/image-assets";
import { SiteMark } from "@/features/public-site/components/site-mark";
import { useTranslations } from "next-intl";
import { PublicImage } from "@/features/public-site/components/public-image";

export function RetreatCategories() {
  const t = useTranslations("publicSite");

  return (
    <>
      <section className="statistic-section padding-global">
        <div className="container">
          <div className="head">
            <div className="row mobile-column">
              <div className="column column-3">
                <div
                  data-anim="statistic-head-title"
                  className="head__title mobile-margin-bottom-24"
                >
                  <SiteMark className="logo-mini" />
                  <div className="body-md">{t("retreats")}</div>
                </div>
              </div>
              <div className="column column-9">
                <div className="head__description">
                  <h2
                    data-anim="statistic-h2"
                    className="h2 mobile-font-size-36 mobile-no-br"
                  >
                    {t.rich("categories.headline", { br: () => <br /> })}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="statistic__wrapper">
          <div className="statistic__items">
            <div data-anim="statistic-item-1" className="statistic-item">
              <div className="statistic-item__head">
                <div
                  data-anim="statistic-item-title"
                  className="body-lg-semibold"
                >
                  {t("categories.coast")}
                </div>
                <div
                  data-anim="statistic-item-subtitle"
                  className="body-md color-white-50"
                >
                  {t("categories.coastDetail")}
                </div>
              </div>
              <div className="statistic-item__visual">
                <PublicImage
                  src={publicImages.coast}
                  loading="lazy"
                  data-anim="statistic-item-illustration"
                  alt=""
                  className="statistic-item__illustration"
                />
              </div>
              <div
                data-anim="statistic-border-right-1"
                className="statistic__border statistic__border--right"
              ></div>
            </div>
            <div data-anim="statistic-item-2" className="statistic-item">
              <div className="statistic-item__head">
                <div
                  data-anim="statistic-item-title"
                  className="body-lg-semibold"
                >
                  {t("categories.nature")}
                </div>
                <div
                  data-anim="statistic-item-subtitle"
                  className="body-md color-white-50"
                >
                  {t("categories.natureDetail")}
                </div>
              </div>
              <div className="statistic-item__visual">
                <PublicImage
                  src={publicImages.nature}
                  loading="lazy"
                  data-anim="statistic-item-illustration"
                  alt=""
                  className="statistic-item__illustration"
                />
              </div>
              <div
                data-anim="statistic-border-right-2"
                className="statistic__border statistic__border--right"
              ></div>
            </div>
            <div data-anim="statistic-item-3" className="statistic-item">
              <div className="statistic-item__head">
                <div
                  data-anim="statistic-item-title"
                  className="body-lg-semibold"
                >
                  {t("categories.slow")}
                </div>
                <div
                  data-anim="statistic-item-subtitle"
                  className="body-md color-white-50"
                >
                  {t("categories.slowDetail")}
                </div>
              </div>
              <div className="statistic-item__visual">
                <PublicImage
                  src={publicImages.slow}
                  loading="lazy"
                  data-anim="statistic-item-illustration"
                  alt=""
                  className="statistic-item__illustration"
                />
              </div>
            </div>
          </div>
          <div
            data-anim="statistic-border-top"
            className="statistic__border statistic__border--top"
          ></div>
          <div
            data-anim="statistic-border-bottom"
            className="statistic__border statistic__border--bottom"
          ></div>
        </div>
      </section>
    </>
  );
}
