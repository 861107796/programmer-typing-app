# Database-Backed Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the trainer from split static/database prompt sources to a fully database-backed content system, including seed migration, backend queue APIs, and frontend session loading.

**Architecture:** Seed the existing static library into `content_items` when the database is empty, then introduce backend session queue APIs for `mixed` and `focused` modes so the frontend consumes database content for every training path. Keep `Daily Challenge` database-backed, remove static runtime fallbacks, and only delete the static prompt runtime code after the database path is verified.

**Tech Stack:** React, TypeScript, Vite, Express, SQLite, Vitest, Testing Library

---

### Task 1: Add database seed coverage for `content_items`

**Files:**
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\test\adminRoutes.test.ts`
- Modify later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\app.ts`
- Modify later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\repositories\contentRepository.ts`

- [ ] **Step 1: Write the failing seed test**

Add this test near the top of `server/test/adminRoutes.test.ts`:

```ts
  it("seeds the content table from the legacy prompt library when the database is empty", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const signUp = await request(app).post("/api/auth/register").send({
      email: "seed@example.com",
      password: "supersecret123",
    });

    const cookie = signUp.headers["set-cookie"];
    const response = await request(app)
      .get("/api/admin/content")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(100);
    expect(response.body.items.some((item: { label: string }) => item.label === "Typed formatter")).toBe(true);
  });
```

- [ ] **Step 2: Run the targeted test to verify current behavior**

Run:

```powershell
npm.cmd test -- server/test/adminRoutes.test.ts
```

Expected: FAIL if the empty in-memory database does not yet receive the legacy prompt set.

- [ ] **Step 3: Add repository count support**

Extend `server/repositories/contentRepository.ts` with a count method:

```ts
    async count() {
      const row =
        (await db.get<{ count: number }>(
          `select count(*) as count from content_items`,
        )) ?? { count: 0 };

      return row.count;
    },
```

- [ ] **Step 4: Re-run the targeted test**

Run:

```powershell
npm.cmd test -- server/test/adminRoutes.test.ts
```

Expected: still FAIL, but now only because seeding logic has not been implemented.

- [ ] **Step 5: Commit the repository support**

```powershell
git add server/repositories/contentRepository.ts server/test/adminRoutes.test.ts
git commit -m "test: cover empty content database seeding"
```

### Task 2: Implement startup seeding from the legacy prompt set

**Files:**
- Create: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\seed\legacyContent.ts`
- Create: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\seed\seedLegacyContent.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\app.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\repositories\contentRepository.ts`

- [ ] **Step 1: Create the legacy content snapshot module**

Create `server/seed/legacyContent.ts` with this structure:

```ts
import { getAllContent } from "../../src/content/contentLibrary";

export type LegacySeedItem = ReturnType<typeof getAllContent>[number];

export function getLegacySeedContent(): LegacySeedItem[] {
  return getAllContent();
}
```

- [ ] **Step 2: Create the seed runner**

Create `server/seed/seedLegacyContent.ts`:

```ts
import { getLegacySeedContent } from "./legacyContent";

export async function seedLegacyContentIfEmpty(contentRepository: {
  count: () => Promise<number>;
  create: (input: {
    category: string;
    topic: string;
    difficulty: string;
    length: string;
    label: string;
    prompt: string;
    isActive: boolean;
  }) => Promise<unknown>;
}) {
  const count = await contentRepository.count();

  if (count > 0) {
    return { seeded: false, inserted: 0 };
  }

  const items = getLegacySeedContent();

  for (const item of items) {
    await contentRepository.create({
      category: item.category,
      topic: item.topic,
      difficulty: item.difficulty,
      length: item.length,
      label: item.label,
      prompt: item.prompt,
      isActive: true,
    });
  }

  return { seeded: true, inserted: items.length };
}
```

- [ ] **Step 3: Wire the seed into application startup**

In `server/app.ts`, after `contentRepository` is created and before routers are mounted, add:

```ts
import { seedLegacyContentIfEmpty } from "./seed/seedLegacyContent";
```

Then inside `createApp(...)`:

```ts
  const seedResult = await seedLegacyContentIfEmpty(contentRepository);
  if (seedResult.seeded) {
    console.log(
      `[content-seed] inserted ${seedResult.inserted} legacy prompts into content_items`,
    );
  } else {
    console.log("[content-seed] skipped legacy seed because content_items is not empty");
  }
