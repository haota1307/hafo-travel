import type { RetreatData } from "../retreat-details";
import { photoSource } from "../image-assets";

const retreat = {
  contentKey: "hoiAn",
  slug: "trai-nghiem-hoi-an",
  images: [
    photoSource("sTja0Dx9pyk"),
    photoSource("gXNgbsazPg8"),
    photoSource("qZGdIs5W3LI"),
    photoSource("tj9LPxkFRx0"),
  ],
  coverImage: photoSource("gXNgbsazPg8"),
  price: null,
  includedIcons: [
    ["accomodation", "optional", "meals"],
    ["meditation", "workshops", "support"],
  ],
  foodImages: [
    photoSource("Mye1qNF-kjU"),
    photoSource("uo2rdcNXOpc"),
    photoSource("vr6NpzGM7xs"),
    photoSource("qzbR-y7n-yI"),
  ],
  team: [
    {
      image: photoSource("scAOTOLLEaM"),
    },
  ],
  meetingImage: photoSource("Xk5oe8IezJ8"),
  relatedSlugs: ["kham-pha-ninh-binh", "nghi-duong-phu-quoc"],
} satisfies RetreatData;

export default retreat;
