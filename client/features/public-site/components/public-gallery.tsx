"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { PublicImage } from "./public-image";

export function PublicGallery({ images }: { images: string[] }) {
  const t = useTranslations("publicSite");
  const [api, setApi] = useState<CarouselApi>();
  const subscribe = useCallback(
    (onChange: () => void) => {
      api?.on("select", onChange).on("reInit", onChange);

      return () => {
        api?.off("select", onChange).off("reInit", onChange);
      };
    },
    [api],
  );
  const active = useSyncExternalStore(
    subscribe,
    () => api?.selectedScrollSnap() ?? 0,
    () => 0,
  );

  return (
    <Carousel
      setApi={setApi}
      className="public-gallery"
      aria-label={t("retreatPhotos")}
      opts={{
        loop: true,
        breakpoints: { "(min-width: 480px)": { active: false } },
      }}
    >
      <CarouselContent className="retreat-gallery-track ml-0">
        {images.map((src, index) => (
          <CarouselItem key={src} className="retreat-gallery-item pl-0">
            <PublicImage
              src={src}
              alt={t("retreatPhoto", { number: index + 1 })}
              className="retreat-page-intro__photo"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="public-gallery-dots" aria-label={t("choosePhoto")}>
        {images.map((src, index) => (
          <Button
            key={src}
            type="button"
            size="icon-xs"
            variant={active === index ? "default" : "outline"}
            className="rounded-full p-0"
            aria-label={t("showPhoto", { number: index + 1 })}
            aria-current={active === index ? "true" : undefined}
            disabled={!api}
            onClick={() =>
              api?.scrollTo(
                index,
                window.matchMedia("(prefers-reduced-motion: reduce)").matches,
              )
            }
          />
        ))}
      </div>
    </Carousel>
  );
}
