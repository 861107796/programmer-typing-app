import { describe, expect, it } from "vitest";

import { codePrompts } from "./data/code";
import { commandPrompts } from "./data/command";
import { technicalPrompts } from "./data/technical";
import {
  getAllContent,
  getDailyChallenge,
  getMixedPracticeSet,
} from "./contentLibrary";

describe("content integrity", () => {
  it("contains at least 180 curated code prompts", () => {
    expect(codePrompts.length).toBeGreaterThanOrEqual(180);
  });

  it("contains at least 140 curated command prompts", () => {
    expect(commandPrompts.length).toBeGreaterThanOrEqual(140);
  });

  it("contains at least 100 curated technical prompts", () => {
    expect(technicalPrompts.length).toBeGreaterThanOrEqual(100);
  });

  it("contains at least 420 total prompts", () => {
    expect(getAllContent().length).toBeGreaterThanOrEqual(420);
  });

  it("uses unique ids across the entire dataset", () => {
    const ids = getAllContent().map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses valid metadata values on every prompt", () => {
    for (const item of getAllContent()) {
      expect(["code", "command", "technical"]).toContain(item.category);
      expect([
        "javascript",
        "typescript",
        "python",
        "sql",
        "shell",
        "json",
        "yaml",
        "git",
        "npm",
        "pip",
        "filesystem",
        "search",
        "docker",
        "curl",
        "api",
        "database",
        "logging",
        "deploy",
        "debugging",
        "docs",
        "errors",
      ]).toContain(item.topic);
      expect(["easy", "medium", "hard"]).toContain(item.difficulty);
      expect(["short", "medium", "long"]).toContain(item.length);
    }
  });

  it("keeps mixed practice balanced across categories", () => {
    const items = getMixedPracticeSet(9);
    const categories = new Set(items.map((item) => item.category));

    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  it("keeps daily challenge selection deterministic", () => {
    const first = getDailyChallenge("2026-05-05");
    const second = getDailyChallenge("2026-05-05");

    expect(first).toEqual(second);
  });
});
