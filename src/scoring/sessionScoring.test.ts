import { describe, expect, it } from "vitest";

import { calculateSessionResult } from "./sessionScoring";

describe("sessionScoring", () => {
  it("computes wpm and accuracy from typed session data", () => {
    const result = calculateSessionResult({
      mode: "focused",
      category: "code",
      startedAt: 0,
      completedAt: 30000,
      totalChars: 60,
      correctChars: 60,
      errorCount: 2,
      valid: true,
    });

    expect(result.wpm).toBe(24);
    expect(result.accuracy).toBeCloseTo(96.77, 2);
  });
});