```

- [ ] **Step 4: Run the targeted test to verify the seed path now passes**

Run:

```powershell
npm.cmd test -- server/test/adminRoutes.test.ts
```

Expected: PASS for the new seed test and the existing admin route tests.

- [ ] **Step 5: Commit the seed implementation**

```powershell
git add server/app.ts server/repositories/contentRepository.ts server/seed/legacyContent.ts server/seed/seedLegacyContent.ts server/test/adminRoutes.test.ts
git commit -m "feat: seed database content from legacy prompts"
```

### Task 3: Add backend session queue API coverage

**Files:**
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\test\adminRoutes.test.ts`
- Create later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\test\contentRoutes.test.ts`
- Modify later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\routes\content.ts`
- Modify later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\services\contentService.ts`

- [ ] **Step 1: Add a dedicated content routes test file**

Create `server/test/contentRoutes.test.ts`:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("content routes", () => {
  it("returns a mixed session queue from database content", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const response = await request(app).get("/api/content/session?mode=mixed");

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items.every((item: { isActive?: boolean }) => item.isActive !== false)).toBe(true);
  });

  it("returns a focused session queue filtered by category", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const response = await request(app).get(
      "/api/content/session?mode=focused&category=command",
    );

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items.every((item: { category: string }) => item.category === "command")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the new test file to verify it fails**

Run:

```powershell
npm.cmd test -- server/test/contentRoutes.test.ts
```

Expected: FAIL because `/api/content/session` does not exist yet.

- [ ] **Step 3: Commit the failing API contract test**

```powershell
git add server/test/contentRoutes.test.ts
git commit -m "test: define content session api behavior"
```

### Task 4: Implement backend queue retrieval for `mixed` and `focused`

**Files:**
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\repositories\contentRepository.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\services\contentService.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\routes\content.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\test\contentRoutes.test.ts`

- [ ] **Step 1: Add repository helpers for active content retrieval**

In `server/repositories/contentRepository.ts`, add:

```ts
    async listActive() {
      return db.all<ContentRecord[]>(
        `select * from content_items where is_active = 1 order by updated_at desc, label asc`,
      );
    },

    async listActiveByCategory(category: string) {
      return db.all<ContentRecord[]>(
        `select * from content_items
         where is_active = 1 and category = ?
         order by updated_at desc, label asc`,
        category,
      );
    },
```

- [ ] **Step 2: Add queue-building methods to the content service**

In `server/services/contentService.ts`, add a local shuffle helper and new service methods:

```ts
function shuffleItems<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}
```

```ts
    async getSessionContent(mode: "mixed" | "focused", category?: string) {
      if (mode === "focused") {
        if (!category) {
          throw new Error("Focused mode requires category");
        }

        const items = await dependencies.contentRepository.listActiveByCategory(
          category,
        );

        return { items: shuffleItems(items).map(mapContentRecord) };
      }

      const items = await dependencies.contentRepository.listActive();
      return { items: shuffleItems(items).map(mapContentRecord).slice(0, 6) };
    },
```

- [ ] **Step 3: Expose the route in `server/routes/content.ts`**

Add:

```ts
  router.get("/session", async (request, response) => {
    try {
      const mode =
        request.query.mode === "focused" ? "focused" : "mixed";
      const category =
        typeof request.query.category === "string"
          ? request.query.category
          : undefined;

      response.json(
        await dependencies.contentService.getSessionContent(mode, category),
      );
    } catch (error) {
      const message = (error as Error).message;
      response
        .status(message === "Focused mode requires category" ? 400 : 500)
        .json({ error: message });
    }
  });
```

