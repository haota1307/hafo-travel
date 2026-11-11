import journey0 from "./retreats/kham-pha-ha-giang";
import journey1 from "./retreats/nghi-duong-da-lat";
import journey2 from "./retreats/trai-nghiem-hoi-an";
import journey3 from "./retreats/kham-pha-ninh-binh";
import journey4 from "./retreats/hanh-trinh-ha-long";
import journey5 from "./retreats/nghi-duong-phu-quoc";
import type { RetreatContentKey } from "./localized-content";

export type RetreatData = {
  contentKey: RetreatContentKey;
  slug: string;
  images: string[];
  coverImage: string;
  price: number | null;
  includedIcons: string[][];
  foodImages: string[];
  team: { image: string }[];
  meetingImage: string;
  relatedSlugs: string[];
};

export type RetreatDetails = {
  title: string;
  description: string;
  slug: string;
  headline: string[];
  images: string[];
  price: number | null;
  locationLabel: string;
  dates: string;
  guests: string;
  about: string[];
  included: { icon: string; label: string }[][];
  special: string[];
  program: { checkIn: string; checkOut: string; description: string[] };
  schedule: { time: string; description: string }[];
  scheduleDescription: string[];
  food: {
    description: string[];
    meals: string[];
    diets: string[];
    images: string[];
  };
  team: { name: string; role: string; bio: string[]; image: string }[];
  meeting: { address: string[]; description: string[]; image: string };
  excluded: string[][];
  relatedSlugs: string[];
};

export const retreatDetails = {
  "kham-pha-ha-giang": journey0,
  "nghi-duong-da-lat": journey1,
  "trai-nghiem-hoi-an": journey2,
  "kham-pha-ninh-binh": journey3,
  "hanh-trinh-ha-long": journey4,
  "nghi-duong-phu-quoc": journey5,
};
