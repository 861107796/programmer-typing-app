import type { SessionResult } from "../domain/types";

export interface AchievementState {
  id: string;
  unlockedAt: string | null;
}

const ACHIEVEMENTS = [
  {
    id: "speed-20",
    test: (result: SessionResult) => result.valid && result.wpm >= 20,
  },
  {
    id: "accuracy-98",
    test: (result: SessionResult) => result.valid && result.accuracy >= 98,
  },
  {
    id: "command-starter",
    test: (result: SessionResult) =>
      result.valid && result.category === "command",
  },
];

export function evaluateAchievements(
  previous: AchievementState[],
  result: SessionResult,
): AchievementState[] {
  const existingIds = new Set(
    previous.filter((item) => item.unlockedAt).map((item) => item.id),
  );
  const unlockedAt = new Date().toISOString();
  const next = [...previous];

  for (const achievement of ACHIEVEMENTS) {
    if (!existingIds.has(achievement.id) && achievement.test(result)) {
      next.push({ id: achievement.id, unlockedAt });
    }
  }

  return next;
}
