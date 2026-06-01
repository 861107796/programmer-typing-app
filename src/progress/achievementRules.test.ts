import { describe, expect, it, vi } from "vitest";

import { evaluateAchievements } from "./achievementRules";

describe("achievementRules", () => {
  it("unlocks a speed achievement when the threshold is met", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T08:00:00.000Z"));

    const unlocked = evaluateAchievements([], {
      mode: "focused",
      category: "code",
      durationMs: 30000,
      totalChars: 60,
      correctChars: 60,
      errorCount: 0,
      wpm: 24,
      accuracy: 100,
      valid: true,
    });

    expect(unlocked.some((item) => item.id === "speed-20")).toBe(true);

    vi.useRealTimers();
  });
});
