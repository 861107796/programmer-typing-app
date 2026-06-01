# Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated daily and global leaderboards, plus a personal rank summary, inside the existing trainer app.

**Architecture:** Reuse the current SQLite-backed progress model instead of introducing dedicated leaderboard tables. The backend will aggregate `daily_challenge_progress` and `practice_sessions` into small leaderboard payloads, and the frontend will add an in-app `Trainer / Leaderboard` switch with a dedicated leaderboard view that fetches daily, global, and personal rank data.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Express, SQLite, cookie-based auth, Testing Library, Supertest.

---

I'm using the writing-plans skill to create the implementation plan.

## File Structure

### Backend files

- Create: `server/repositories/leaderboardRepository.ts`
  - Encapsulate leaderboard SQL for daily top 100, global top 100, and current-user rank lookups.
- Create: `server/services/leaderboardService.ts`
  - Normalize repository rows into stable API response shapes and derive display names from email prefixes.
- Create: `server/routes/leaderboard.ts`
  - Expose `GET /api/leaderboard/daily`, `GET /api/leaderboard/global`, and `GET /api/leaderboard/me`.
- Modify: `server/app.ts`
  - Instantiate the leaderboard repository/service and mount leaderboard routes under `/api/leaderboard`.
- Create: `server/test/leaderboardRoutes.test.ts`
  - Verify ranking order, top-100 limiting, authenticated access, and personal rank summaries.

### Frontend files

- Modify: `src/domain/types.ts`
  - Add typed response models for leaderboard entries and personal rank summaries.
- Create: `src/leaderboard/leaderboardApi.ts`
  - Fetch daily/global/me leaderboard payloads with cookie auth and `401` handling.
- Create: `src/components/LeaderboardView.tsx`
  - Render the leaderboard screen, internal `Daily Challenge / Global` tabs, loading/error/empty states, and `My Rank`.
- Modify: `src/App.tsx`
  - Add the top-level `Trainer / Leaderboard` switch while preserving the current auth-gated shell and `onAuthExpired` flow.
- Modify: `src/styles/app.css`
  - Style the new app-level switch, leaderboard table, summary cards, and state messages in the existing visual language.
- Modify: `src/test/renderApp.test.tsx`
  - Cover leaderboard rendering, tab switching, empty/error states, and `401` fallback to the auth screen.

### Existing files to reference during implementation

- `server/services/progressService.ts`
  - Follow its response-shaping approach and date-key usage patterns.
- `server/repositories/dailyChallengeRepository.ts`
  - Reuse its field naming when querying current-day challenge rows.
- `src/components/ProgressSidebar.tsx`
  - Match existing panel/card markup conventions for the leaderboard summary area.
- `src/components/AuthGate.tsx`
  - Reuse the existing session-expiry handoff instead of inventing a second auth-reset mechanism.

---

### Task 1: Add Backend Leaderboard Query Coverage and Repository

**Files:**
- Create: `server/repositories/leaderboardRepository.ts`
- Create: `server/test/leaderboardRoutes.test.ts`
- Reference: `server/db/init.ts`
- Reference: `server/repositories/sessionRepository.ts`
- Reference: `server/repositories/dailyChallengeRepository.ts`

- [ ] **Step 1: Write the failing leaderboard route test**

