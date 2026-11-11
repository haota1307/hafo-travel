import {
  getPublicContent,
  type PublicContentReader,
} from "./localized-content";
import { photoSource } from "./image-assets";

const experiences = [
  {
    contentKey: "haGiang",
    image: photoSource("7Sj9X8NqNAk"),
  },
  {
    contentKey: "saPa",
    image: photoSource("zaxhTnx8WFc"),
  },
  {
    contentKey: "haNoi",
    image: photoSource("qqmZrehZtj0"),
  },
  {
    contentKey: "ninhBinh",
    image: photoSource("PgSxHidgJHQ"),
  },
  {
    contentKey: "haLong",
    image: photoSource("rriWG4_2_js"),
  },
  {
    contentKey: "hue",
    image: photoSource("lzjlYsMGYXg"),
  },
  {
    contentKey: "daNang",
    image: photoSource("nLH08BnLB3Y"),
  },
  {
    contentKey: "hoiAn",
    image: photoSource("tj9LPxkFRx0"),
  },
  {
    contentKey: "quyNhon",
    image: photoSource("AmBpgKYcswM"),
  },
  {
    contentKey: "phuYen",
    image: photoSource("XyRQ8_uXbH0"),
  },
  {
    contentKey: "daLat",
    image: photoSource("egdrGoF8r0I"),
  },
  {
    contentKey: "phuQuoc",
    image: photoSource("r6CIzamxaek"),
  },
] as const;

export function getExperiences(t: PublicContentReader) {
  const content = getPublicContent(t, "experienceProfiles");

  return experiences.map(({ contentKey, ...experience }) => ({
    ...experience,
    ...content[contentKey],
  }));
}

export type Experience = ReturnType<typeof getExperiences>[number];
