import { useEffect, useState } from "react";

import type {
  LeaderboardEntry,
  LeaderboardResponse,
  PersonalLeaderboardResponse,
  PersonalLeaderboardSummary,
} from "../domain/types";
import {
  fetchDailyLeaderboard,
  fetchGlobalLeaderboard,
  fetchMyLeaderboardSummary,
} from "../leaderboard/leaderboardApi";

type BoardMode = "daily" | "global";

function formatSummary(summary: PersonalLeaderboardSummary) {
  return `${summary.rank}. ${summary.displayName} · ${summary.wpm} WPM · ${summary.accuracy}%`;
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeaderboardView({
  onAuthExpired,
}: {
  onAuthExpired: () => void;
}) {
  const [boardMode, setBoardMode] = useState<BoardMode>("daily");
  const [daily, setDaily] = useState<LeaderboardResponse | null>(null);
  const [global, setGlobal] = useState<LeaderboardResponse | null>(null);
  const [summary, setSummary] = useState<PersonalLeaderboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([
      fetchDailyLeaderboard(),
      fetchGlobalLeaderboard(),
      fetchMyLeaderboardSummary(),
    ])
      .then(([dailyResponse, globalResponse, summaryResponse]) => {
        if (cancelled) {
          return;
        }

        setDaily(dailyResponse);
        setGlobal(globalResponse);
        setSummary(summaryResponse);
      })
      .catch((reason) => {
        if (cancelled) {
          return;
        }

        if (reason instanceof Error && reason.message === "AUTH_EXPIRED") {
          onAuthExpired();
          return;
        }

        setError("Unable to load leaderboard right now.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onAuthExpired]);

  const activeEntries: LeaderboardEntry[] =
    boardMode === "daily" ? daily?.entries ?? [] : global?.entries ?? [];
  const activeSummary =
    boardMode === "daily" ? summary?.daily ?? null : summary?.global ?? null;

  return (
    <section className="leaderboard-card">
      <div className="leaderboard-header">
        <div>
          <p className="eyebrow">Community</p>
          <h2>
            {boardMode === "daily"
              ? "Daily Challenge Leaderboard"
              : "Global Leaderboard"}
          </h2>
        </div>
        <div className="leaderboard-tabs">
          <button
            type="button"
            className={boardMode === "daily" ? "is-active" : undefined}
            onClick={() => setBoardMode("daily")}
          >
            Daily Challenge
          </button>
          <button
            type="button"
            className={boardMode === "global" ? "is-active" : undefined}
            onClick={() => setBoardMode("global")}
          >
            Global
          </button>
        </div>
      </div>

      {loading ? (
        <p className="leaderboard-state">Loading leaderboard...</p>
      ) : null}

      {!loading && error ? (
        <p className="leaderboard-state">{error}</p>
      ) : null}

      {!loading && !error && activeEntries.length === 0 ? (
        <p className="leaderboard-state">
          No entries yet. Be the first to set a score.
        </p>
      ) : null}

      {!loading && !error && activeEntries.length > 0 ? (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>WPM</th>
              <th>Accuracy</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activeEntries.map((entry) => (
              <tr key={`${boardMode}-${entry.rank}-${entry.displayName}`}>
                <td>{entry.rank}</td>
                <td>{entry.displayName}</td>
                <td>{entry.wpm}</td>
                <td>{entry.accuracy}%</td>
                <td>{formatTimestamp(entry.recordedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <aside className="leaderboard-summary">
        <h3>My Rank</h3>
        {activeSummary ? (
          <p>{formatSummary(activeSummary)}</p>
        ) : (
          <p>No qualifying score yet.</p>
        )}
      </aside>
    </section>
  );
}
