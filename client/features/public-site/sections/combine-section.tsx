import { PublicImage } from "../components/public-image";
import { publicImages } from "../data/image-assets";
import { useTranslations } from "next-intl";
export function CombineSection() {
  const t = useTranslations("publicSite");

  return (
    <>
      <section className="combine-section">
        <div className="combine hafo-inverse">
          <PublicImage
            src={publicImages.combine}
            alt=""
            decorative
            sizes="100vw"
            className="hafo-combine-photo"
          />
          <div className="container">
            <div className="head margin-bottom-40 mobile-margin-bottom-24">
              <div className="row align-end">
                <div className="column column-12">
                  <div className="head__description">
                    <h2
                      data-animation="combine-headline"
                      className="h2 mobile-h3"
                    >
                      {t("combine.headline")}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="combine__items">
              <div className="combine__item">
                <div
                  data-animation="combine-title-item-1"
                  className="h3 mobile-h4"
                >
                  {t.rich("combine.stay", {
                    emphasis: (chunks) => (
                      <span className="color-white-40">{chunks}</span>
                    ),
                  })}
                </div>
              </div>
              <div className="combine__item">
                <div
                  data-animation="combine-title-item-2"
                  className="h3 mobile-h4"
                >
                  {t.rich("combine.transfers", {
                    emphasis: (chunks) => (
                      <span className="color-white-40">{chunks}</span>
                    ),
                  })}
                </div>
              </div>
              <div className="combine__item">
                <div
                  data-animation="combine-title-item-3"
                  className="h3 mobile-h4"
                >
                  {t.rich("combine.extras", {
                    emphasis: (chunks) => (
                      <span className="color-white-40">{chunks}</span>
                    ),
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="combine__steps">
            <div className="combine-step sizel-l">
              <div data-animation="combine-description" className="body-xl">
                {t.rich("combine.description", { br: () => <br /> })}
              </div>
            </div>
            <div data-animation="combine-step-1" className="combine-step">
              <div className="combine-step__head">
                <div className="h3 mobile-font-size-36">{"01"}</div>
                <div className="combine-step__subtitle">
                  <div className="title-xs color-white-50">
                    {t("combine.step")}
                  </div>
                </div>
              </div>
              <div className="combine-step__body">
                <div className="body-lg mobile-body-md">
                  {t.rich("combine.choose", { br: () => <br /> })}
                </div>
              </div>
              <div className="combine-step__dec combine-step__dec--1"></div>
              <div className="combine-step__dec combine-step__dec--5"></div>
            </div>
            <div data-animation="combine-step-2" className="combine-step">
              <div className="combine-step__head">
                <div className="h3 mobile-font-size-36">{"02"}</div>
                <div className="combine-step__subtitle">
                  <div className="title-xs color-white-50">
                    {t("combine.step")}
                  </div>
                </div>
              </div>
              <div className="combine-step__body">
                <div className="body-lg mobile-body-md">
                  {t.rich("combine.match", { br: () => <br /> })}
                </div>
              </div>
              <div className="combine-step__dec combine-step__dec--2"></div>
            </div>
            <div data-animation="combine-step-3" className="combine-step">
              <div className="combine-step__head">
                <div className="h3 mobile-font-size-36">{"03"}</div>
                <div className="combine-step__subtitle">
                  <div className="title-xs color-white-50">
                    {t("combine.step")}
                  </div>
                </div>
              </div>
              <div className="combine-step__body">
                <div className="body-lg mobile-body-md">
                  {t.rich("combine.add", { br: () => <br /> })}
                </div>
              </div>
              <div className="combine-step__dec combine-step__dec--3"></div>
              <div className="combine-step__dec combine-step__dec--6"></div>
            </div>
            <div data-animation="combine-step-4" className="combine-step">
              <div className="combine-step__head">
                <div className="h3 mobile-font-size-36">{"04"}</div>
                <div className="combine-step__subtitle">
                  <div className="title-xs color-white-50">
                    {t("combine.step")}
                  </div>
                </div>
              </div>
              <div className="combine-step__body">
                <div className="body-lg mobile-body-md">
                  {t.rich("combine.pay", { br: () => <br /> })}
                </div>
              </div>
              <div className="combine-step__dec combine-step__dec--4"></div>
            </div>
            <div className="combine__dec combine__dec--1"></div>
            <div className="combine__dec combine__dec--2"></div>
          </div>
        </div>
      </section>
    </>
  );
}
