import { useTranslations } from "next-intl";
import { PublicButton } from "../components/public-button";
import { PublicImage } from "../components/public-image";
import { publicImages } from "../data/image-assets";

export function HomeHero() {
  const t = useTranslations("publicSite");

  return (
    <section className="intro">
      <PublicImage
        src={publicImages.hero}
        alt=""
        decorative
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="intro-bg-part intro-bg-part--1"
      />
      <div className="intro-bg-dark" />
      <div className="container">
        <div className="intro__in">
          <div className="intro__text">
            <p data-anim="fade-up" className="site-eyebrow">
              {t("hero.eyebrow")}
            </p>
            <h1
              data-anim="fade-up-big"
              className="h1 mobile-margin-bottom-16 intro__headline"
            >
              {t("hero.headline")}
            </h1>
            <div className="margin-bottom-32 z-index-3">
              <div
                data-anim-delay="0.1"
                data-anim="fade-up"
                className="body-xxl"
              >
                {t.rich("hero.description", { br: () => <br /> })}
              </div>
            </div>
            <div
              data-anim-delay="0.2"
              data-anim="fade-up"
              className="intro__button mobile-hidden z-index-3"
            >
              <PublicButton href="/#retreats" className="public-button-mobile">
                {t("exploreRetreats")}
              </PublicButton>
            </div>
          </div>
        </div>
      </div>
      <PublicImage
        src={publicImages.hero}
        alt=""
        decorative
        sizes="100vw"
        className="intro-bg-part intro-bg-part--2"
      />
      <div className="intro__button mobile-visible z-index-3">
        <PublicButton href="/#retreats" className="public-button-mobile">
          {t("exploreRetreats")}
        </PublicButton>
      </div>
    </section>
  );
}