- [ ] **Step 4: Run the content route tests to verify green**

Run:

```powershell
npm.cmd test -- server/test/contentRoutes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the backend queue API**

```powershell
git add server/repositories/contentRepository.ts server/services/contentService.ts server/routes/content.ts server/test/contentRoutes.test.ts
git commit -m "feat: add database-backed content session api"
```

### Task 5: Add frontend API coverage for backend session queues

**Files:**
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\test\renderApp.test.tsx`
- Create later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\contentApi.ts`
- Modify later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\hooks\useTypingSession.ts`

- [ ] **Step 1: Extend the fetch mock for `/api/content/session`**

Add these options to `createFetchMock(...)` in `src/test/renderApp.test.tsx`:

```ts
  mixedSessionItems?: { items: BackendDailyChallengeResponse["content"][] };
  focusedSessionItems?: { items: BackendDailyChallengeResponse["content"][] };
```

And handle requests with:

```ts
    if (url.startsWith("/api/content/session?mode=mixed")) {
      return jsonResponse(options?.mixedSessionItems ?? { items: [] });
    }

    if (url.startsWith("/api/content/session?mode=focused")) {
      return jsonResponse(options?.focusedSessionItems ?? { items: [] });
    }
```

- [ ] **Step 2: Add a failing mixed-mode integration test**

Add:

```ts
  it("loads mixed mode prompts from the backend session api", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        mixedSessionItems: {
          items: [
            {
              id: "db-mixed-1",
              category: "code",
              topic: "typescript",
              difficulty: "medium",
              length: "short",
              label: "DB mixed prompt",
              prompt: "const total = prices.reduce((sum, price) => sum + price, 0);",
            },
          ],
        },
      }),
    );

    render(<App />);

    await screen.findByRole("heading", { name: /programmer typing trainer/i });
    expect(await screen.findByText(/db mixed prompt/i)).toBeInTheDocument();
  });
```

- [ ] **Step 3: Add a failing focused-mode integration test**

Add:

```ts
  it("loads focused prompts from the backend session api when the category changes", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        focusedSessionItems: {
          items: [
            {
              id: "db-focused-1",
              category: "command",
              topic: "git",
              difficulty: "medium",
              length: "short",
              label: "DB focused prompt",
              prompt: "git fetch origin feature/database-content",
            },
          ],
        },
      }),
    );

    render(<App />);

    await screen.findByRole("heading", { name: /programmer typing trainer/i });
    fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "command" },
    });

    expect(await screen.findByText(/db focused prompt/i)).toBeInTheDocument();
  });
```

- [ ] **Step 4: Run the frontend test file to verify red**

Run:

```powershell
npm.cmd test -- src/test/renderApp.test.tsx
```

Expected: FAIL because `useTypingSession` still reads static mixed/focused content.

- [ ] **Step 5: Commit the failing frontend contract tests**

```powershell
git add src/test/renderApp.test.tsx
git commit -m "test: define database-backed trainer content loading"
```

### Task 6: Move frontend mixed/focused session loading to backend APIs

**Files:**
- Create: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\contentApi.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\hooks\useTypingSession.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\domain\types.ts`
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\test\renderApp.test.tsx`

- [ ] **Step 1: Create the frontend content API module**

Create `src/content/contentApi.ts`:

```ts
import type { BackendDailyChallengeResponse, ContentItem, PracticeCategory } from "../domain/types";

async function parseContentResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Content request failed");
  }

  return payload as T;
}

export async function fetchSessionContent(
  mode: "mixed" | "focused",
  category?: PracticeCategory,
): Promise<{ items: ContentItem[] }> {
  const query =
    mode === "focused"
      ? `/api/content/session?mode=focused&category=${encodeURIComponent(category ?? "")}`
      : "/api/content/session?mode=mixed";

  const response = await fetch(query);
  return parseContentResponse<{ items: ContentItem[] }>(response);
}

export async function fetchBackendDailyChallenge() {
  const response = await fetch("/api/content/daily-challenge");
  return parseContentResponse<BackendDailyChallengeResponse>(response);
}
```

