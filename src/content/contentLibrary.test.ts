import { describe, expect, it } from "vitest";

import {
  filterContent,
  getAllContent,
  getContentByCategory,
  getDailyChallenge,
  getMixedPracticeSet,
} from "./contentLibrary";

describe("contentLibrary", () => {
  it("exposes topic, difficulty, and length on every prompt", () => {
    const items = getAllContent();

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.topic).toBeTruthy();
      expect(["easy", "medium", "hard"]).toContain(item.difficulty);
      expect(["short", "medium", "long"]).toContain(item.length);
    }
  });

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

  it("filters prompts by topic", () => {
    const items = filterContent({ topic: "git" });

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.topic === "git")).toBe(true);
  });

  it("filters prompts by difficulty and length together", () => {
    const items = filterContent({ difficulty: "hard", length: "long" });

    expect(items.length).toBeGreaterThan(0);
    expect(
      items.every(
        (item) => item.difficulty === "hard" && item.length === "long",
      ),
    ).toBe(true);
  });
});
