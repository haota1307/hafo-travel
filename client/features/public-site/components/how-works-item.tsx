import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PublicImage } from "./public-image";

type HowWorksItemProps = {
  icon: string;
  number: number;
  title: ReactNode;
  description: ReactNode;
  compact?: boolean;
  animated?: boolean;
};

export function HowWorksItem({
  icon,
  number,
  title,
  description,
  compact = false,
  animated = false,
}: HowWorksItemProps) {
  const animation = animated ? `how-works-item-${number}` : undefined;

  return (
    <div
      data-animation={animation}
      className={cn("how-works-item", compact && "size-s")}
    >
      <div
        data-animation={animated ? `how-works-item-head-${number}` : undefined}
        className="how-works-item__head"
      >
        <PublicImage
          src={icon}
          loading="lazy"
          alt=""
          className="how-works-item__icon"
        />
        <div className="how-works-item__count">
          {String(number).padStart(2, "0")}
        </div>
      </div>
      <div className="how-works-item__body">
        <div
          data-animation={
            animated ? `how-works-item-title-${number}` : undefined
          }
          className="body-md"
        >
          {title}
        </div>
        <div
          data-animation={
            animated ? `how-works-item-description-${number}` : undefined
          }
          className={cn(
            "body-md color-white-50 mobile-no-br",
            compact && "mobile-body-sm",
          )}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