- [ ] **Step 2: Replace static queue construction in `useTypingSession.ts`**

Refactor `useTypingSession.ts` so:

- remove imports from `../content/contentLibrary`
- import `fetchSessionContent` and `fetchBackendDailyChallenge` from `../content/contentApi`
- initialize `promptQueue` as `[]`
- add a loading effect for `mixed` and `focused`

Use this shape:

```ts
  useEffect(() => {
    if (mode === "daily") {
      return;
    }

    let cancelled = false;

    fetchSessionContent(
      mode === "focused" ? "focused" : "mixed",
      mode === "focused" ? focusedCategory : undefined,
    )
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setPromptQueue(payload.items);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setLatestResult(null);
        savedResultKey.current = null;
        setProgressError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "AUTH_EXPIRED") {
          onAuthExpired();
          return;
        }

        setPromptQueue([]);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
        setProgressError(
          error instanceof Error ? error.message : "Content queue fetch failed",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [focusedCategory, mode, onAuthExpired]);
```

For the daily-mode effect, keep the backend daily challenge fetch but remove the static fallback:

```ts
        setPromptQueue([payload.content]);
        setQueueIndex(0);
        setSessionState(createSessionState(""));
```

- [ ] **Step 3: Update queue refresh logic after completion and skip**

Replace any `getQueueForMode(...)` usage in completion and skip logic with new backend fetches when the queue is exhausted:

```ts
    if (nextIndex < promptQueue.length) {
      const nextContent = promptQueue[nextIndex] ?? null;
      if (nextContent) {
        setQueueIndex(nextIndex);
        setSessionState(createSessionState(nextContent.prompt));
      }
      return;
    }

    if (mode === "daily") {
      void fetchBackendDailyChallenge().then((payload) => {
        setBackendDailyChallenge(payload);
        setPromptQueue([payload.content]);
        setQueueIndex(0);
        setSessionState(createSessionState(payload.content.prompt));
      });
      return;
    }

    void fetchSessionContent(
      mode === "focused" ? "focused" : "mixed",
      mode === "focused" ? focusedCategory : undefined,
    ).then((payload) => {
      setPromptQueue(payload.items);
      setQueueIndex(0);
      if (payload.items[0]) {
        setSessionState(createSessionState(payload.items[0].prompt));
      }
    });
```

- [ ] **Step 4: Run the frontend test file to verify green**

Run:

```powershell
npm.cmd test -- src/test/renderApp.test.tsx
```

Expected: PASS, including the new mixed/focused backend-loading tests.

- [ ] **Step 5: Commit the frontend runtime switch**

```powershell
git add src/content/contentApi.ts src/hooks/useTypingSession.ts src/domain/types.ts src/test/renderApp.test.tsx
git commit -m "feat: load trainer prompts from backend content apis"
```

### Task 7: Add explicit empty-state handling for database-backed trainer queues

