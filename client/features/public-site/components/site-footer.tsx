import { publicImages } from "../data/image-assets";
import { useTranslations } from "next-intl";
import { SiteMark } from "./site-mark";
import { Link } from "@/i18n/navigation";
import { PublicImage } from "@/features/public-site/components/public-image";
import { publicSiteConfig } from "@/features/public-site/site.config";

export function SiteFooter() {
  const t = useTranslations("publicSite");

  return (
    <>
      <div className="footer hafo-inverse" role="contentinfo">
        <div className="container">
          <div className="footer__in">
            <div className="footer__visual">
              <PublicImage
                loading="lazy"
                src={publicImages.footer}
                alt=""
                className="footer__illustration"
              />
              <div className="footer__layer"></div>
            </div>
            <div className="footer-top">
              <div className="row mobile-column mobile-gap-56">
                <div className="column column-4">
                  <Link href="/" className="footer-logo">
                    <div>
                      <SiteMark className="footer-logo__icon" />
                    </div>
                    <div className="footer-logo__title">
                      {publicSiteConfig.name}
                    </div>
                  </Link>
                </div>
                <div className="column column-8">
                  <div className="row mobile-column mobile-gap-56">
                    <div className="column column-6">
                      <div className="footer-top__links">
                        <div className="footer-top__link">
                          <Link href="/experiences" className="h3 color-white">
                            {t.rich("footer.experiences", {
                              emphasis: (chunks) => (
                                <span className="color-white-40">{chunks}</span>
                              ),
                            })}
                          </Link>
                        </div>
                        <div className="footer-top__link">
                          <Link href="/contacts" className="h3 color-white">
                            {t.rich("footer.contacts", {
                              emphasis: (chunks) => (
                                <span className="color-white-40">{chunks}</span>
                              ),
                            })}
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="column column-6">
                      <div className="footer-top__contacts">
                        <div className="footer-top__contact">
                          <a
                            href={`tel:${publicSiteConfig.phone.replaceAll(" ", "")}`}
                            className="body-lg color-white"
                          >
                            {publicSiteConfig.phone}
                          </a>
                        </div>
                        <div className="footer-top__contact">
                          <a
                            href={`mailto:${publicSiteConfig.email}`}
                            className="body-lg color-white"
                          >
                            {publicSiteConfig.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom__in">
            <div className="footer__l">
              <div className="footer__copy">
                <div className="button-sm color-white-60">
                  {t("footer.copyright", {
                    name: publicSiteConfig.title,
                    year: 2026,
                  })}
                </div>
                <div className="footer__copy-dec"></div>
              </div>
              <p className="footer-made-by mobile-hidden body-sm color-white-60">
                {t("footer.tagline")}
              </p>
            </div>
            <div className="footer-bottom__links">
              <div className="footer-bottom__link">
                <Link
                  href="/terms-and-conditions"
                  className="button-sm color-white-60"
                >
                  {t("terms.title")}
                </Link>
              </div>
              <div className="footer-bottom__link">
                <Link
                  href="/privacy-policy"
                  className="button-sm color-white-60"
                >
                  {t("privacy.title")}
                </Link>
              </div>
            </div>
            <p className="footer-made-by mobile-visible body-sm color-white-60">
              {t("footer.tagline")}
            </p>
          </div>
          <div className="footer-bottom__dec"></div>
        </div>
      </div>
    </>
  );
}
