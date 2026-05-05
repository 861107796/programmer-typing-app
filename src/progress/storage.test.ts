import { beforeEach, describe, expect, it } from "vitest";

import { createProgressRepository } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and reloads session history", () => {
    const repo = createProgressRepository(localStorage);

    repo.saveSession({
      mode: "mixed",
      category: "mixed",
      durationMs: 1000,
      totalChars: 10,
      correctChars: 10,
      errorCount: 0,
      wpm: 120,
      accuracy: 100,
      valid: true,
    });

    expect(repo.getSessions()).toHaveLength(1);
  });

  it("stores completion state for the daily challenge", () => {
    const repo = createProgressRepository(localStorage);

    repo.saveDailyChallenge({
      dateKey: "2026-05-05",
      challengeId: "code-01",
      completed: true,
      bestWpm: 42,
      bestAccuracy: 99,
    });

    expect(repo.getDailyChallenge("2026-05-05")?.completed).toBe(true);
  });
});