**Files:**
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\test\renderApp.test.tsx`
- Modify later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\App.tsx`
- Modify later: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\components\TypingPanel.tsx`

- [ ] **Step 1: Add a failing empty-state test**

Add:

```ts
  it("shows an empty state when the backend returns no focused prompts for a category", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        focusedSessionItems: { items: [] },
      }),
    );

    render(<App />);

    await screen.findByRole("heading", { name: /programmer typing trainer/i });
    fireEvent.click(screen.getByRole("button", { name: /^focused$/i }));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "command" },
    });

    expect(
      await screen.findByText(/no practice content available for this mode right now\./i),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the frontend test file to verify it fails**

Run:

```powershell
npm.cmd test -- src/test/renderApp.test.tsx
```

Expected: FAIL if the trainer still renders no clear empty message for an empty database queue.

- [ ] **Step 3: Render a clear trainer empty state**

In `src/App.tsx`, near the trainer panel render, ensure an explicit message is shown when `content` is null:

```tsx
              {content ? (
                <TypingPanel
                  content={content}
                  sessionState={sessionState}
                  result={result}
                  onStart={startSession}
                  onInput={inputCharacter}
                  onBackspace={backspace}
                />
              ) : (
                <section className="typing-panel">
                  <p>No practice content available for this mode right now.</p>
                </section>
              )}
```

- [ ] **Step 4: Run the frontend test file to verify it passes**

Run:

```powershell
npm.cmd test -- src/test/renderApp.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the empty-state behavior**

```powershell
git add src/App.tsx src/test/renderApp.test.tsx
git commit -m "fix: show empty state for missing database content"
```

### Task 8: Remove runtime dependence on static content library

**Files:**
- Modify: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\server\seed\legacyContent.ts`
- Delete: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\contentLibrary.ts`
- Delete: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\data\code.ts`
- Delete: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\data\command.ts`
- Delete: `C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\data\technical.ts`
- Modify tests as needed

- [ ] **Step 1: Copy the seed data away from frontend runtime modules**

If `server/seed/legacyContent.ts` still imports from `src/content/contentLibrary`, replace it with a server-owned static export copied from the final legacy set:

```ts
export const legacySeedContent = [
  // copied prompt records
] as const;

export function getLegacySeedContent() {
  return [...legacySeedContent];
}
```

This is the one task in the plan where duplication is acceptable because the goal is to remove runtime coupling to frontend content files.

- [ ] **Step 2: Remove frontend static content runtime modules**

Delete:

```powershell
Remove-Item 'C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\contentLibrary.ts'
Remove-Item 'C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\data\code.ts'
Remove-Item 'C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\data\command.ts'
Remove-Item 'C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\src\content\data\technical.ts'
```

- [ ] **Step 3: Run full test and build verification**

Run:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run build:server
```

Expected:

- all tests pass
- frontend build passes
- server build passes

- [ ] **Step 4: Commit the final runtime cleanup**

```powershell
git add server/seed/legacyContent.ts src/content/contentApi.ts src/hooks/useTypingSession.ts src/App.tsx src/test/renderApp.test.tsx
git add -u src/content
git commit -m "refactor: remove static runtime prompt library"
```

### Task 9: Seed the local development database and verify Admin visibility

**Files:**
- No code changes required if previous tasks are complete

- [ ] **Step 1: Remove the existing local database to force one clean reseed**

Run:

```powershell
Remove-Item 'C:\Users\86110\Documents\Codex\2026-05-05\superpowers-using-superpowers-c-users-86110\.worktrees\phase1-mvp\data\auth.sqlite'
```

Expected: the next backend startup recreates the database and reseeds `content_items`.

- [ ] **Step 2: Start the backend and confirm the seed log**

Run:

```powershell
npm.cmd run dev:server
```

Expected log:

```text
[content-seed] inserted ...
```

- [ ] **Step 3: Open Admin and verify prompt visibility**

Manual check:

- sign in
- open `Admin -> Content`
- confirm prompts appear without adding them manually

- [ ] **Step 4: Commit nothing for this manual verification step**

There should be no code changes. Leave the repository clean after confirming runtime behavior.

## Plan Self-Review

- Spec coverage check:
  - startup seed path: covered by Tasks 1-2
  - mixed/focused backend queue API: covered by Tasks 3-4
  - frontend full database-backed queue loading: covered by Tasks 5-6
  - explicit empty/error behavior: covered by Task 7
  - removal of static runtime prompt usage: covered by Task 8
  - local reseed and Admin confirmation: covered by Task 9
- Placeholder scan:
  - no `TODO`, `TBD`, or “implement later” markers remain
  - each task names files, commands, and expected behavior
- Type consistency:
  - backend queue route uses `{ items: ContentItem[] }` consistently
  - frontend queue API and tests use the same response shape
