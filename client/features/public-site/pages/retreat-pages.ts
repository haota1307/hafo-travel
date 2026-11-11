import { retreatDetails, type RetreatDetails } from "../data/retreat-details";
import {
  getPublicContent,
  type PublicContentReader,
} from "../data/localized-content";

export const retreatPages = retreatDetails;

export function getRetreatPage(
  slug: string,
  t: PublicContentReader,
): RetreatDetails | undefined {
  if (!Object.hasOwn(retreatPages, slug)) {
    return undefined;
  }

  const data = retreatPages[slug as keyof typeof retreatPages];
  const content = getPublicContent(t, "retreatContent")[data.contentKey];

  return {
    ...content,
    slug: data.slug,
    images: data.images,
    price: data.price,
    included: content.included.map((column, columnIndex) =>
      column.map((label, index) => ({
        icon: data.includedIcons[columnIndex][index],
        label,
      })),
    ),
    food: { ...content.food, images: data.foodImages },
    team: data.team.map((member, index) => ({
      ...member,
      ...content.team[index],
    })),
    meeting: { ...content.meeting, image: data.meetingImage },
    relatedSlugs: data.relatedSlugs,
  };
}
