import type { RetreatData } from "../retreat-details";
import { photoSource } from "../image-assets";

const retreat = {
  contentKey: "ninhBinh",
  slug: "kham-pha-ninh-binh",
  images: [
    photoSource("PgSxHidgJHQ"),
    photoSource("68TjFyhPJec"),
    photoSource("nu9oI3vSmS8"),
    photoSource("MWfCxsC9T74"),
  ],
  coverImage: photoSource("-SmvQUbPzGg"),
  price: null,
  includedIcons: [
    ["accomodation", "optional", "meals"],
    ["meditation", "workshops", "support"],
  ],
  foodImages: [
    photoSource("KcjXLXhohRs"),
    photoSource("hf0ub1tRpeA"),
    photoSource("SG_m4YXjUQw"),
    photoSource("675E30NDIVo"),
  ],
  team: [
    {
      image: photoSource("I73-kiWh7UI"),
    },
  ],
  meetingImage: photoSource("-SmvQUbPzGg"),
  relatedSlugs: ["hanh-trinh-ha-long", "kham-pha-ha-giang"],
} satisfies RetreatData;

export default retreat;
