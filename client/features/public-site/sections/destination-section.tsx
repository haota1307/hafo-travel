import { useTranslations } from "next-intl";
import { PublicImage } from "../components/public-image";
import { SiteMark } from "../components/site-mark";
import { publicImages } from "../data/image-assets";

const regions = ["north", "central", "south"] as const;

export function DestinationSection() {
  const t = useTranslations("publicSite");

  return (
    <section className="destination-section">
      <div className="destination">
        <div className="container">
          <div className="head">
            <div className="row mobile-column">
              <div className="column column-3">
                <div
                  data-animation="destination-head-title"
                  className="head__title mobile-margin-bottom-24"
                >
                  <SiteMark className="logo-mini" />
                  <div className="body-md">{t("destinations.label")}</div>
                </div>
              </div>
              <div className="column column-9">
                <div className="head__description">
                  <h2
                    data-animation="destination-h2"
                    className="h2 mobile-font-size-36"
                  >
                    {t("destinations.headline")}
                  </h2>
                  <div
                    data-animation="destination-description"
                    className="body-xl mobile-lg mobile-no-br"
                  >
                    {t.rich("destinations.description", { br: () => <br /> })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="destination-mobile">
            {regions.map((region) => (
              <div
                key={region}
                data-anim="fade-up"
                className="destination-mobile-item"
              >
                <div className="destination-mobile-item__head">
                  <h3 className="body-lg">{t(`destinations.${region}`)}</h3>
                  <div className="body-sm color-white-50">
                    {t(`destinations.${region}Detail`)}
                  </div>
                </div>
                <div className="destination-mobile-item__visual">
                  <PublicImage
                    src={publicImages[region]}
                    alt=""
                    className="destination-mobile-item__illustration"
                    sizes="(max-width: 479px) 90vw, 32vw"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="destination__code">
            <svg
              className="destination__dots"
              viewBox="0 0 1312 180"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M150 78C350 150 450 10 656 78S1000 150 1162 78"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 8"
                opacity="0.35"
              />
              {[150, 656, 1162].map((cx) => (
                <g key={cx}>
                  <circle
                    cx={cx}
                    cy="78"
                    r="26"
                    fill="currentColor"
                    opacity="0.08"
                  />
                  <circle cx={cx} cy="78" r="6" fill="currentColor" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