```ts
// server/test/leaderboardRoutes.test.ts
// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

async function register(agent: request.SuperAgentTest, email: string) {
  await agent.post("/api/auth/register").send({
    email,
    password: "strong-pass-123",
  });
}

describe("leaderboard routes", () => {
  it("returns a daily top 100 ordered by wpm, accuracy, and earliest completion time", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const alpha = request.agent(app);
    const beta = request.agent(app);
    const gamma = request.agent(app);

    await register(alpha, "alpha@example.com");
    await register(beta, "beta@example.com");
    await register(gamma, "gamma@example.com");

    await alpha.post("/api/sessions").send({
      mode: "daily",
      category: "technical",
      durationMs: 21000,
      totalChars: 90,
      correctChars: 88,
      errorCount: 2,
      wpm: 84,
      accuracy: 97,
      valid: true,
    });

    await beta.post("/api/sessions").send({
      mode: "daily",
      category: "technical",
      durationMs: 21000,
      totalChars: 90,
      correctChars: 89,
      errorCount: 1,
      wpm: 84,
      accuracy: 99,
      valid: true,
    });

    await gamma.post("/api/sessions").send({
      mode: "daily",
      category: "technical",
      durationMs: 19000,
      totalChars: 90,
      correctChars: 90,
      errorCount: 0,
      wpm: 92,
      accuracy: 100,
      valid: true,
    });

    const response = await gamma.get("/api/leaderboard/daily");

    expect(response.status).toBe(200);
    expect(response.body.entries.slice(0, 3)).toEqual([
      expect.objectContaining({ rank: 1, displayName: "gamma", wpm: 92, accuracy: 100 }),
      expect.objectContaining({ rank: 2, displayName: "beta", wpm: 84, accuracy: 99 }),
      expect.objectContaining({ rank: 3, displayName: "alpha", wpm: 84, accuracy: 97 }),
    ]);
  });
});
```

- [ ] **Step 2: Run the new backend leaderboard test and confirm the route does not exist yet**

Run: `npm.cmd test -- server/test/leaderboardRoutes.test.ts`

Expected: FAIL with `Cannot GET /api/leaderboard/daily` or missing leaderboard wiring.

- [ ] **Step 3: Create the repository with typed row shapes and SQL queries**

```ts
// server/repositories/leaderboardRepository.ts
import type { Database } from "sqlite";

export interface LeaderboardEntryRow {
  user_id: string;
  email: string;
  wpm: number;
  accuracy: number;
  recorded_at: string;
}

export interface LeaderboardRankRow extends LeaderboardEntryRow {
  rank: number;
}

export function createLeaderboardRepository(db: Database) {
  return {
    async listDailyTop(dateKey: string, limit = 100) {
      return db.all<LeaderboardEntryRow[]>(
        `select
           d.user_id,
           u.email,
           d.best_wpm as wpm,
           d.best_accuracy as accuracy,
           d.updated_at as recorded_at
         from daily_challenge_progress d
         join users u on u.id = d.user_id
         where d.date_key = ? and d.completed = 1
         order by d.best_wpm desc, d.best_accuracy desc, d.updated_at asc
         limit ?`,
        dateKey,
        limit,
      );
    },

    async listGlobalTop(limit = 100) {
      return db.all<LeaderboardEntryRow[]>(
        `with ranked_sessions as (
           select
             s.user_id,
             u.email,
             s.wpm,
             s.accuracy,
             s.created_at as recorded_at,
             row_number() over (
               partition by s.user_id
               order by s.wpm desc, s.accuracy desc, s.created_at asc
             ) as session_rank
           from practice_sessions s
           join users u on u.id = s.user_id
           where s.valid = 1
         )
         select user_id, email, wpm, accuracy, recorded_at
         from ranked_sessions
         where session_rank = 1
         order by wpm desc, accuracy desc, recorded_at asc
         limit ?`,
        limit,
      );
    },

    async getDailyRankForUser(userId: string, dateKey: string) {
      return (
        (await db.get<LeaderboardRankRow>(
          `with ranked_daily as (
             select
               d.user_id,
               u.email,
               d.best_wpm as wpm,
               d.best_accuracy as accuracy,
               d.updated_at as recorded_at,
               row_number() over (
                 order by d.best_wpm desc, d.best_accuracy desc, d.updated_at asc
               ) as rank
             from daily_challenge_progress d
             join users u on u.id = d.user_id
             where d.date_key = ? and d.completed = 1
           )
           select user_id, email, wpm, accuracy, recorded_at, rank
           from ranked_daily
           where user_id = ?`,
          dateKey,
          userId,
        )) ?? null
      );
    },

    async getGlobalRankForUser(userId: string) {
      return (
        (await db.get<LeaderboardRankRow>(
          `with best_sessions as (
             select
               s.user_id,
               u.email,
               s.wpm,
               s.accuracy,
               s.created_at as recorded_at,
               row_number() over (
                 partition by s.user_id
                 order by s.wpm desc, s.accuracy desc, s.created_at asc
               ) as session_rank
             from practice_sessions s
             join users u on u.id = s.user_id
             where s.valid = 1
           ),
           ranked_global as (
             select
               user_id,
               email,
               wpm,
               accuracy,
               recorded_at,
               row_number() over (
                 order by wpm desc, accuracy desc, recorded_at asc
               ) as rank
             from best_sessions
             where session_rank = 1
           )
           select user_id, email, wpm, accuracy, recorded_at, rank
           from ranked_global
           where user_id = ?`,
          userId,
        )) ?? null
      );
    },
  };
}
```

