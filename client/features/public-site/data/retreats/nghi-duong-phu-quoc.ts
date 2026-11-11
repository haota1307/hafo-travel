import type { RetreatData } from "../retreat-details";
import { photoSource } from "../image-assets";

const retreat = {
  contentKey: "phuQuoc",
  slug: "nghi-duong-phu-quoc",
  images: [
    photoSource("tzet8Uk51Q0"),
    photoSource("r6CIzamxaek"),
    photoSource("z47CAQ0C6KE"),
    photoSource("nz9b1pZJ-S4"),
  ],
  coverImage: photoSource("tOCa0lSuS3M"),
  price: null,
  includedIcons: [
    ["accomodation", "optional", "meals"],
    ["meditation", "workshops", "support"],
  ],
  foodImages: [
    photoSource("h0ACFHTLWyk"),
    photoSource("zNsXLClT73o"),
    photoSource("4Dmu_WaK9MY"),
    photoSource("p3p5RzMvKfM"),
  ],
  team: [
    {
      image: photoSource("tOCa0lSuS3M"),
    },
  ],
  meetingImage: photoSource("jWECaopdAH8"),
  relatedSlugs: ["kham-pha-ha-giang", "trai-nghiem-hoi-an"],
} satisfies RetreatData;

export default retreat;
