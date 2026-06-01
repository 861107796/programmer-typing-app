# Cloud Progress Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace authenticated users' local-only progress with backend-backed practice session, achievement, and daily challenge persistence.

**Architecture:** Extend the existing Express + SQLite backend with a dedicated progress domain that owns session rows and derived progress state. Update the React trainer to bootstrap progress from `/api/progress` and to submit completed sessions to `/api/sessions`, using server-confirmed responses as the UI source of truth.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Express, SQLite, cookie-based auth, existing session scoring and achievement rules.

---

## File Structure

### Backend files

- Modify: `server/db/init.ts`
  - Add `practice_sessions`, `user_achievements`, and `daily_challenge_progress` schema creation.
- Create: `server/repositories/sessionRepository.ts`
  - Insert and list recent practice sessions.
- Create: `server/repositories/achievementRepository.ts`
  - Load and upsert per-user achievement state.
- Create: `server/repositories/dailyChallengeRepository.ts`
  - Load and upsert the current user's daily challenge row.
- Create: `server/services/progressService.ts`
  - Orchestrate `GET /api/progress` and `POST /api/sessions`, including derived updates.
- Create: `server/routes/progress.ts`
  - Wire authenticated progress routes.
- Modify: `server/app.ts`
  - Create repositories, mount `/api/progress`, `/api/sessions`, `/api/achievements`, `/api/daily-challenge`.
- Modify: `server/test/authRoutes.test.ts`
  - Keep auth tests green after app wiring changes.
- Create: `server/test/progressRoutes.test.ts`
  - Cover progress bootstrap, session save, `401`, and derived updates.

### Shared/frontend files

- Modify: `src/domain/types.ts`
  - Add backend-facing progress snapshot types and persisted achievement shapes.
- Create: `src/progress/progressApi.ts`
  - Fetch progress snapshot and submit sessions.
- Create: `src/progress/progressMappers.ts`
  - Convert backend payloads into the frontend state shapes used by the sidebar and hook.
- Modify: `src/hooks/useTypingSession.ts`
  - Replace local storage bootstrapping and writes with backend-backed progress sync.
- Modify: `src/components/ProgressSidebar.tsx`
  - Ensure empty/loading/backend-backed states render correctly.
- Modify: `src/test/renderApp.test.tsx`
  - Add mocked `/api/progress` and `/api/sessions` behavior for authenticated flows.
- Modify: `src/progress/storage.ts`
  - Reduce this module to non-authoritative fallback or remove authenticated progress writes from its usage.

### Documentation and config

- Optional modify: `.gitignore`
  - If local SQLite progress data path changes, keep generated files ignored.

---

### Task 1: Add Backend Progress Schema and Repository Tests

**Files:**
- Modify: `server/db/init.ts`
- Create: `server/repositories/sessionRepository.ts`
- Create: `server/repositories/achievementRepository.ts`
- Create: `server/repositories/dailyChallengeRepository.ts`
- Create: `server/test/progressRoutes.test.ts`

- [ ] **Step 1: Write the failing backend progress test**

```ts
// server/test/progressRoutes.test.ts
// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("progress bootstrap", () => {
  it("returns an empty progress snapshot for a newly registered user", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "progress@example.com",
      password: "strong-pass-123",
    });

    const response = await agent.get("/api/progress");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sessions: [],
      achievements: [],
      dailyChallenge: null,
    });
  });
});
```

- [ ] **Step 2: Run the backend progress test to verify it fails**

Run: `npm.cmd test -- server/test/progressRoutes.test.ts`

Expected: FAIL with `Cannot GET /api/progress` or missing progress route/schema support.

- [ ] **Step 3: Add schema creation for progress tables**

```ts
// server/db/init.ts
await db.exec(`
  CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    total_chars INTEGER NOT NULL,
    correct_chars INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    wpm INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    valid INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_achievements (
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    progress INTEGER NOT NULL,
    unlocked INTEGER NOT NULL,
    unlocked_at TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, achievement_id)
  );

  CREATE TABLE IF NOT EXISTS daily_challenge_progress (
    user_id TEXT NOT NULL,
    date_key TEXT NOT NULL,
    challenge_id TEXT NOT NULL,
    completed INTEGER NOT NULL,
    best_wpm INTEGER NOT NULL,
    best_accuracy INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, date_key)
  );
