import { useTranslations } from "next-intl";
import { publicSiteConfig } from "../site.config";

type LegalSection = { title: string; paragraphs: string[] };

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const t = useTranslations("publicSite");
  const sections = t.raw(`${kind}.sections`) as LegalSection[];

  return (
    <div className="page-padding">
      <div className="legal-intro padding-global">
        <div className="container">
          <div className="legal-intro__in">
            <h1 data-anim="fade-up" className="h2">
              {t(`${kind}.title`)}
            </h1>
            <p
              data-anim="fade-up"
              data-anim-delay="0.1"
              className="body-xl color-white-60"
            >
              {t("legal.updated")}
            </p>
            <p
              data-anim="fade-up"
              data-anim-delay="0.2"
              className="body-md-regular color-white-60"
            >
              {t(`${kind}.intro`)}
            </p>
          </div>
        </div>
      </div>
      <div className="legal-content">
        <div className="container">
          <div className="legal-content__in">
            <div className="legal-content__text">
              {sections.map((section, index) => (
                <section key={section.title} className="legal-content__section">
                  <h2 id={`legal-${index}`} className="h4">
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="body-md-regular color-white-60"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
              <div className="legal-content__section">
                <h2 className="h4">{t("legal.contact")}</h2>
                <a className="link" href={`mailto:${publicSiteConfig.email}`}>
                  {publicSiteConfig.email}
                </a>
                <a className="link" href={`tel:${publicSiteConfig.phone}`}>
                  {publicSiteConfig.phone}
                </a>
              </div>
            </div>
            <aside className="legal-content__sidebar">
              <nav className="legal-nav" aria-label={t("legal.contents")}>
                <div className="body-lg">{t("legal.contents")}</div>
                <div className="legal-nav__items">
                  {sections.map((section, index) => (
                    <a
                      key={section.title}
                      href={`#legal-${index}`}
                      className="legal-nav__link"
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
