import type {
  LeaderboardEntryRow,
  LeaderboardRankRow,
} from "../repositories/leaderboardRepository";

function toDisplayName(email: string) {
  return email.split("@")[0] || "anonymous";
}

function toEntry(row: LeaderboardEntryRow, rank: number) {
  return {
    rank,
    displayName: toDisplayName(row.email),
    wpm: row.wpm,
    accuracy: row.accuracy,
    recordedAt: row.recorded_at,
  };
}

function toRankSummary(row: LeaderboardRankRow | null) {
  if (!row) {
    return null;
  }

  return {
    rank: row.rank,
    displayName: toDisplayName(row.email),
    wpm: row.wpm,
    accuracy: row.accuracy,
    recordedAt: row.recorded_at,
  };
}

interface LeaderboardServiceDependencies {
  leaderboardRepository: {
    listDailyTop: (
      dateKey: string,
      limit?: number,
    ) => Promise<LeaderboardEntryRow[]>;
    listGlobalTop: (limit?: number) => Promise<LeaderboardEntryRow[]>;
    getDailyRankForUser: (
      userId: string,
      dateKey: string,
    ) => Promise<LeaderboardRankRow | null>;
    getGlobalRankForUser: (userId: string) => Promise<LeaderboardRankRow | null>;
  };
}

export function createLeaderboardService(
  dependencies: LeaderboardServiceDependencies,
) {
  return {
    async getDailyLeaderboard(dateKey: string) {
      const rows = await dependencies.leaderboardRepository.listDailyTop(
        dateKey,
        100,
      );

      return {
        entries: rows.map((row, index) => toEntry(row, index + 1)),
      };
    },

    async getGlobalLeaderboard() {
      const rows = await dependencies.leaderboardRepository.listGlobalTop(100);

      return {
        entries: rows.map((row, index) => toEntry(row, index + 1)),
      };
    },

    async getMyLeaderboardSummary(userId: string, dateKey: string) {
      const [daily, global] = await Promise.all([
        dependencies.leaderboardRepository.getDailyRankForUser(userId, dateKey),
        dependencies.leaderboardRepository.getGlobalRankForUser(userId),
      ]);

      return {
        daily: toRankSummary(daily),
        global: toRankSummary(global),
      };
    },
  };
}
