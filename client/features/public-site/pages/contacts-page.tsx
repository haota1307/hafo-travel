import { publicImages } from "../data/image-assets";
import { publicSiteConfig } from "../site.config";
import { SiteMark } from "@/features/public-site/components/site-mark";
import { useTranslations } from "next-intl";
import { PublicImage } from "@/features/public-site/components/public-image";
import { ContactForm } from "@/features/public-site/components/contact-form";

export function ContactsPage() {
  const t = useTranslations("publicSite");

  return (
    <>
      <div className="page-padding">
        <div className="contact-us">
          <div className="contact-us__in">
            <div className="contact-us__column">
              <div className="contact-us__visual">
                <PublicImage
                  src={publicImages.contact}
                  loading="eager"
                  alt=""
                  className="contact-us__illustration"
                />
              </div>
              <div className="contact-us__dec contact-us__dec--1"></div>
            </div>
            <div className="contact-us__column">
              <div className="contact-us__content">
                <div className="contact-us__head">
                  <div className="head head--column-gap-24">
                    <div data-anim="contacts-head" className="head__title">
                      <SiteMark className="logo-mini" />
                      <div className="body-md">{t("contacts")}</div>
                    </div>
                    <h1
                      data-anim="contacts-title"
                      className="h2 mobile-font-size-36"
                    >
                      {t("getInTouch")}
                    </h1>
                    <div className="mobile-margin-top-minus-8">
                      <div
                        data-anim="contacts-description"
                        className="body-lg color-white-60"
                      >
                        {t("contactsPage.description")}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="site-direct-contact">
                  <h2 className="body-md">{t("contactsPage.directContact")}</h2>
                  <a href={`tel:${publicSiteConfig.phone}`}>
                    {publicSiteConfig.phone}
                  </a>
                  <a href={`mailto:${publicSiteConfig.email}`}>
                    {publicSiteConfig.email}
                  </a>
                </div>
                <ContactForm />
              </div>
            </div>
            <div className="contact-us__dec contact-us__dec--2"></div>
          </div>
        </div>
      </div>
    </>
  );
}