`);
```

- [ ] **Step 4: Add minimal repository interfaces for loading empty state**

```ts
// server/repositories/sessionRepository.ts
export function createSessionRepository(db: Database) {
  return {
    async listRecentByUser(userId: string) {
      return db.all(
        `SELECT * FROM practice_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
        userId,
      );
    },
  };
}
```

```ts
// server/repositories/achievementRepository.ts
export function createAchievementRepository(db: Database) {
  return {
    async listByUser(userId: string) {
      return db.all(
        `SELECT * FROM user_achievements WHERE user_id = ? ORDER BY achievement_id ASC`,
        userId,
      );
    },
  };
}
```

```ts
// server/repositories/dailyChallengeRepository.ts
export function createDailyChallengeRepository(db: Database) {
  return {
    async getByUserAndDate(userId: string, dateKey: string) {
      return (
        (await db.get(
          `SELECT * FROM daily_challenge_progress WHERE user_id = ? AND date_key = ?`,
          userId,
          dateKey,
        )) ?? null
      );
    },
  };
}
```

- [ ] **Step 5: Run the backend test again and confirm the route is still the next failure**

Run: `npm.cmd test -- server/test/progressRoutes.test.ts`

Expected: FAIL with route/service wiring still missing, but no schema or import errors.

- [ ] **Step 6: Commit the schema and repository groundwork**

```powershell
git add server/db/init.ts server/repositories/sessionRepository.ts server/repositories/achievementRepository.ts server/repositories/dailyChallengeRepository.ts server/test/progressRoutes.test.ts
git commit -m "feat: add progress persistence schema"
```

### Task 2: Add Progress Service and Authenticated Progress Routes

**Files:**
- Create: `server/services/progressService.ts`
- Create: `server/routes/progress.ts`
- Modify: `server/app.ts`
- Modify: `server/test/progressRoutes.test.ts`

- [ ] **Step 1: Extend the failing test to cover authenticated session save**

```ts
it("saves a completed session and returns updated progress", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const agent = request.agent(app);

  await agent.post("/api/auth/register").send({
    email: "save@example.com",
    password: "strong-pass-123",
  });

  const response = await agent.post("/api/sessions").send({
    mode: "mixed",
    category: "mixed",
    durationMs: 42000,
    totalChars: 120,
    correctChars: 118,
    errorCount: 2,
    wpm: 67,
    accuracy: 98,
    valid: true,
  });

  expect(response.status).toBe(201);
  expect(response.body.sessions).toHaveLength(1);
  expect(response.body.sessions[0]).toMatchObject({
    mode: "mixed",
    category: "mixed",
    wpm: 67,
  });
});
```

- [ ] **Step 2: Run the backend test and verify it fails on missing route logic**

Run: `npm.cmd test -- server/test/progressRoutes.test.ts`

Expected: FAIL with `Cannot POST /api/sessions`.

- [ ] **Step 3: Add the progress service with a minimal snapshot and save flow**

```ts
// server/services/progressService.ts
export function createProgressService(deps: {
  sessionRepository: SessionRepository;
  achievementRepository: AchievementRepository;
  dailyChallengeRepository: DailyChallengeRepository;
}) {
  return {
    async getProgressSnapshot(userId: string, dateKey: string) {
      const [sessions, achievements, dailyChallenge] = await Promise.all([
        deps.sessionRepository.listRecentByUser(userId),
        deps.achievementRepository.listByUser(userId),
        deps.dailyChallengeRepository.getByUserAndDate(userId, dateKey),
      ]);

      return { sessions, achievements, dailyChallenge };
    },

    async saveSession(userId: string, input: PersistedSessionInput, dateKey: string) {
      await deps.sessionRepository.create(userId, input);
      return this.getProgressSnapshot(userId, dateKey);
    },
  };
}
```

- [ ] **Step 4: Add authenticated progress routes**

```ts
// server/routes/progress.ts
router.get("/", async (request, response) => {
  if (!request.authUserId) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  response.json(await progressService.getProgressSnapshot(request.authUserId, getDateKey()));
});

router.post("/sessions", async (request, response) => {
  if (!request.authUserId) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const snapshot = await progressService.saveSession(request.authUserId, request.body, getDateKey());
  response.status(201).json(snapshot);
});
```

- [ ] **Step 5: Mount the progress router in the app**

```ts
// server/app.ts
const progressRouter = createProgressRouter({
  progressService,
});

