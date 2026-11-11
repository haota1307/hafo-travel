import { retreatDetails } from "./retreat-details";
import {
  getPublicContent,
  type PublicContentReader,
} from "./localized-content";

export function getRetreats(t: PublicContentReader) {
  const content = getPublicContent(t, "retreatCards");

  return Object.values(retreatDetails).map((retreat) => ({
    slug: retreat.slug,
    image: retreat.coverImage,
    price: retreat.price as number | null,
    mobileImageInBody: false,
    ...content[retreat.contentKey],
  }));
}

export type Retreat = ReturnType<typeof getRetreats>[number];
