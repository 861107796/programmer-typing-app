import { getAllContent } from "../../src/content/contentLibrary";

export type LegacySeedItem = ReturnType<typeof getAllContent>[number];

export function getLegacySeedContent(): LegacySeedItem[] {
  return getAllContent();
}
