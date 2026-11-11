import type { RetreatData } from "../retreat-details";
import { photoSource } from "../image-assets";

const retreat = {
  contentKey: "haGiang",
  slug: "kham-pha-ha-giang",
  images: [
    photoSource("7Sj9X8NqNAk"),
    photoSource("fcnEa-mu2Ac"),
    photoSource("9zP2ihhMBV4"),
    photoSource("7JBdrcomnms"),
  ],
  coverImage: photoSource("T8pZ0JepBkg"),
  price: null,
  includedIcons: [
    ["accomodation", "optional", "meals"],
    ["meditation", "workshops", "support"],
  ],
  foodImages: [
    photoSource("ygbULTajumg"),
    photoSource("MFydc2AnklU"),
    photoSource("XxP2J4NvzJQ"),
    photoSource("JbXoBwie0Tk"),
  ],
  team: [
    {
      image: photoSource("T8pZ0JepBkg"),
    },
  ],
  meetingImage: photoSource("vf1r6eSJvl4"),
  relatedSlugs: ["nghi-duong-da-lat", "kham-pha-ninh-binh"],
} satisfies RetreatData;

export default retreat;
