import type { Database } from "sqlite";

export interface DailyChallengeRecord {
  user_id: string;
  date_key: string;
  challenge_id: string;
  completed: number;
  best_wpm: number;
  best_accuracy: number;
  updated_at: string;
}

export interface UpsertDailyChallengeInput {
  userId: string;
  dateKey: string;
  challengeId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  updatedAt: string;
}

export function createDailyChallengeRepository(db: Database) {
  return {
    async getByUserAndDate(userId: string, dateKey: string) {
      return (
        (await db.get<DailyChallengeRecord>(
          `select * from daily_challenge_progress where user_id = ? and date_key = ?`,
          userId,
          dateKey,
        )) ?? null
      );
    },
    async upsert(input: UpsertDailyChallengeInput) {
      await db.run(
        `insert into daily_challenge_progress (
          user_id, date_key, challenge_id, completed, best_wpm, best_accuracy, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?)
        on conflict(user_id, date_key) do update set
          challenge_id = excluded.challenge_id,
          completed = excluded.completed,
          best_wpm = max(daily_challenge_progress.best_wpm, excluded.best_wpm),
          best_accuracy = max(daily_challenge_progress.best_accuracy, excluded.best_accuracy),
          updated_at = excluded.updated_at`,
        input.userId,
        input.dateKey,
        input.challengeId,
        input.completed ? 1 : 0,
        input.bestWpm,
        input.bestAccuracy,
        input.updatedAt,
      );
    },
  };
}
