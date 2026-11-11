import type { RetreatData } from "../retreat-details";
import { photoSource } from "../image-assets";

const retreat = {
  contentKey: "haLong",
  slug: "hanh-trinh-ha-long",
  images: [
    photoSource("kG7pOXbBfNs"),
    photoSource("5RjpoBtb54o"),
    photoSource("dooX1R4_0Z8"),
    photoSource("rriWG4_2_js"),
  ],
  coverImage: photoSource("aQNHyIOwFZs"),
  price: null,
  includedIcons: [
    ["accomodation", "optional", "meals"],
    ["meditation", "workshops", "support"],
  ],
  foodImages: [
    photoSource("MBcRaYe4zqM"),
    photoSource("Xwasijgdm5Q"),
    photoSource("78m6KKAH35I"),
    photoSource("rqcEEipdD98"),
  ],
  team: [
    {
      image: photoSource("TvB_S0cB2ik"),
    },
  ],
  meetingImage: photoSource("aQNHyIOwFZs"),
  relatedSlugs: ["nghi-duong-phu-quoc", "nghi-duong-da-lat"],
} satisfies RetreatData;

export default retreat;