app.use("/api/progress", progressRouter);
app.use("/api", progressRouter);
```

and define the router endpoints as:

```ts
router.get("/progress", ...);
router.post("/sessions", ...);
router.get("/sessions", ...);
router.get("/achievements", ...);
router.get("/daily-challenge", ...);
```

- [ ] **Step 6: Run the backend progress tests until the snapshot and save cases pass**

Run: `npm.cmd test -- server/test/progressRoutes.test.ts`

Expected: PASS for empty snapshot and basic session save.

- [ ] **Step 7: Commit the progress service and route wiring**

```powershell
git add server/services/progressService.ts server/routes/progress.ts server/app.ts server/test/progressRoutes.test.ts
git commit -m "feat: add progress snapshot and session APIs"
```

### Task 3: Persist Derived Achievements and Daily Challenge State on Session Save

**Files:**
- Modify: `server/services/progressService.ts`
- Modify: `server/repositories/sessionRepository.ts`
- Modify: `server/repositories/achievementRepository.ts`
- Modify: `server/repositories/dailyChallengeRepository.ts`
- Create or reuse logic from: `src/progress/achievementRules.ts`
- Modify: `server/test/progressRoutes.test.ts`

- [ ] **Step 1: Write the failing backend test for derived updates**

```ts
it("updates achievements and daily challenge when saving a session", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const agent = request.agent(app);

  await agent.post("/api/auth/register").send({
    email: "derived@example.com",
    password: "strong-pass-123",
  });

  const response = await agent.post("/api/sessions").send({
    mode: "daily",
    category: "technical",
    durationMs: 20000,
    totalChars: 80,
    correctChars: 79,
    errorCount: 1,
    wpm: 80,
    accuracy: 99,
    valid: true,
  });

  expect(response.body.achievements.length).toBeGreaterThan(0);
  expect(response.body.dailyChallenge).toMatchObject({
    completed: true,
    bestWpm: 80,
    bestAccuracy: 99,
  });
});
```

- [ ] **Step 2: Run the backend test to verify derived state is still missing**

Run: `npm.cmd test -- server/test/progressRoutes.test.ts`

Expected: FAIL because `achievements` remain empty and `dailyChallenge` remains null.

- [ ] **Step 3: Add session insert and derived repository upserts**

```ts
// server/repositories/sessionRepository.ts
async create(userId: string, input: PersistedSessionInput) {
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  await db.run(
    `INSERT INTO practice_sessions (
      id, user_id, mode, category, duration_ms, total_chars,
      correct_chars, error_count, wpm, accuracy, valid, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    userId,
    input.mode,
    input.category,
    input.durationMs,
    input.totalChars,
    input.correctChars,
    input.errorCount,
    input.wpm,
    input.accuracy,
    input.valid ? 1 : 0,
    record.createdAt,
  );

  return { ...record, userId, ...input };
}
```

```ts
// server/repositories/dailyChallengeRepository.ts
async upsert(result: DailyChallengeRecord) {
  await db.run(
    `INSERT INTO daily_challenge_progress (
      user_id, date_key, challenge_id, completed, best_wpm, best_accuracy, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date_key) DO UPDATE SET
      completed = excluded.completed,
      best_wpm = MAX(best_wpm, excluded.best_wpm),
      best_accuracy = MAX(best_accuracy, excluded.best_accuracy),
      updated_at = excluded.updated_at`,
    result.userId,
    result.dateKey,
    result.challengeId,
    result.completed ? 1 : 0,
    result.bestWpm,
    result.bestAccuracy,
    result.updatedAt,
  );
}
```

- [ ] **Step 4: Evaluate achievements and daily challenge state inside the service**

```ts
// server/services/progressService.ts
const nextAchievements = evaluateAchievements(currentAchievements, {
  mode: input.mode,
  category: input.category,
  durationMs: input.durationMs,
  totalChars: input.totalChars,
  correctChars: input.correctChars,
  errorCount: input.errorCount,
  wpm: input.wpm,
  accuracy: input.accuracy,
  valid: input.valid,
});

await achievementRepository.replaceForUser(userId, nextAchievements);

if (input.mode === "daily") {
  await dailyChallengeRepository.upsert({
    userId,
    dateKey,
    challengeId: currentDailyChallengeId,
    completed: true,
    bestWpm: input.wpm,
    bestAccuracy: input.accuracy,
    updatedAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 5: Run the backend progress suite and make sure derived updates pass**

Run: `npm.cmd test -- server/test/progressRoutes.test.ts`

Expected: PASS for session save plus derived achievement and daily challenge assertions.

- [ ] **Step 6: Commit the derived progress update logic**

```powershell
git add server/services/progressService.ts server/repositories/sessionRepository.ts server/repositories/achievementRepository.ts server/repositories/dailyChallengeRepository.ts server/test/progressRoutes.test.ts
git commit -m "feat: persist achievements and daily challenge progress"
```

### Task 4: Add Frontend Progress API and Bootstrap From the Backend

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/progress/progressApi.ts`
- Create: `src/progress/progressMappers.ts`
- Modify: `src/hooks/useTypingSession.ts`
- Modify: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Write the failing frontend bootstrap test**

```ts
it("hydrates sidebar progress from /api/progress after login", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          id: "u1",
          email: "dev@example.com",
          createdAt: "2026-05-05T10:00:00.000Z",
        },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sessions: [{ mode: "mixed", category: "mixed", wpm: 75, accuracy: 99, errorCount: 1, durationMs: 20000, totalChars: 80, correctChars: 79, valid: true }],
        achievements: [{ id: "first-clean-run", progress: 1, unlocked: true, unlockedAt: "2026-05-05T10:01:00.000Z" }],
        dailyChallenge: { dateKey: "2026-05-05", challengeId: "technical-api-001", completed: true, bestWpm: 75, bestAccuracy: 99 },
      }),
    });

  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  expect(await screen.findByText(/1 unlocked/i)).toBeInTheDocument();
  expect(screen.getByText(/75 wpm/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the frontend test and verify it fails**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL because the app never calls `/api/progress` and still relies on local storage.

- [ ] **Step 3: Add typed progress API helpers**

```ts
// src/progress/progressApi.ts
export async function fetchProgressSnapshot() {
  const response = await fetch("/api/progress", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Progress bootstrap failed: ${response.status}`);
  }

  return response.json() as Promise<ProgressSnapshotResponse>;
}

export async function saveCompletedSession(input: SessionResult) {
  const response = await fetch("/api/sessions", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Session sync failed: ${response.status}`);
  }

  return response.json() as Promise<ProgressSnapshotResponse>;
}
```

- [ ] **Step 4: Replace local progress initialization in the hook with backend bootstrap**

```ts
// src/hooks/useTypingSession.ts
useEffect(() => {
  let cancelled = false;

  fetchProgressSnapshot()
    .then((snapshot) => {
      if (cancelled) {
        return;
      }

      setSessions(snapshot.sessions);
      setAchievements(mapAchievementSnapshot(snapshot.achievements));
      setDailyChallenge(snapshot.dailyChallenge);
    })
    .catch((error) => {
      setProgressError(error instanceof Error ? error.message : "Progress bootstrap failed");
    });

  return () => {
    cancelled = true;
  };
}, []);
```

- [ ] **Step 5: Run the frontend test again and confirm the bootstrap path passes**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS for progress hydration and existing auth-gated render behavior.

- [ ] **Step 6: Commit the frontend progress bootstrap**

```powershell
git add src/domain/types.ts src/progress/progressApi.ts src/progress/progressMappers.ts src/hooks/useTypingSession.ts src/test/renderApp.test.tsx
git commit -m "feat: bootstrap trainer progress from backend"
```

### Task 5: Sync Completed Sessions Back to the Server and Handle Expired Auth

**Files:**
- Modify: `src/hooks/useTypingSession.ts`
- Modify: `src/components/ProgressSidebar.tsx`
- Modify: `src/components/AuthGate.tsx`
- Modify: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Write the failing frontend session sync test**

```ts
it("posts completed sessions and updates sidebar data from the backend response", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: "u1", email: "dev@example.com", createdAt: "2026-05-05T10:00:00.000Z" } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ sessions: [], achievements: [], dailyChallenge: null }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sessions: [{ mode: "mixed", category: "mixed", wpm: 88, accuracy: 100, errorCount: 0, durationMs: 15000, totalChars: 75, correctChars: 75, valid: true }],
        achievements: [{ id: "speed-runner", progress: 1, unlocked: true, unlockedAt: "2026-05-05T10:03:00.000Z" }],
        dailyChallenge: null,
      }),
    });

  vi.stubGlobal("fetch", fetchMock);
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /start practice/i }));
  fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "technical" },
  });

  const promptLabel =
    screen
      .getByTestId("prompt-text")
      .closest("section")
      ?.querySelector("h2")
      ?.textContent ?? "";
  const prompt = getPromptByLabel(promptLabel);
  const textbox = screen.getByRole("textbox", { name: /typing input/i });
  typePrompt(textbox, prompt);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    "/api/sessions",
    expect.objectContaining({ method: "POST" }),
  ));
});
```

- [ ] **Step 2: Run the frontend test and verify it fails on missing POST sync**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL because completed sessions are still written to local storage only.

- [ ] **Step 3: Replace local writes with `saveCompletedSession`**

```ts
// src/hooks/useTypingSession.ts
useEffect(() => {
  if (!completedResult || !content || !sessionState.completedAt) {
    return;
  }

  const resultKey = `${content.id}:${sessionState.completedAt}`;
  if (savedResultKey.current === resultKey) {
    return;
  }

  savedResultKey.current = resultKey;
  setLatestResult(completedResult);

  saveCompletedSession(completedResult)
    .then((snapshot) => {
      setSessions(snapshot.sessions);
      setAchievements(mapAchievementSnapshot(snapshot.achievements));
      setDailyChallenge(snapshot.dailyChallenge);
    })
    .catch((error) => {
      if (isUnauthorizedProgressError(error)) {
        onAuthExpired();
        return;
      }

      setProgressError(error instanceof Error ? error.message : "Session sync failed");
    });
}, [completedResult, content, sessionState.completedAt]);
```

- [ ] **Step 4: Add visible sync error and expired-session handling**

```tsx
// src/components/ProgressSidebar.tsx
{progressError ? <p className="sidebar-error">{progressError}</p> : null}
```

```tsx
// src/components/AuthGate.tsx
const { user, setUser, loading, error, setError } = useAuth();

