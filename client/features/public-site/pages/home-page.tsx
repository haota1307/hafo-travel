import { HomeHero } from "@/features/public-site/sections/home-hero";
import { RetreatCategories } from "@/features/public-site/sections/retreat-categories";
import { AboutSection } from "@/features/public-site/sections/about-section";
import { FeaturedRetreats } from "@/features/public-site/sections/featured-retreats";
import { CombineSection } from "@/features/public-site/sections/combine-section";
import { DestinationSection } from "@/features/public-site/sections/destination-section";
import { HowItWorksSection } from "@/features/public-site/sections/how-it-works-section";
import { ExperiencesSection } from "@/features/public-site/sections/experiences-section";

export function HomePage() {
  return (
    <>
      <HomeHero />
      <RetreatCategories />
      <AboutSection />
      <FeaturedRetreats />
      <CombineSection />
      <DestinationSection />
      <HowItWorksSection />
      <ExperiencesSection />
    </>
  );
}
