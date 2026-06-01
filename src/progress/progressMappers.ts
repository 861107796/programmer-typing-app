import type {
  PersistedAchievement,
  PersistedSession,
} from "../domain/types";
import type { AchievementState } from "./achievementRules";

export function mapAchievementSnapshot(
  achievements: PersistedAchievement[],
): AchievementState[] {
  return achievements
    .filter((achievement) => achievement.unlocked)
    .map((achievement) => ({
      id: achievement.id,
      unlockedAt: achievement.unlockedAt,
    }));
}

export function mapSessionSnapshot(sessions: PersistedSession[]) {
  return sessions;
}