- [ ] **Step 4: Extend the backend test with global ranking and personal summary assertions**

```ts
it("returns global top scores and the signed-in user's personal ranks", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const alpha = request.agent(app);
  const beta = request.agent(app);

  await register(alpha, "alpha@example.com");
  await register(beta, "beta@example.com");

  await alpha.post("/api/sessions").send({
    mode: "mixed",
    category: "mixed",
    durationMs: 18000,
    totalChars: 90,
    correctChars: 89,
    errorCount: 1,
    wpm: 95,
    accuracy: 99,
    valid: true,
  });

  await beta.post("/api/sessions").send({
    mode: "mixed",
    category: "mixed",
    durationMs: 18000,
    totalChars: 90,
    correctChars: 90,
    errorCount: 0,
    wpm: 101,
    accuracy: 100,
    valid: true,
  });

  const globalResponse = await alpha.get("/api/leaderboard/global");
  const meResponse = await alpha.get("/api/leaderboard/me");

  expect(globalResponse.status).toBe(200);
  expect(globalResponse.body.entries.slice(0, 2)).toEqual([
    expect.objectContaining({ rank: 1, displayName: "beta", wpm: 101 }),
    expect.objectContaining({ rank: 2, displayName: "alpha", wpm: 95 }),
  ]);

  expect(meResponse.status).toBe(200);
  expect(meResponse.body).toEqual({
    daily: null,
    global: expect.objectContaining({
      rank: 2,
      displayName: "alpha",
      wpm: 95,
      accuracy: 99,
    }),
  });
});
```

- [ ] **Step 5: Run the backend test again and confirm the missing service/route layer is the only remaining failure**

Run: `npm.cmd test -- server/test/leaderboardRoutes.test.ts`

Expected: FAIL with route/service wiring still missing, not with SQL syntax or import errors.

- [ ] **Step 6: Commit the repository and failing coverage scaffold**

```powershell
git add server/repositories/leaderboardRepository.ts server/test/leaderboardRoutes.test.ts
git commit -m "test: add leaderboard query coverage"
```

### Task 2: Add Leaderboard Service and Authenticated API Endpoints

**Files:**
- Create: `server/services/leaderboardService.ts`
- Create: `server/routes/leaderboard.ts`
- Modify: `server/app.ts`
- Modify: `server/test/leaderboardRoutes.test.ts`

- [ ] **Step 1: Add failing assertions for auth protection and top-100 limiting**

```ts
it("rejects unauthenticated leaderboard requests", async () => {
  const app = await createApp({ databasePath: ":memory:" });

  const response = await request(app).get("/api/leaderboard/daily");

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ error: "Unauthorized" });
});

it("limits leaderboard responses to the top 100 entries", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const agents = await Promise.all(
    Array.from({ length: 105 }, async (_, index) => {
      const agent = request.agent(app);
      await register(agent, `dev${index}@example.com`);
      await agent.post("/api/sessions").send({
        mode: "mixed",
        category: "mixed",
        durationMs: 20000,
        totalChars: 100,
        correctChars: 100,
        errorCount: 0,
        wpm: 200 - index,
        accuracy: 100,
        valid: true,
      });
      return agent;
    }),
  );

  const response = await agents[0].get("/api/leaderboard/global");

  expect(response.status).toBe(200);
  expect(response.body.entries).toHaveLength(100);
  expect(response.body.entries[0]).toMatchObject({ rank: 1, displayName: "dev0" });
  expect(response.body.entries.at(-1)).toMatchObject({ rank: 100, displayName: "dev99" });
});
```

