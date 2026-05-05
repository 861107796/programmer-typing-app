import { describe, expect, it } from "vitest";

import {
  getContentByCategory,
  getDailyChallenge,
  getMixedPracticeSet,
} from "./contentLibrary";

describe("contentLibrary", () => {
  it("returns only command items for focused command practice", () => {
    const items = getContentByCategory("command");

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.category === "command")).toBe(true);
  });

  it("returns a stable daily challenge for the same date", () => {
    const first = getDailyChallenge("2026-05-05");
    const second = getDailyChallenge("2026-05-05");

    expect(second).toEqual(first);
  });

  it("builds a mixed set containing at least two categories", () => {
    const items = getMixedPracticeSet(4);
    const categories = new Set(items.map((item) => item.category));

    expect(items).toHaveLength(4);
    expect(categories.size).toBeGreaterThanOrEqual(2);
  });

  it("keeps symbol-heavy prompts available in mixed practice", () => {
    const items = getMixedPracticeSet(6);

    expect(items.some((item) => /[{}()[\]=><;:_]/.test(item.prompt))).toBe(true);
  });
});
