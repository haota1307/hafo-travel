import type { RetreatData } from "../retreat-details";
import { photoSource } from "../image-assets";

const retreat = {
  contentKey: "daLat",
  slug: "nghi-duong-da-lat",
  images: [
    photoSource("0-8UDMJTsso"),
    photoSource("KMa7k1tJc74"),
    photoSource("cvvWOR85mf4"),
    photoSource("egdrGoF8r0I"),
  ],
  coverImage: photoSource("cvvWOR85mf4"),
  price: null,
  includedIcons: [
    ["accomodation", "optional", "meals"],
    ["meditation", "workshops", "support"],
  ],
  foodImages: [
    photoSource("4RxWol2YqxE"),
    photoSource("6GAhQYVY8wA"),
    photoSource("U8KZBz2t1pE"),
    photoSource("IetJfRZOZIY"),
  ],
  team: [
    {
      image: photoSource("8mO1Jpm2d2I"),
    },
  ],
  meetingImage: photoSource("OSs1KVJYIhE"),
  relatedSlugs: ["trai-nghiem-hoi-an", "hanh-trinh-ha-long"],
} satisfies RetreatData;

export default retreat;