- [ ] **Step 2: Run the leaderboard backend test suite and confirm these new cases fail**

Run: `npm.cmd test -- server/test/leaderboardRoutes.test.ts`

Expected: FAIL with `Cannot GET /api/leaderboard/...`.

- [ ] **Step 3: Implement the service that normalizes repository rows into API payloads**

```ts
// server/services/leaderboardService.ts
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

export function createLeaderboardService(dependencies: {
  leaderboardRepository: {
    listDailyTop: (dateKey: string, limit?: number) => Promise<LeaderboardEntryRow[]>;
    listGlobalTop: (limit?: number) => Promise<LeaderboardEntryRow[]>;
    getDailyRankForUser: (userId: string, dateKey: string) => Promise<LeaderboardRankRow | null>;
    getGlobalRankForUser: (userId: string) => Promise<LeaderboardRankRow | null>;
  };
}) {
  return {
    async getDailyLeaderboard(dateKey: string) {
      const rows = await dependencies.leaderboardRepository.listDailyTop(dateKey, 100);
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
```

- [ ] **Step 4: Implement authenticated leaderboard routes and mount them in the app**

```ts
// server/routes/leaderboard.ts
import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function createLeaderboardRouter(dependencies: {
  leaderboardService: {
    getDailyLeaderboard: (dateKey: string) => Promise<unknown>;
    getGlobalLeaderboard: () => Promise<unknown>;
    getMyLeaderboardSummary: (userId: string, dateKey: string) => Promise<unknown>;
  };
}) {
  const router = Router();

  router.get("/daily", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.json(await dependencies.leaderboardService.getDailyLeaderboard(getDateKey()));
  });

  router.get("/global", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.json(await dependencies.leaderboardService.getGlobalLeaderboard());
  });

  router.get("/me", async (request: AuthenticatedRequest, response) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.json(
      await dependencies.leaderboardService.getMyLeaderboardSummary(
        request.authUserId,
        getDateKey(),
      ),
    );
  });

  return router;
}
```

```ts
// server/app.ts
import { createLeaderboardRepository } from "./repositories/leaderboardRepository";
import { createLeaderboardRouter } from "./routes/leaderboard";
import { createLeaderboardService } from "./services/leaderboardService";

const leaderboardRepository = createLeaderboardRepository(db);
const leaderboardService = createLeaderboardService({ leaderboardRepository });

app.use("/api/leaderboard", createLeaderboardRouter({ leaderboardService }));
```

- [ ] **Step 5: Run the backend leaderboard suite until daily/global/me/auth cases all pass**

Run: `npm.cmd test -- server/test/leaderboardRoutes.test.ts`

Expected: PASS for ordering, personal summary, `401`, and top-100 limiting.

- [ ] **Step 6: Commit the leaderboard backend API**

```powershell
git add server/services/leaderboardService.ts server/routes/leaderboard.ts server/app.ts server/test/leaderboardRoutes.test.ts
git commit -m "feat: add leaderboard api endpoints"
```

