import type {
  LeaderboardResponse,
  PersonalLeaderboardResponse,
} from "../domain/types";

async function readJson<T>(path: string) {
  const response = await fetch(path, {
    credentials: "include",
  });

  if (response.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  if (!response.ok) {
    throw new Error(`Leaderboard request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchDailyLeaderboard() {
  return readJson<LeaderboardResponse>("/api/leaderboard/daily");
}

export function fetchGlobalLeaderboard() {
  return readJson<LeaderboardResponse>("/api/leaderboard/global");
}

export function fetchMyLeaderboardSummary() {
  return readJson<PersonalLeaderboardResponse>("/api/leaderboard/me");
}
