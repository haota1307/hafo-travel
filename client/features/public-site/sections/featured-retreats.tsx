import { useTranslations } from "next-intl";
import { PublicButton } from "@/features/public-site/components/public-button";
import { RetreatCard } from "@/features/public-site/components/retreat-card";
import { getRetreats } from "@/features/public-site/data/retreats";

export function FeaturedRetreats({
  relatedSlugs,
}: {
  relatedSlugs?: string[];
}) {
  const t = useTranslations("publicSite");
  const retreats = getRetreats(t);

  const items = relatedSlugs
    ? relatedSlugs.flatMap((slug) =>
        retreats.filter((retreat) => retreat.slug === slug),
      )
    : retreats;

  return (
    <>
      <section id="retreats" className="featured-section padding-global">
        <div className="container">
          <div className="head">
            <div className="row align-end mobile-column">
              <div className="column column-6">
                <div className="head__description mobile-margin-bottom-16">
                  <h2 data-animation="featured-head" className="h2 mobile-h3">
                    {relatedSlugs
                      ? t("featured.related")
                      : t.rich("featured.headline", {
                          emphasis: (chunks) => (
                            <span className="mobile-fw">{chunks}</span>
                          ),
                        })}
                  </h2>
                </div>
              </div>
              <div className="column column-6">
                <div className="featured-section__head">
                  <div
                    data-animation="featured-head-description"
                    className="body-md color-white-60 mobile-no-br"
                  >
                    {t.rich("featured.description", { br: () => <br /> })}
                  </div>
                  {relatedSlugs && (
                    <PublicButton href="/#retreats" variant="secondary">
                      {t("featured.seeAll")}
                    </PublicButton>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="featured">
            <div className="featured__items">
              {items.map((retreat) => (
                <RetreatCard key={retreat.slug} retreat={retreat} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
