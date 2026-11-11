import { publicImages } from "@/features/public-site/data/image-assets";
import { useTranslations } from "next-intl";
import { HowWorksItem } from "@/features/public-site/components/how-works-item";

const steps = [
  {
    icon: publicImages.icons.inspiration,
    title: "howItWorks.goalsTitle",
    description: "howItWorks.goalsDescription",
  },
  {
    icon: publicImages.icons.destination,
    title: "howItWorks.matchesTitle",
    description: "howItWorks.matchesDescription",
  },
  {
    icon: publicImages.icons.conversation,
    title: "howItWorks.packageTitle",
    description: "howItWorks.packageDescription",
  },
  {
    icon: publicImages.icons.journey,
    title: "howItWorks.progressTitle",
    description: "howItWorks.progressDescription",
  },
] as const;

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
            {steps.map((step, index) => (
              <HowWorksItem
                key={step.title}
                icon={step.icon}
                number={index + 1}
                animated
                title={t.rich(step.title, {
                  emphasis: (chunks) => (
                    <span className="mobile-fw">{chunks}</span>
                  ),
                })}
                description={t.rich(step.description, { br: () => <br /> })}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
