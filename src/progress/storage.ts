import type { SessionResult, StoredDailyChallenge } from "../domain/types";
import type { AchievementState } from "./achievementRules";

const SESSIONS_KEY = "pta.sessions";
const CHALLENGES_KEY = "pta.dailyChallenges";
const ACHIEVEMENTS_KEY = "pta.achievements";

function safeRead<T>(storage: Storage, key: string, fallback: T): T {
  const raw = storage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function createProgressRepository(storage: Storage) {
  return {
    getSessions(): SessionResult[] {
      return safeRead(storage, SESSIONS_KEY, []);
    },
    saveSession(result: SessionResult) {
      const current = safeRead<SessionResult[]>(storage, SESSIONS_KEY, []);
      storage.setItem(
        SESSIONS_KEY,
        JSON.stringify([result, ...current].slice(0, 50)),
      );
    },
    getAchievements(): AchievementState[] {
      return safeRead(storage, ACHIEVEMENTS_KEY, []);
    },
    saveAchievements(items: AchievementState[]) {
      storage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(items));
    },
    getDailyChallenge(dateKey: string): StoredDailyChallenge | null {
      const map = safeRead<Record<string, StoredDailyChallenge>>(
        storage,
        CHALLENGES_KEY,
        {},
      );

      return map[dateKey] ?? null;
    },
    saveDailyChallenge(challenge: StoredDailyChallenge) {
      const map = safeRead<Record<string, StoredDailyChallenge>>(
        storage,
        CHALLENGES_KEY,
        {},
      );
      map[challenge.dateKey] = challenge;
      storage.setItem(CHALLENGES_KEY, JSON.stringify(map));
    },
  };
}