### Task 3: Add Frontend Leaderboard Types, API Helpers, and Core View

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/leaderboard/leaderboardApi.ts`
- Create: `src/components/LeaderboardView.tsx`
- Modify: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Write the failing frontend leaderboard rendering test**

```ts
it("renders the daily leaderboard after switching away from the trainer", async () => {
  const fetchMock = createFetchMock({
    dailyLeaderboard: {
      entries: [
        {
          rank: 1,
          displayName: "gamma",
          wpm: 92,
          accuracy: 100,
          recordedAt: "2026-05-05T10:12:00.000Z",
        },
      ],
    },
    globalLeaderboard: { entries: [] },
    myLeaderboard: {
      daily: {
        rank: 5,
        displayName: "dev",
        wpm: 74,
        accuracy: 97,
        recordedAt: "2026-05-05T10:15:00.000Z",
      },
      global: null,
    },
  });

  vi.stubGlobal("fetch", fetchMock);
  render(<App />);

  await screen.findByRole("heading", { name: /programmer typing trainer/i });
  fireEvent.click(screen.getByRole("button", { name: /leaderboard/i }));

  expect(await screen.findByRole("heading", { name: /daily challenge leaderboard/i })).toBeInTheDocument();
  expect(screen.getByText(/^gamma$/i)).toBeInTheDocument();
  expect(screen.getByText(/my rank/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the frontend test and verify the app has no leaderboard view yet**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL because there is no `Leaderboard` button or leaderboard screen.

- [ ] **Step 3: Add typed leaderboard response models and fetch helpers**

```ts
// src/domain/types.ts
export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  wpm: number;
  accuracy: number;
  recordedAt: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

export interface PersonalLeaderboardSummary {
  rank: number;
  displayName: string;
  wpm: number;
  accuracy: number;
  recordedAt: string;
}

export interface PersonalLeaderboardResponse {
  daily: PersonalLeaderboardSummary | null;
  global: PersonalLeaderboardSummary | null;
}
```

```ts
// src/leaderboard/leaderboardApi.ts
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
```

- [ ] **Step 4: Build the core leaderboard view with internal board tabs and summary cards**

```tsx
// src/components/LeaderboardView.tsx
import { useEffect, useState } from "react";

import type {
  LeaderboardResponse,
  PersonalLeaderboardResponse,
} from "../domain/types";
import {
  fetchDailyLeaderboard,
  fetchGlobalLeaderboard,
  fetchMyLeaderboardSummary,
} from "../leaderboard/leaderboardApi";

type BoardMode = "daily" | "global";

export function LeaderboardView({ onAuthExpired }: { onAuthExpired: () => void }) {
  const [boardMode, setBoardMode] = useState<BoardMode>("daily");
  const [daily, setDaily] = useState<LeaderboardResponse | null>(null);
  const [global, setGlobal] = useState<LeaderboardResponse | null>(null);
  const [summary, setSummary] = useState<PersonalLeaderboardResponse | null>(null);
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

  const activeEntries = boardMode === "daily" ? daily?.entries ?? [] : global?.entries ?? [];
  const activeSummary = boardMode === "daily" ? summary?.daily ?? null : summary?.global ?? null;

  return (
    <section className="leaderboard-card">
      <div className="leaderboard-header">
        <div>
          <p className="eyebrow">Community</p>
          <h2>{boardMode === "daily" ? "Daily Challenge Leaderboard" : "Global Leaderboard"}</h2>
        </div>
        <div className="leaderboard-tabs">
          <button type="button" onClick={() => setBoardMode("daily")}>Daily Challenge</button>
          <button type="button" onClick={() => setBoardMode("global")}>Global</button>
        </div>
      </div>

      {loading ? <p>Loading leaderboard...</p> : null}
      {!loading && error ? <p>{error}</p> : null}
      {!loading && !error && activeEntries.length === 0 ? (
        <p>No entries yet. Be the first to set a score.</p>
      ) : null}

      {!loading && !error && activeEntries.length > 0 ? (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>WPM</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {activeEntries.map((entry) => (
              <tr key={`${boardMode}-${entry.rank}-${entry.displayName}`}>
                <td>{entry.rank}</td>
                <td>{entry.displayName}</td>
                <td>{entry.wpm}</td>
                <td>{entry.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <aside className="leaderboard-summary">
        <h3>My Rank</h3>
        {activeSummary ? (
          <p>{activeSummary.rank}. {activeSummary.displayName} · {activeSummary.wpm} WPM · {activeSummary.accuracy}%</p>
        ) : (
          <p>No qualifying score yet.</p>
        )}
      </aside>
    </section>
  );
}
```

- [ ] **Step 5: Run the frontend test again and make sure the view-level rendering path passes**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS for initial leaderboard rendering while existing trainer tests still compile.

- [ ] **Step 6: Commit the core leaderboard view**

```powershell
git add src/domain/types.ts src/leaderboard/leaderboardApi.ts src/components/LeaderboardView.tsx src/test/renderApp.test.tsx
git commit -m "feat: add leaderboard view and api client"
```

### Task 4: Integrate the Leaderboard Into the App Shell and Cover Error States

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/test/renderApp.test.tsx`
- Reference: `src/components/AuthGate.tsx`

- [ ] **Step 1: Extend the frontend test with tab switching, empty state, and auth-expiry coverage**

```ts
it("switches to the global leaderboard tab and renders empty state text", async () => {
  vi.stubGlobal(
    "fetch",
    createFetchMock({
      dailyLeaderboard: { entries: [] },
      globalLeaderboard: {
        entries: [
          {
            rank: 1,
            displayName: "beta",
            wpm: 101,
            accuracy: 100,
            recordedAt: "2026-05-05T10:20:00.000Z",
          },
        ],
      },
      myLeaderboard: {
        daily: null,
        global: {
          rank: 12,
          displayName: "dev",
          wpm: 88,
          accuracy: 99,
          recordedAt: "2026-05-05T10:21:00.000Z",
        },
      },
    }),
  );

  render(<App />);
  await screen.findByRole("heading", { name: /programmer typing trainer/i });
  fireEvent.click(screen.getByRole("button", { name: /leaderboard/i }));

  expect(await screen.findByText(/no entries yet\. be the first to set a score\./i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /^global$/i }));

  expect(await screen.findByText(/^beta$/i)).toBeInTheDocument();
  expect(screen.getByText(/12\. dev · 88 WPM · 99%/i)).toBeInTheDocument();
});

it("returns to sign in when a leaderboard request comes back unauthorized", async () => {
  vi.stubGlobal(
    "fetch",
    createFetchMock({
      dailyLeaderboardStatus: 401,
    }),
  );

  render(<App />);
  await screen.findByRole("heading", { name: /programmer typing trainer/i });
  fireEvent.click(screen.getByRole("button", { name: /leaderboard/i }));

  expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  expect(screen.getByText(/session expired\. please sign in again\./i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the frontend suite and confirm the app shell still needs navigation wiring**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL because the top-level app has not yet added the `Trainer / Leaderboard` switch or leaderboard-specific fetch mock cases.

- [ ] **Step 3: Add the top-level app switch and keep auth-expiry handling shared**

```tsx
// src/App.tsx
import { useState } from "react";

import { LeaderboardView } from "./components/LeaderboardView";

type AppView = "trainer" | "leaderboard";

function TrainerApp({ onAuthExpired }: { onAuthExpired: () => void }) {
  const [view, setView] = useState<AppView>("trainer");
  const session = useTypingSession({ onAuthExpired });

  return (
    <main className="app-shell">
      <div className="dashboard">
        <section className="hero-card">
          <div className="app-switch">
            <button
              type="button"
              className={view === "trainer" ? "is-active" : undefined}
              onClick={() => setView("trainer")}
            >
              Trainer
            </button>
            <button
              type="button"
              className={view === "leaderboard" ? "is-active" : undefined}
              onClick={() => setView("leaderboard")}
            >
              Leaderboard
            </button>
          </div>

          {view === "trainer" ? (
            <>
              <p className="eyebrow">Phase 1</p>
              <h1>Programmer Typing Trainer</h1>
              <p>
                Practice code, terminal commands, and technical English with
                developer-focused feedback.
              </p>
              <ModePicker
                mode={session.mode}
                focusedCategory={session.focusedCategory}
                onModeChange={session.setMode}
                onCategoryChange={session.setFocusedCategory}
              />
              <TypingPanel
                content={session.content}
                sessionState={session.sessionState}
                result={session.result}
                onStart={session.startSession}
                onInput={session.inputCharacter}
                onBackspace={session.backspace}
              />
              {session.result ? (
                <ResultsPanel result={session.result} onNext={session.nextSession} />
              ) : null}
            </>
          ) : (
            <LeaderboardView onAuthExpired={onAuthExpired} />
          )}
        </section>
        <ProgressSidebar
          sessions={session.sessions}
          dailyChallenge={session.dailyChallenge}
          achievements={session.achievements}
          progressError={session.progressError}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Add leaderboard styling and expand the shared fetch mock for the new endpoints**

```ts
// src/test/renderApp.test.tsx
function createFetchMock(options?: {
  currentUser?: typeof defaultUser | null;
  progress?: ProgressSnapshotResponse;
  saveSessionResponse?: ProgressSnapshotResponse;
  saveSessionStatus?: number;
  dailyLeaderboard?: LeaderboardResponse;
  dailyLeaderboardStatus?: number;
  globalLeaderboard?: LeaderboardResponse;
  globalLeaderboardStatus?: number;
  myLeaderboard?: PersonalLeaderboardResponse;
  myLeaderboardStatus?: number;
}) {
  const dailyLeaderboard = options?.dailyLeaderboard ?? { entries: [] };
  const globalLeaderboard = options?.globalLeaderboard ?? { entries: [] };
  const myLeaderboard = options?.myLeaderboard ?? { daily: null, global: null };

  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === "/api/leaderboard/daily") {
      return jsonResponse(
        dailyLeaderboard,
        (options?.dailyLeaderboardStatus ?? 200) < 300,
        options?.dailyLeaderboardStatus ?? 200,
      );
    }

    if (url === "/api/leaderboard/global") {
      return jsonResponse(
        globalLeaderboard,
        (options?.globalLeaderboardStatus ?? 200) < 300,
        options?.globalLeaderboardStatus ?? 200,
      );
    }

    if (url === "/api/leaderboard/me") {
      return jsonResponse(
        myLeaderboard,
        (options?.myLeaderboardStatus ?? 200) < 300,
        options?.myLeaderboardStatus ?? 200,
      );
    }

    // keep existing auth/progress branches here
  });
}
```

```css
/* src/styles/app.css */
.app-switch {
  display: inline-flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.app-switch button.is-active,
.leaderboard-tabs button.is-active {
  background: var(--accent);
  color: var(--panel-strong);
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 0.75rem 0.5rem;
  text-align: left;
}

.leaderboard-summary {
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: rgba(8, 14, 32, 0.55);
}
```

- [ ] **Step 5: Run the full frontend suite and confirm leaderboard interactions are stable**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS for leaderboard view rendering, tab switching, empty state, and `401` auth-expiry behavior, while keeping all previous trainer tests green.

- [ ] **Step 6: Commit the app-shell integration**

```powershell
git add src/App.tsx src/styles/app.css src/test/renderApp.test.tsx
git commit -m "feat: add in-app leaderboard navigation"
```

### Task 5: Final Verification and Manual Leaderboard QA

**Files:**
- Verify: `server/test/leaderboardRoutes.test.ts`
- Verify: `src/test/renderApp.test.tsx`
- Verify: `server/app.ts`
- Verify: `src/components/LeaderboardView.tsx`

- [ ] **Step 1: Run the targeted automated verification suites**

Run: `npm.cmd test -- server/test/leaderboardRoutes.test.ts`

Expected: PASS with daily/global ordering, top-100 limiting, personal summary, and `401` coverage green.

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS with trainer flow tests plus leaderboard rendering/state tests green.

- [ ] **Step 2: Run the full project verification suite**

Run: `npm.cmd test`

Expected: PASS across backend auth, backend progress, backend leaderboard, and frontend app tests.

Run: `npm.cmd run build`

Expected: PASS and Vite production bundle completes without type or JSX errors.

Run: `npm.cmd run build:server`

Expected: PASS and server TypeScript build completes with the new repository/service/route files included.

- [ ] **Step 3: Manually validate the leaderboard flow with local servers**

Run:

```powershell
npm.cmd run dev:server
```

and in another terminal:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5175
```

Manual checks:

- sign in with two different accounts in separate browser sessions
- complete at least one `daily` challenge run on both accounts and confirm the higher WPM leads the daily board
- complete at least one high-WPM non-daily session and confirm the global board reflects the best single valid session
- open the `Leaderboard` view and switch between `Daily Challenge` and `Global`
- confirm `My Rank` still shows a useful summary when the user is not in the visible top 100
- clear the auth cookie or wait for a forced `401` path and confirm the app returns to `Sign in`

- [ ] **Step 4: Commit any verification-only cleanup if files changed**

```powershell
git add .
git commit -m "test: finalize leaderboard verification"
```

Skip this commit if verification did not change tracked files.