const handleExpiredSession = () => {
  setError("Session expired. Please sign in again.");
  setUser(null);
};
```

Pass `handleExpiredSession` into the trainer subtree through a prop or context so the progress hook can force a return to the auth form on `401`.

- [ ] **Step 5: Run the focused frontend test, then the full suite**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS for POST sync, sidebar update, and expired-auth fallback behavior.

Run: `npm.cmd test`

Expected: PASS for all backend and frontend tests together.

- [ ] **Step 6: Commit the completed-session sync path**

```powershell
git add src/hooks/useTypingSession.ts src/components/ProgressSidebar.tsx src/components/AuthGate.tsx src/test/renderApp.test.tsx
git commit -m "feat: sync completed sessions to backend"
```

### Task 6: Final Verification and Cleanup

**Files:**
- Modify as needed: `.gitignore`
- Verify: `server/test/progressRoutes.test.ts`
- Verify: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Add any generated progress data paths to `.gitignore` if needed**

```gitignore
data/
dist-server/
.codex-logs/
```

Only add `.codex-logs/` if the team wants local run logs ignored in this repo. If not, leave it out.

- [ ] **Step 2: Run the full verification suite**

Run: `npm.cmd test`
Expected: PASS with backend auth tests, backend progress tests, and frontend render tests all green.

Run: `npm.cmd run build`
Expected: PASS and Vite production bundle completes.

Run: `npm.cmd run build:server`
Expected: PASS and server TypeScript build completes.

- [ ] **Step 3: Manually verify the signed-in progress flow**

Run:

```powershell
npm.cmd run dev:server
```

and in another terminal:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5175
```

Manual checks:

- register a new user
- confirm the sidebar starts empty
- complete several sessions
- refresh and confirm sessions persist
- confirm at least one achievement persists
- confirm daily challenge status persists
- log out and log back in to confirm the same progress returns

- [ ] **Step 4: Commit the final cleanup if any verification-related file changed**

```powershell
git add .gitignore
git commit -m "chore: finalize cloud progress sync verification"
```

Skip this commit if verification did not require file changes.
