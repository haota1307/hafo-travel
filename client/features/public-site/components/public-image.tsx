import Image, { type ImageProps } from "next/image";
import { useLocale } from "next-intl";
import { imageAssets, photoAssetsBySource } from "../data/image-assets";

type PublicImageProps = Omit<ImageProps, "width" | "height" | "src"> & {
  src: string;
  decorative?: boolean;
};

export function PublicImage({
  src,
  alt,
  decorative = false,
  sizes = "(max-width: 479px) 100vw, (max-width: 991px) 70vw, 55vw",
  style,
  ...props
}: PublicImageProps) {
  const locale = useLocale();
  const dimensions = imageAssets[src];
  const photo = photoAssetsBySource[src];

  if (!dimensions) {
    throw new Error(`Unknown public image: ${src}`);
  }

  return (
    <Image
      src={src}
      alt={
        decorative ? "" : alt || photo?.alt[locale === "vi" ? "vi" : "en"] || ""
      }
      {...dimensions}
      sizes={sizes}
      style={{ objectPosition: photo?.focalPoint, ...style }}
      {...props}
    />
  );
}
