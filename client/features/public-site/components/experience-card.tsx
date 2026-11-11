"use client";

import { MapPin, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { PublicImage } from "./public-image";
import { usePublicPortalContainer } from "./public-experience";
import type { Experience } from "../data/experiences";

export function ExperienceCard({ experience }: { experience: Experience }) {
  const t = useTranslations("publicSite");
  const portalContainer = usePublicPortalContainer();

  return (
    <Card className="experience-card rounded-none bg-transparent shadow-none ring-0">
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={150}
          render={
            <Button
              variant="ghost"
              className="experience-trigger h-auto items-stretch rounded-none p-0"
              aria-label={t("viewExperience", { name: experience.name })}
            />
          }
        >
          <div className="experience-card__visual">
            <PublicImage
              src={experience.image}
              alt={experience.name}
              className="experience-card__photo"
            />
            <div className="experience-card__head">
              <div className="body-lg">{experience.name}</div>
              <div className="body-sm">{experience.specialty}</div>
            </div>
          </div>
        </PopoverTrigger>
        {portalContainer && (
          <PopoverContent
            portalContainer={portalContainer}
            className="experience-profile"
            side="right"
            align="start"
          >
            <PopoverHeader>
              <PopoverTitle>{experience.name}</PopoverTitle>
              <PopoverDescription>
                {experience.specialty} · {experience.location}
              </PopoverDescription>
            </PopoverHeader>
            <div className="experience-bio">
              {experience.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <Separator />
            <dl className="experience-stats">
              <div>
                <dt>{t("experienceSetting")}</dt>
                <dd>
                  <MapPin aria-hidden="true" />
                  {experience.setting}
                </dd>
              </div>
              <div>
                <dt>{t("experiencePace")}</dt>
                <dd>
                  <Sparkles aria-hidden="true" />
                  {experience.pace}
                </dd>
              </div>
            </dl>
          </PopoverContent>
        )}
      </Popover>
    </Card>
  );
}
