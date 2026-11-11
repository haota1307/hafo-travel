import photos from "./photo-assets.json";

export type PhotoId = keyof typeof photos;

export type PhotoAsset = (typeof photos)[PhotoId];

export function photoSource(id: PhotoId) {
  return photos[id].src;
}

export const photoAssetsBySource: Record<string, PhotoAsset> =
  Object.fromEntries(Object.values(photos).map((photo) => [photo.src, photo]));

const icons = {
  inspiration: "/hafo/icons/inspiration.svg",
  destination: "/hafo/icons/destination.svg",
  conversation: "/hafo/icons/conversation.svg",
  journey: "/hafo/icons/journey.svg",
  plus: "/hafo/icons/plus.svg",
  clarity: "/hafo/icons/clarity.svg",
  respect: "/hafo/icons/respect.svg",
  pace: "/hafo/icons/pace.svg",
  details: "/hafo/icons/details.svg",
  connection: "/hafo/icons/connection.svg",
  beauty: "/hafo/icons/beauty.svg",
  rest: "/hafo/icons/rest.svg",
  discovery: "/hafo/icons/discovery.svg",
};

export const publicImages = {
  hero: photoSource("OQvuJBiXIjI"),
  coast: photoSource("jWECaopdAH8"),
  nature: photoSource("nu9oI3vSmS8"),
  slow: photoSource("KMa7k1tJc74"),
  about: photoSource("lzjlYsMGYXg"),
  combine: photoSource("0-8UDMJTsso"),
  north: photoSource("68TjFyhPJec"),
  central: photoSource("sTja0Dx9pyk"),
  south: photoSource("tzet8Uk51Q0"),
  footer: photoSource("rriWG4_2_js"),
  contact: photoSource("mZ_L9K36pjo"),
  icons,
} as const;

export const imageAssets: Record<string, { width: number; height: number }> = {
  ...Object.fromEntries(
    Object.values(photos).map(({ src, width, height }) => [
      src,
      { width, height },
    ]),
  ),
  ...Object.fromEntries(
    Object.values(icons).map((src) => [src, { width: 49, height: 49 }]),
  ),
};
