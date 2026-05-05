import type { PracticeMode, SessionResult } from "../domain/types";

interface ScoreInput {
  mode: PracticeMode;
  category: SessionResult["category"];
  startedAt: number;
  completedAt: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  valid: boolean;
}

export function calculateSessionResult(input: ScoreInput): SessionResult {
  const durationMs = input.completedAt - input.startedAt;
  const minutes = durationMs / 60000;
  const wpm =
    minutes === 0 ? 0 : Number(((input.correctChars / 5) / minutes).toFixed(2));
  const attempts = input.correctChars + input.errorCount;
  const accuracy =
    attempts === 0
      ? 100
      : Number(((input.correctChars / attempts) * 100).toFixed(2));

  return {
    mode: input.mode,
    category: input.category,
    durationMs,
    totalChars: input.totalChars,
    correctChars: input.correctChars,
    errorCount: input.errorCount,
    wpm,
    accuracy,
    valid: input.valid,
  };
}
