import { getDailyChallenge } from "../../src/content/contentLibrary";
import {
  evaluateAchievements,
  type AchievementState,
} from "../../src/progress/achievementRules";
import type { AchievementRecord } from "../repositories/achievementRepository";
import type { DailyChallengeRecord } from "../repositories/dailyChallengeRepository";
import type {
  CreateSessionInput,
  SessionRecord,
} from "../repositories/sessionRepository";

interface ProgressServiceDependencies {
  sessionRepository: {
    create: (userId: string, input: CreateSessionInput) => Promise<SessionRecord>;
    listRecentByUser: (userId: string) => Promise<SessionRecord[]>;
  };
  achievementRepository: {
    listByUser: (userId: string) => Promise<AchievementRecord[]>;
    replaceForUser: (
      userId: string,
      achievements: AchievementState[],
    ) => Promise<void>;
  };
  dailyChallengeRepository: {
    getByUserAndDate: (
      userId: string,
      dateKey: string,
    ) => Promise<DailyChallengeRecord | null>;
    upsert: (input: {
      userId: string;
      dateKey: string;
      challengeId: string;
      completed: boolean;
      bestWpm: number;
      bestAccuracy: number;
      updatedAt: string;
    }) => Promise<void>;
  };
}

function toSessionResponse(record: SessionRecord) {
  return {
    id: record.id,
    mode: record.mode,
    category: record.category,
    durationMs: record.duration_ms,
    totalChars: record.total_chars,
    correctChars: record.correct_chars,
    errorCount: record.error_count,
    wpm: record.wpm,
    accuracy: record.accuracy,
    valid: Boolean(record.valid),
    createdAt: record.created_at,
  };
}

function toAchievementResponse(record: AchievementRecord) {
  return {
    id: record.achievement_id,
    progress: record.progress,
    unlocked: Boolean(record.unlocked),
    unlockedAt: record.unlocked_at,
  };
}

function toDailyChallengeResponse(record: DailyChallengeRecord | null) {
  if (!record) {
    return null;
  }

  return {
    dateKey: record.date_key,
    challengeId: record.challenge_id,
    completed: Boolean(record.completed),
    bestWpm: record.best_wpm,
    bestAccuracy: record.best_accuracy,
  };
}

function toAchievementState(records: AchievementRecord[]): AchievementState[] {
  return records
    .filter((record) => Boolean(record.unlocked))
    .map((record) => ({
      id: record.achievement_id,
      unlockedAt: record.unlocked_at,
    }));
}

export function createProgressService(dependencies: ProgressServiceDependencies) {
  return {
    async getProgressSnapshot(userId: string, dateKey: string) {
      const [sessions, achievements, dailyChallenge] = await Promise.all([
        dependencies.sessionRepository.listRecentByUser(userId),
        dependencies.achievementRepository.listByUser(userId),
        dependencies.dailyChallengeRepository.getByUserAndDate(userId, dateKey),
      ]);

      return {
        sessions: sessions.map(toSessionResponse),
        achievements: achievements.map(toAchievementResponse),
        dailyChallenge: toDailyChallengeResponse(dailyChallenge),
      };
    },
    async saveSession(userId: string, input: CreateSessionInput, dateKey: string) {
      await dependencies.sessionRepository.create(userId, input);

      const currentAchievements = await dependencies.achievementRepository.listByUser(
        userId,
      );
      const nextAchievements = evaluateAchievements(
        toAchievementState(currentAchievements),
        {
          mode: input.mode as "mixed" | "focused" | "daily",
          category: input.category as "mixed" | "code" | "command" | "technical",
          durationMs: input.durationMs,
          totalChars: input.totalChars,
          correctChars: input.correctChars,
          errorCount: input.errorCount,
          wpm: input.wpm,
          accuracy: input.accuracy,
          valid: input.valid,
        },
      );

      await dependencies.achievementRepository.replaceForUser(
        userId,
        nextAchievements,
      );

      if (input.mode === "daily") {
        const dailyChallenge = getDailyChallenge(dateKey);

        await dependencies.dailyChallengeRepository.upsert({
          userId,
          dateKey,
          challengeId: dailyChallenge.content.id,
          completed: input.valid,
          bestWpm: input.wpm,
          bestAccuracy: input.accuracy,
          updatedAt: new Date().toISOString(),
        });
      }

      return this.getProgressSnapshot(userId, dateKey);
    },
  };
}
