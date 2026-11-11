import type messages from "@/messages/en.json";

type LocalizedContent = Pick<
  typeof messages.publicSite,
  "experienceProfiles" | "retreatCards" | "retreatContent"
>;

export type PublicContentReader = {
  raw(key: keyof LocalizedContent): unknown;
};

export type RetreatContentKey = keyof LocalizedContent["retreatContent"];

export function getPublicContent<Key extends keyof LocalizedContent>(
  t: PublicContentReader,
  key: Key,
): LocalizedContent[Key] {
  return t.raw(key) as LocalizedContent[Key];
}
