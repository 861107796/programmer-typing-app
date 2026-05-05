import type { Database } from "sqlite";

import type { AchievementState } from "../../src/progress/achievementRules";

export interface AchievementRecord {
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked: number;
  unlocked_at: string | null;
  updated_at: string;
}

export function createAchievementRepository(db: Database) {
  return {
    async listByUser(userId: string) {
      return db.all<AchievementRecord[]>(
        `select * from user_achievements where user_id = ? order by achievement_id asc`,
        userId,
      );
    },
    async replaceForUser(userId: string, achievements: AchievementState[]) {
      const updatedAt = new Date().toISOString();

      await db.run(`delete from user_achievements where user_id = ?`, userId);

      for (const achievement of achievements) {
        await db.run(
          `insert into user_achievements (
            user_id, achievement_id, progress, unlocked, unlocked_at, updated_at
          ) values (?, ?, ?, ?, ?, ?)`,
          userId,
          achievement.id,
          1,
          achievement.unlockedAt ? 1 : 0,
          achievement.unlockedAt,
          updatedAt,
        );
      }
    },
  };
}
