import { describe, expect, it } from "vitest";

import {
  createSessionState,
  handleBackspace,
  handleCharacterInput,
} from "./typingEngine";

describe("typingEngine", () => {
  it("marks a matching character as correct and advances the cursor", () => {
    const state = createSessionState("git");
    const next = handleCharacterInput(state, "g", 100);

    expect(next.cursor).toBe(1);
    expect(next.correctChars).toBe(1);
    expect(next.errorCount).toBe(0);
    expect(next.startedAt).toBe(100);
  });

  it("records an incorrect character without advancing the cursor", () => {
    const state = createSessionState("git");
    const next = handleCharacterInput(state, "x", 100);

    expect(next.cursor).toBe(0);
    expect(next.correctChars).toBe(0);
    expect(next.errorCount).toBe(1);
    expect(next.invalid).toBe("x");
  });

  it("allows backspace to clear the current invalid state", () => {
    const state = handleCharacterInput(createSessionState("git"), "x", 100);
    const next = handleBackspace(state);

    expect(next.invalid).toBeNull();
    expect(next.errorCount).toBe(1);
    expect(next.cursor).toBe(0);
  });
});
