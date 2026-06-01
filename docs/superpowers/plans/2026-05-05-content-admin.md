# Content Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight authenticated content admin area for prompt management and daily challenge assignment, and move daily challenge consumption to the backend content source.

**Architecture:** Extend the existing Express + SQLite backend with content-management tables, repositories, and admin/content routes. Update the React app shell to add an `Admin` view with prompt CRUD and daily challenge controls, while changing the trainer’s daily challenge flow to read challenge content from the backend instead of local static content.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Express, SQLite, cookie-based auth, Testing Library, Supertest.

---

I'm using the writing-plans skill to create the implementation plan.

## File Structure

### Backend files

- Modify: `server/db/init.ts`
  - Add `content_items` and `daily_challenge_assignments` schema creation.
- Create: `server/repositories/contentRepository.ts`
  - Own prompt CRUD, filtering, activation updates, and safe-delete checks.
- Create: `server/repositories/challengeAssignmentRepository.ts`
  - Own manual/generated daily challenge assignments and recent-assignment lookups.
- Create: `server/services/contentService.ts`
  - Validate content writes, coordinate assignment safety checks, and implement auto-generation rules.
- Create: `server/routes/admin.ts`
  - Expose authenticated admin CRUD and challenge management endpoints.
- Create: `server/routes/content.ts`
  - Expose backend content-consumption endpoints for trainer reads.
- Modify: `server/app.ts`
  - Instantiate content repositories/services and mount the new admin/content routers.
- Create: `server/test/adminRoutes.test.ts`
  - Cover content CRUD, validation, safe delete behavior, and challenge assignment flows.

### Frontend files

- Modify: `src/domain/types.ts`
  - Add admin/content DTOs and backend-backed challenge payload types.
- Create: `src/admin/adminApi.ts`
  - Fetch content lists, create/update/delete prompts, and manage daily challenge assignments.
- Create: `src/components/AdminView.tsx`
  - Render the `Admin` view with internal `Content` and `Daily Challenge` sections.
- Create: `src/components/ContentEditor.tsx`
  - Render the add/edit prompt form with structured fields and submit state.
- Modify: `src/App.tsx`
  - Add the top-level `Admin` switch beside `Trainer` and `Leaderboard`.
- Modify: `src/hooks/useTypingSession.ts`
  - Fetch the daily challenge prompt from the backend and use it for `daily` mode.
- Modify: `src/content/contentLibrary.ts`
  - Keep local content for mixed/focused mode while exposing any shared helper needed by the backend generator.
- Modify: `src/test/renderApp.test.tsx`
  - Add admin rendering, CRUD interaction, daily challenge management, and trainer daily-challenge integration tests.
- Modify: `src/styles/app.css`
  - Style admin cards, forms, filter controls, and challenge management panels.

### Existing files to reference during implementation

- `server/services/progressService.ts`
  - Follow its response-shaping and authenticated route integration style.
- `server/repositories/dailyChallengeRepository.ts`
  - Reuse its date-key conventions when aligning assignments and user progress.
- `src/components/LeaderboardView.tsx`
  - Mirror the existing top-level in-app view structure and loading/error patterns.
- `src/components/AuthGate.tsx`
  - Reuse the existing session-expiry reset flow for admin/content API `401` handling.

---

### Task 1: Add Content Tables and Backend CRUD Coverage

**Files:**
- Modify: `server/db/init.ts`
- Create: `server/repositories/contentRepository.ts`
- Create: `server/test/adminRoutes.test.ts`

- [ ] **Step 1: Write the failing backend content CRUD test**

```ts
// server/test/adminRoutes.test.ts
// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

async function register(agent: ReturnType<typeof request.agent>, email: string) {
  await agent.post("/api/auth/register").send({
    email,
    password: "strong-pass-123",
  });
}

describe("admin content routes", () => {
  it("creates a content item and returns it in the filtered list", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await register(agent, "owner@example.com");

    const createResponse = await agent.post("/api/admin/content").send({
      category: "code",
      topic: "typescript",
      difficulty: "medium",
      length: "short",
      label: "Typed formatter",
      prompt: "const formatPrice = (value: number) => value.toFixed(2);",
      isActive: true,
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      category: "code",
      topic: "typescript",
      label: "Typed formatter",
      isActive: true,
    });

    const listResponse = await agent.get(
      "/api/admin/content?category=code&topic=typescript&is_active=true",
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toEqual([
      expect.objectContaining({
        label: "Typed formatter",
        topic: "typescript",
      }),
    ]);
  });
});
```

- [ ] **Step 2: Run the new backend content test and confirm the route does not exist yet**

Run: `npm.cmd test -- server/test/adminRoutes.test.ts`

Expected: FAIL with `Cannot POST /api/admin/content` or missing route wiring.

- [ ] **Step 3: Add the new content-management tables**

```ts
// server/db/init.ts
await db.exec(`
  create table if not exists content_items (
    id text primary key,
    category text not null,
    topic text not null,
    difficulty text not null,
    length text not null,
    label text not null,
    prompt text not null,
    is_active integer not null,
    created_at text not null,
    updated_at text not null
  );

  create table if not exists daily_challenge_assignments (
    date_key text primary key,
    content_item_id text not null,
    source text not null,
    created_at text not null,
    updated_at text not null
  );
`);
```

- [ ] **Step 4: Create the content repository with filter and CRUD primitives**

```ts
// server/repositories/contentRepository.ts
import { randomUUID } from "node:crypto";

import type { Database } from "sqlite";

export interface ContentRecord {
  id: string;
  category: string;
  topic: string;
  difficulty: string;
  length: string;
  label: string;
  prompt: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ContentFilters {
  category?: string;
  topic?: string;
  difficulty?: string;
  length?: string;
  isActive?: boolean;
}

export interface CreateContentInput {
  category: string;
  topic: string;
  difficulty: string;
  length: string;
  label: string;
  prompt: string;
  isActive: boolean;
}

export function createContentRepository(db: Database) {
  return {
    async list(filters: ContentFilters = {}) {
      const clauses: string[] = [];
      const params: Array<string | number> = [];

      if (filters.category) {
        clauses.push("category = ?");
        params.push(filters.category);
      }

      if (filters.topic) {
        clauses.push("topic = ?");
        params.push(filters.topic);
      }

      if (filters.difficulty) {
        clauses.push("difficulty = ?");
        params.push(filters.difficulty);
      }

      if (filters.length) {
        clauses.push("length = ?");
        params.push(filters.length);
      }

      if (typeof filters.isActive === "boolean") {
        clauses.push("is_active = ?");
        params.push(filters.isActive ? 1 : 0);
      }

      const whereClause =
        clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";

      return db.all<ContentRecord[]>(
        `select * from content_items ${whereClause} order by updated_at desc, label asc`,
        ...params,
      );
    },

    async create(input: CreateContentInput) {
      const now = new Date().toISOString();
      const record: ContentRecord = {
        id: randomUUID(),
        category: input.category,
        topic: input.topic,
        difficulty: input.difficulty,
        length: input.length,
        label: input.label,
        prompt: input.prompt,
        is_active: input.isActive ? 1 : 0,
        created_at: now,
        updated_at: now,
      };

      await db.run(
        `insert into content_items (
          id, category, topic, difficulty, length, label, prompt, is_active, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        record.id,
        record.category,
        record.topic,
        record.difficulty,
        record.length,
        record.label,
        record.prompt,
        record.is_active,
        record.created_at,
        record.updated_at,
      );

      return record;
    },

    async findById(id: string) {
      return (
        (await db.get<ContentRecord>(
          `select * from content_items where id = ?`,
          id,
        )) ?? null
      );
    },
  };
}
```

- [ ] **Step 5: Run the backend content test again and confirm the route layer is the remaining failure**

Run: `npm.cmd test -- server/test/adminRoutes.test.ts`

Expected: FAIL with missing admin route/service wiring, not schema or repository import errors.

- [ ] **Step 6: Commit the schema and repository groundwork**

```powershell
git add server/db/init.ts server/repositories/contentRepository.ts server/test/adminRoutes.test.ts
git commit -m "feat: add content management schema"
```

### Task 2: Add Admin Content Routes, Validation, and Safe Delete Rules

**Files:**
- Create: `server/services/contentService.ts`
- Create: `server/routes/admin.ts`
- Modify: `server/repositories/contentRepository.ts`
- Modify: `server/app.ts`
- Modify: `server/test/adminRoutes.test.ts`

- [ ] **Step 1: Extend the backend test with validation, update, and safe-delete expectations**

```ts
it("rejects invalid prompt input", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const agent = request.agent(app);

  await register(agent, "owner@example.com");

  const response = await agent.post("/api/admin/content").send({
    category: "code",
    topic: "typescript",
    difficulty: "medium",
    length: "short",
    label: "",
    prompt: "   ",
    isActive: true,
  });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: "Label and prompt are required",
  });
});

it("updates an existing prompt and blocks deleting assigned prompts", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const agent = request.agent(app);

  await register(agent, "owner@example.com");

  const createResponse = await agent.post("/api/admin/content").send({
    category: "technical",
    topic: "api",
    difficulty: "medium",
    length: "medium",
    label: "HTTP retry note",
    prompt: "Retry idempotent requests with exponential backoff.",
    isActive: true,
  });

  const contentId = createResponse.body.id as string;

  const updateResponse = await agent.put(`/api/admin/content/${contentId}`).send({
    category: "technical",
    topic: "api",
    difficulty: "hard",
    length: "medium",
    label: "HTTP retry note",
    prompt: "Retry idempotent HTTP requests with exponential backoff.",
    isActive: false,
  });

  expect(updateResponse.status).toBe(200);
  expect(updateResponse.body).toMatchObject({
    difficulty: "hard",
    isActive: false,
  });

  await agent.put("/api/admin/daily-challenge/2026-05-05").send({
    contentItemId: contentId,
  });

  const deleteResponse = await agent.delete(`/api/admin/content/${contentId}`);

  expect(deleteResponse.status).toBe(409);
  expect(deleteResponse.body).toEqual({
    error: "Prompt is assigned to a daily challenge",
  });
});
```

- [ ] **Step 2: Run the backend admin test and verify the new cases fail**

Run: `npm.cmd test -- server/test/adminRoutes.test.ts`

Expected: FAIL because admin validation, update, and delete-safety logic do not exist yet.

- [ ] **Step 3: Add update/delete helpers to the content repository**

```ts
// server/repositories/contentRepository.ts
async update(id: string, input: CreateContentInput) {
  const now = new Date().toISOString();

  await db.run(
    `update content_items
     set category = ?, topic = ?, difficulty = ?, length = ?,
         label = ?, prompt = ?, is_active = ?, updated_at = ?
     where id = ?`,
    input.category,
    input.topic,
    input.difficulty,
    input.length,
    input.label,
    input.prompt,
    input.isActive ? 1 : 0,
    now,
    id,
  );

  return this.findById(id);
},

async delete(id: string) {
  await db.run(`delete from content_items where id = ?`, id);
},

async listActiveByPreference() {
  return db.all<ContentRecord[]>(
    `select * from content_items
     where is_active = 1
     order by
       case category when 'technical' then 0 when 'code' then 1 else 2 end,
       case difficulty when 'medium' then 0 when 'easy' then 1 else 2 end,
       case length when 'medium' then 0 when 'short' then 1 else 2 end,
       updated_at desc`,
  );
},
```

- [ ] **Step 4: Implement the content service and authenticated admin content routes**

```ts
// server/services/contentService.ts
import type { PracticeCategory, PracticeDifficulty, PracticeLength, PracticeTopic } from "../../src/domain/types";

const categories = new Set<PracticeCategory>(["code", "command", "technical"]);
const difficulties = new Set<PracticeDifficulty>(["easy", "medium", "hard"]);
const lengths = new Set<PracticeLength>(["short", "medium", "long"]);
const topics = new Set<PracticeTopic>([
  "javascript", "typescript", "python", "sql", "shell", "json", "yaml",
  "git", "npm", "pip", "filesystem", "search", "docker", "curl",
  "api", "database", "logging", "deploy", "debugging", "docs", "errors",
]);

function assertValidInput(input: {
  category: string;
  topic: string;
  difficulty: string;
  length: string;
  label: string;
  prompt: string;
}) {
  if (!categories.has(input.category as PracticeCategory)) {
    throw new Error("Invalid category");
  }

  if (!topics.has(input.topic as PracticeTopic)) {
    throw new Error("Invalid topic");
  }

  if (!difficulties.has(input.difficulty as PracticeDifficulty)) {
    throw new Error("Invalid difficulty");
  }

  if (!lengths.has(input.length as PracticeLength)) {
    throw new Error("Invalid length");
  }

  if (!input.label.trim() || !input.prompt.trim()) {
    throw new Error("Label and prompt are required");
  }
}

export function createContentService(dependencies: {
  contentRepository: {
    list: (filters?: Record<string, unknown>) => Promise<unknown[]>;
    create: (input: any) => Promise<any>;
    update: (id: string, input: any) => Promise<any>;
    findById: (id: string) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
  challengeAssignmentRepository: {
    isContentAssigned: (contentItemId: string) => Promise<boolean>;
  };
}) {
  return {
    async listContent(filters: Record<string, unknown>) {
      return dependencies.contentRepository.list(filters);
    },
    async createContent(input: any) {
      assertValidInput(input);
      return dependencies.contentRepository.create(input);
    },
    async updateContent(id: string, input: any) {
      assertValidInput(input);
      const next = await dependencies.contentRepository.update(id, input);
      if (!next) {
        throw new Error("Content not found");
      }
      return next;
    },
    async deleteContent(id: string) {
      if (await dependencies.challengeAssignmentRepository.isContentAssigned(id)) {
        throw new Error("Prompt is assigned to a daily challenge");
      }

      await dependencies.contentRepository.delete(id);
    },
  };
}
```

```ts
// server/routes/admin.ts
import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";

export function createAdminRouter(dependencies: {
  contentService: ReturnType<typeof import("../services/contentService").createContentService>;
}) {
  const router = Router();

  router.use((request: AuthenticatedRequest, response, next) => {
    if (!request.authUserId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  });

  router.get("/content", async (request, response) => {
    const items = await dependencies.contentService.listContent({
      category: request.query.category,
      topic: request.query.topic,
      difficulty: request.query.difficulty,
      length: request.query.length,
      isActive:
        typeof request.query.is_active === "string"
          ? request.query.is_active === "true"
          : undefined,
    });

    response.json({ items });
  });

  router.post("/content", async (request, response) => {
    try {
      const item = await dependencies.contentService.createContent(request.body);
      response.status(201).json(item);
    } catch (error) {
      response.status(400).json({ error: (error as Error).message });
    }
  });

  router.put("/content/:id", async (request, response) => {
    try {
      const item = await dependencies.contentService.updateContent(
        request.params.id,
        request.body,
      );
      response.status(200).json(item);
    } catch (error) {
      const message = (error as Error).message;
      response.status(message === "Content not found" ? 404 : 400).json({ error: message });
    }
  });

  router.delete("/content/:id", async (request, response) => {
    try {
      await dependencies.contentService.deleteContent(request.params.id);
      response.status(204).send();
    } catch (error) {
      const message = (error as Error).message;
      response.status(message === "Prompt is assigned to a daily challenge" ? 409 : 400).json({
        error: message,
      });
    }
  });

  return router;
}
```

- [ ] **Step 5: Mount the admin router and run the backend admin suite until CRUD and safety tests pass**

```ts
// server/app.ts
import { createContentRepository } from "./repositories/contentRepository";
import { createChallengeAssignmentRepository } from "./repositories/challengeAssignmentRepository";
import { createAdminRouter } from "./routes/admin";
import { createContentService } from "./services/contentService";

const contentRepository = createContentRepository(db);
const challengeAssignmentRepository = createChallengeAssignmentRepository(db);
const contentService = createContentService({
  contentRepository,
  challengeAssignmentRepository,
});

app.use("/api/admin", createAdminRouter({ contentService }));
```

Run: `npm.cmd test -- server/test/adminRoutes.test.ts`

Expected: PASS for create, filter, validation, update, and safe-delete behavior.

- [ ] **Step 6: Commit the admin content API**

```powershell
git add server/repositories/contentRepository.ts server/services/contentService.ts server/routes/admin.ts server/app.ts server/test/adminRoutes.test.ts
git commit -m "feat: add admin content management api"
```

### Task 3: Add Daily Challenge Assignment Repository and Generation Rules

**Files:**
- Create: `server/repositories/challengeAssignmentRepository.ts`
- Modify: `server/services/contentService.ts`
- Modify: `server/routes/admin.ts`
- Create or extend: `server/routes/content.ts`
- Modify: `server/test/adminRoutes.test.ts`

- [ ] **Step 1: Add failing backend tests for manual assignment and automatic generation**

```ts
it("manually assigns a challenge for a date and returns it from the admin query", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const agent = request.agent(app);

  await register(agent, "owner@example.com");

  const created = await agent.post("/api/admin/content").send({
    category: "technical",
    topic: "api",
    difficulty: "medium",
    length: "medium",
    label: "Idempotent retry",
    prompt: "Retry idempotent requests with exponential backoff.",
    isActive: true,
  });

  const contentItemId = created.body.id as string;

  const assignResponse = await agent
    .put("/api/admin/daily-challenge/2026-05-05")
    .send({ contentItemId });

  expect(assignResponse.status).toBe(200);
  expect(assignResponse.body).toMatchObject({
    dateKey: "2026-05-05",
    contentItemId,
    source: "manual",
  });

  const listResponse = await agent.get(
    "/api/admin/daily-challenge?date=2026-05-05",
  );

  expect(listResponse.status).toBe(200);
  expect(listResponse.body.assignments).toEqual([
    expect.objectContaining({
      dateKey: "2026-05-05",
      contentItemId,
      source: "manual",
    }),
  ]);
});

it("generates a stable challenge from active prompts and excludes inactive prompts", async () => {
  const app = await createApp({ databasePath: ":memory:" });
  const agent = request.agent(app);

  await register(agent, "owner@example.com");

  await agent.post("/api/admin/content").send({
    category: "technical",
    topic: "api",
    difficulty: "medium",
    length: "medium",
    label: "API challenge",
    prompt: "Document retry-safe API calls clearly.",
    isActive: true,
  });

  await agent.post("/api/admin/content").send({
    category: "technical",
    topic: "errors",
    difficulty: "medium",
    length: "medium",
    label: "Inactive challenge",
    prompt: "Read error traces from bottom to top.",
    isActive: false,
  });

  const generated = await agent
    .post("/api/admin/daily-challenge/generate")
    .send({ dateKey: "2026-05-06" });

  expect(generated.status).toBe(200);
  expect(generated.body).toMatchObject({
    dateKey: "2026-05-06",
    source: "generated",
  });

  const generatedAgain = await agent
    .post("/api/admin/daily-challenge/generate")
    .send({ dateKey: "2026-05-06" });

  expect(generatedAgain.body.contentItemId).toBe(generated.body.contentItemId);
});
```

- [ ] **Step 2: Run the backend admin suite and confirm assignment and generator paths fail**

Run: `npm.cmd test -- server/test/adminRoutes.test.ts`

Expected: FAIL because the assignment repository and admin challenge endpoints do not exist yet.

- [ ] **Step 3: Add the assignment repository**

```ts
// server/repositories/challengeAssignmentRepository.ts
import type { Database } from "sqlite";

export interface ChallengeAssignmentRecord {
  date_key: string;
  content_item_id: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export function createChallengeAssignmentRepository(db: Database) {
  return {
    async listByDate(dateKey: string) {
      return db.all<ChallengeAssignmentRecord[]>(
        `select * from daily_challenge_assignments where date_key = ?`,
        dateKey,
      );
    },

    async getByDate(dateKey: string) {
      return (
        (await db.get<ChallengeAssignmentRecord>(
          `select * from daily_challenge_assignments where date_key = ?`,
          dateKey,
        )) ?? null
      );
    },

    async upsert(dateKey: string, contentItemId: string, source: "manual" | "generated") {
      const now = new Date().toISOString();

      await db.run(
        `insert into daily_challenge_assignments (
          date_key, content_item_id, source, created_at, updated_at
        ) values (?, ?, ?, ?, ?)
        on conflict(date_key) do update set
          content_item_id = excluded.content_item_id,
          source = excluded.source,
          updated_at = excluded.updated_at`,
        dateKey,
        contentItemId,
        source,
        now,
        now,
      );

      return this.getByDate(dateKey);
    },

    async isContentAssigned(contentItemId: string) {
      const row = await db.get<{ count: number }>(
        `select count(*) as count from daily_challenge_assignments where content_item_id = ?`,
        contentItemId,
      );

      return (row?.count ?? 0) > 0;
    },

    async listRecent(limit = 7) {
      return db.all<ChallengeAssignmentRecord[]>(
        `select * from daily_challenge_assignments order by date_key desc limit ?`,
        limit,
      );
    },
  };
}
```

- [ ] **Step 4: Implement manual assignment, generated fallback, and trainer-facing daily challenge reads**

```ts
// server/services/contentService.ts
function toDateKey(value?: string) {
  return value?.trim() || new Date().toISOString().slice(0, 10);
}

export function createContentService(dependencies: {
  contentRepository: {
    listActiveByPreference: () => Promise<any[]>;
    findById: (id: string) => Promise<any>;
  };
  challengeAssignmentRepository: {
    getByDate: (dateKey: string) => Promise<any>;
    upsert: (
      dateKey: string,
      contentItemId: string,
      source: "manual" | "generated",
    ) => Promise<any>;
    listByDate: (dateKey: string) => Promise<any[]>;
    listRecent: (limit?: number) => Promise<any[]>;
    isContentAssigned: (contentItemId: string) => Promise<boolean>;
  };
}) {
  return {
    // keep existing content methods here
    async listAssignments(dateKey?: string) {
      if (dateKey) {
        return dependencies.challengeAssignmentRepository.listByDate(dateKey);
      }

      return dependencies.challengeAssignmentRepository.listRecent(7);
    },

    async assignDailyChallenge(dateKey: string, contentItemId: string) {
      const item = await dependencies.contentRepository.findById(contentItemId);
      if (!item) {
        throw new Error("Content not found");
      }

      return dependencies.challengeAssignmentRepository.upsert(
        dateKey,
        contentItemId,
        "manual",
      );
    },

    async generateDailyChallenge(dateKeyInput?: string) {
      const dateKey = toDateKey(dateKeyInput);
      const existing = await dependencies.challengeAssignmentRepository.getByDate(
        dateKey,
      );

      if (existing) {
        return existing;
      }

      const recentAssignments =
        await dependencies.challengeAssignmentRepository.listRecent(5);
      const recentIds = new Set(
        recentAssignments.map((assignment) => assignment.content_item_id),
      );

      const eligible = await dependencies.contentRepository.listActiveByPreference();
      const next =
        eligible.find((item) => !recentIds.has(item.id)) ?? eligible[0] ?? null;

      if (!next) {
        throw new Error("No eligible content available for challenge generation.");
      }

      return dependencies.challengeAssignmentRepository.upsert(
        dateKey,
        next.id,
        "generated",
      );
    },

    async getDailyChallengeContent(dateKeyInput?: string) {
      const dateKey = toDateKey(dateKeyInput);
      const assignment =
        (await dependencies.challengeAssignmentRepository.getByDate(dateKey)) ??
        (await this.generateDailyChallenge(dateKey));
      const content = await dependencies.contentRepository.findById(
        assignment.content_item_id,
      );

      if (!content) {
        throw new Error("Assigned challenge content not found");
      }

      return {
        dateKey,
        source: assignment.source,
        content: content,
      };
    },
  };
}
```

```ts
// server/routes/admin.ts
router.get("/daily-challenge", async (request, response) => {
  const date = typeof request.query.date === "string" ? request.query.date : undefined;
  const assignments = await dependencies.contentService.listAssignments(date);
  response.json({ assignments });
});

router.put("/daily-challenge/:dateKey", async (request, response) => {
  try {
    const assignment = await dependencies.contentService.assignDailyChallenge(
      request.params.dateKey,
      String(request.body.contentItemId ?? ""),
    );
    response.status(200).json({
      dateKey: assignment.date_key,
      contentItemId: assignment.content_item_id,
      source: assignment.source,
    });
  } catch (error) {
    const message = (error as Error).message;
    response.status(message === "Content not found" ? 404 : 400).json({ error: message });
  }
});

router.post("/daily-challenge/generate", async (request, response) => {
  try {
    const assignment = await dependencies.contentService.generateDailyChallenge(
      typeof request.body.dateKey === "string" ? request.body.dateKey : undefined,
    );
    response.status(200).json({
      dateKey: assignment.date_key,
      contentItemId: assignment.content_item_id,
      source: assignment.source,
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
});
```

```ts
// server/routes/content.ts
import { Router } from "express";

export function createContentRouter(dependencies: {
  contentService: ReturnType<typeof import("../services/contentService").createContentService>;
}) {
  const router = Router();

  router.get("/daily-challenge", async (_request, response) => {
    try {
      response.json(await dependencies.contentService.getDailyChallengeContent());
    } catch (error) {
      response.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
```

- [ ] **Step 5: Mount the trainer content router and rerun backend admin tests**

```ts
// server/app.ts
import { createContentRouter } from "./routes/content";

app.use("/api/content", createContentRouter({ contentService }));
```

Run: `npm.cmd test -- server/test/adminRoutes.test.ts`

Expected: PASS for manual assignment, generated fallback, stable generation, and inactive-prompt exclusion.

- [ ] **Step 6: Commit challenge assignment and generator support**

```powershell
git add server/repositories/challengeAssignmentRepository.ts server/services/contentService.ts server/routes/admin.ts server/routes/content.ts server/app.ts server/test/adminRoutes.test.ts
git commit -m "feat: add challenge assignment management"
```

### Task 4: Add the Admin Frontend and CRUD Flows

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/admin/adminApi.ts`
- Create: `src/components/AdminView.tsx`
- Create: `src/components/ContentEditor.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Add a failing frontend test for the Admin view**

```ts
it("renders the admin content list and creates a prompt", async () => {
  const fetchMock = createFetchMock({
    adminContentList: { items: [] },
    adminContentCreateResponse: {
      id: "content-1",
      category: "code",
      topic: "typescript",
      difficulty: "medium",
      length: "short",
      label: "Typed formatter",
      prompt: "const formatPrice = (value: number) => value.toFixed(2);",
      isActive: true,
      createdAt: "2026-05-05T12:00:00.000Z",
      updatedAt: "2026-05-05T12:00:00.000Z",
    },
  });

  vi.stubGlobal("fetch", fetchMock);
  render(<App />);

  await screen.findByRole("heading", { name: /programmer typing trainer/i });
  fireEvent.click(screen.getByRole("button", { name: /^admin$/i }));

  expect(await screen.findByRole("heading", { name: /content admin/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /new prompt/i }));
  fireEvent.change(screen.getByLabelText(/label/i), {
    target: { value: "Typed formatter" },
  });
  fireEvent.change(screen.getByLabelText(/prompt/i), {
    target: { value: "const formatPrice = (value: number) => value.toFixed(2);" },
  });
  fireEvent.click(screen.getByRole("button", { name: /save prompt/i }));

  expect(await screen.findByText(/typed formatter/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the frontend suite and confirm the Admin view is missing**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL because the app shell does not yet expose an `Admin` view or admin fetch mocks.

- [ ] **Step 3: Add admin DTOs and API helpers**

```ts
// src/domain/types.ts
export interface AdminContentItem {
  id: string;
  category: PracticeCategory;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  length: PracticeLength;
  label: string;
  prompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContentListResponse {
  items: AdminContentItem[];
}

export interface AdminChallengeAssignment {
  dateKey: string;
  contentItemId: string;
  source: "manual" | "generated";
}

export interface AdminChallengeListResponse {
  assignments: AdminChallengeAssignment[];
}
```

```ts
// src/admin/adminApi.ts
import type {
  AdminChallengeAssignment,
  AdminChallengeListResponse,
  AdminContentItem,
  AdminContentListResponse,
} from "../domain/types";

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });

  if (response.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Admin request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchAdminContent(query = "") {
  return readJson<AdminContentListResponse>(`/api/admin/content${query}`);
}

export function createAdminContent(input: Omit<AdminContentItem, "id" | "createdAt" | "updatedAt">) {
  return readJson<AdminContentItem>("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateAdminContent(id: string, input: Omit<AdminContentItem, "id" | "createdAt" | "updatedAt">) {
  return readJson<AdminContentItem>(`/api/admin/content/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteAdminContent(id: string) {
  return fetch(`/api/admin/content/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export function fetchAdminDailyChallenges(dateKey?: string) {
  const query = dateKey ? `?date=${encodeURIComponent(dateKey)}` : "";
  return readJson<AdminChallengeListResponse>(`/api/admin/daily-challenge${query}`);
}

export function assignAdminDailyChallenge(
  dateKey: string,
  contentItemId: string,
) {
  return readJson<AdminChallengeAssignment>(
    `/api/admin/daily-challenge/${dateKey}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentItemId }),
    },
  );
}

export function generateAdminDailyChallenge(dateKey?: string) {
  return readJson<AdminChallengeAssignment>("/api/admin/daily-challenge/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dateKey ? { dateKey } : {}),
  });
}
```

- [ ] **Step 4: Build the Admin view and content editor**

```tsx
// src/components/ContentEditor.tsx
import { useState } from "react";

import type { AdminContentItem, PracticeCategory, PracticeDifficulty, PracticeLength, PracticeTopic } from "../domain/types";

const defaultValues = {
  category: "code" as PracticeCategory,
  topic: "typescript" as PracticeTopic,
  difficulty: "medium" as PracticeDifficulty,
  length: "medium" as PracticeLength,
  label: "",
  prompt: "",
  isActive: true,
};

export function ContentEditor({
  initialValue,
  onCancel,
  onSave,
}: {
  initialValue?: AdminContentItem | null;
  onCancel: () => void;
  onSave: (value: typeof defaultValues) => Promise<void>;
}) {
  const [form, setForm] = useState(
    initialValue
      ? {
          category: initialValue.category,
          topic: initialValue.topic,
          difficulty: initialValue.difficulty,
          length: initialValue.length,
          label: initialValue.label,
          prompt: initialValue.prompt,
          isActive: initialValue.isActive,
        }
      : defaultValues,
  );
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
          await onSave(form);
        } finally {
          setSaving(false);
        }
      }}
    >
      <label>
        Label
        <input
          aria-label="Label"
          value={form.label}
          onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
        />
      </label>
      <label>
        Prompt
        <textarea
          aria-label="Prompt"
          value={form.prompt}
          onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
        />
      </label>
      <label>
        Active
        <input
          aria-label="Active"
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
        />
      </label>
      <div className="admin-form__actions">
        <button type="submit" disabled={saving}>Save Prompt</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
```

```tsx
// src/components/AdminView.tsx
import { useEffect, useMemo, useState } from "react";

import {
  assignAdminDailyChallenge,
  createAdminContent,
  fetchAdminContent,
  fetchAdminDailyChallenges,
  generateAdminDailyChallenge,
  updateAdminContent,
} from "../admin/adminApi";
import type { AdminChallengeAssignment, AdminContentItem } from "../domain/types";
import { ContentEditor } from "./ContentEditor";

type AdminTab = "content" | "daily";

export function AdminView({ onAuthExpired }: { onAuthExpired: () => void }) {
  const [tab, setTab] = useState<AdminTab>("content");
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [assignments, setAssignments] = useState<AdminChallengeAssignment[]>([]);
  const [editing, setEditing] = useState<AdminContentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("2026-05-05");
  const [selectedContentId, setSelectedContentId] = useState("");

  async function loadContent() {
    try {
      const response = await fetchAdminContent();
      setItems(response.items);
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_EXPIRED") {
        onAuthExpired();
        return;
      }
      setError(error instanceof Error ? error.message : "Unable to load content");
    }
  }

  async function loadAssignments() {
    try {
      const response = await fetchAdminDailyChallenges(selectedDate);
      setAssignments(response.assignments);
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_EXPIRED") {
        onAuthExpired();
        return;
      }
      setError(error instanceof Error ? error.message : "Unable to load daily challenge");
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [selectedDate]);

  const contentOptions = useMemo(
    () => items.map((item) => ({ value: item.id, label: item.label })),
    [items],
  );

  return (
    <section className="admin-card">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Content Admin</h2>
        </div>
        <div className="admin-tabs">
          <button type="button" className={tab === "content" ? "is-active" : undefined} onClick={() => setTab("content")}>
            Content
          </button>
          <button type="button" className={tab === "daily" ? "is-active" : undefined} onClick={() => setTab("daily")}>
            Daily Challenge
          </button>
        </div>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      {tab === "content" ? (
        <>
          <div className="admin-actions">
            <button type="button" onClick={() => { setCreating(true); setEditing(null); }}>
              New Prompt
            </button>
          </div>
          {creating || editing ? (
            <ContentEditor
              initialValue={editing}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
              onSave={async (value) => {
                const next = editing
                  ? await updateAdminContent(editing.id, value)
                  : await createAdminContent(value);
                setItems((current) =>
                  editing
                    ? current.map((item) => (item.id === next.id ? next : item))
                    : [next, ...current],
                );
                setCreating(false);
                setEditing(null);
              }}
            />
          ) : null}
          <div className="admin-list">
            {items.map((item) => (
              <article key={item.id} className="admin-item">
                <h3>{item.label}</h3>
                <p>{item.topic} · {item.difficulty} · {item.length}</p>
                <p>{item.isActive ? "Active" : "Inactive"}</p>
                <button type="button" onClick={() => setEditing(item)}>Edit</button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="admin-daily">
          <label>
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <label>
            Prompt
            <select
              value={selectedContentId}
              onChange={(event) => setSelectedContentId(event.target.value)}
            >
              <option value="">Choose a prompt</option>
              {contentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form__actions">
            <button
              type="button"
              onClick={async () => {
                const next = await assignAdminDailyChallenge(selectedDate, selectedContentId);
                setAssignments([next]);
              }}
            >
              Assign Challenge
            </button>
            <button
              type="button"
              onClick={async () => {
                const next = await generateAdminDailyChallenge(selectedDate);
                setAssignments([next]);
              }}
            >
              Generate Challenge
            </button>
          </div>
          <div className="admin-list">
            {assignments.map((assignment) => (
              <article key={`${assignment.dateKey}-${assignment.contentItemId}`} className="admin-item">
                <h3>{assignment.dateKey}</h3>
                <p>{assignment.source}</p>
                <p>{assignment.contentItemId}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Integrate the `Admin` top-level view and admin styling**

```tsx
// src/App.tsx
import { AdminView } from "./components/AdminView";

type AppView = "trainer" | "leaderboard" | "admin";

<button
  type="button"
  className={view === "admin" ? "is-active" : undefined}
  onClick={() => setView("admin")}
>
  Admin
</button>

{view === "admin" ? (
  <AdminView onAuthExpired={onAuthExpired} />
) : view === "leaderboard" ? (
  <LeaderboardView onAuthExpired={onAuthExpired} />
) : (
  // existing trainer view
)}
```

```css
/* src/styles/app.css */
.admin-card {
  margin-top: 24px;
  padding: 20px;
  border-radius: 18px;
  background: rgba(22, 38, 68, 0.65);
}

.admin-header,
.admin-tabs,
.admin-actions,
.admin-form__actions {
  display: flex;
  gap: 12px;
}

.admin-header {
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.admin-tabs {
  flex-wrap: wrap;
}

.admin-list {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.admin-item {
  padding: 16px;
  border-radius: 14px;
  background: rgba(5, 10, 19, 0.55);
}

.admin-form {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.admin-error {
  color: var(--danger);
}
```

- [ ] **Step 6: Expand the frontend fetch mock and run admin UI tests**

```ts
// src/test/renderApp.test.tsx
function createFetchMock(options?: {
  // keep existing properties here
  adminContentList?: { items: AdminContentItem[] };
  adminContentCreateResponse?: AdminContentItem;
  adminContentUpdateResponse?: AdminContentItem;
  adminDailyChallengeList?: { assignments: AdminChallengeAssignment[] };
  adminDailyChallengeAssignResponse?: AdminChallengeAssignment;
  adminDailyChallengeGenerateResponse?: AdminChallengeAssignment;
}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.startsWith("/api/admin/content") && (init?.method ?? "GET") === "GET") {
      return jsonResponse(options?.adminContentList ?? { items: [] });
    }

    if (url === "/api/admin/content" && init?.method === "POST") {
      return jsonResponse(options?.adminContentCreateResponse);
    }

    if (url.startsWith("/api/admin/content/") && init?.method === "PUT") {
      return jsonResponse(options?.adminContentUpdateResponse);
    }

    if (url.startsWith("/api/admin/daily-challenge") && (init?.method ?? "GET") === "GET") {
      return jsonResponse(options?.adminDailyChallengeList ?? { assignments: [] });
    }

    if (url.startsWith("/api/admin/daily-challenge/") && init?.method === "PUT") {
      return jsonResponse(options?.adminDailyChallengeAssignResponse);
    }

    if (url === "/api/admin/daily-challenge/generate" && init?.method === "POST") {
      return jsonResponse(options?.adminDailyChallengeGenerateResponse);
    }

    // keep existing auth/progress/leaderboard branches here
  });
}
```

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS for admin content rendering and prompt creation while keeping prior trainer and leaderboard tests green.

- [ ] **Step 7: Commit the admin frontend**

```powershell
git add src/domain/types.ts src/admin/adminApi.ts src/components/AdminView.tsx src/components/ContentEditor.tsx src/App.tsx src/styles/app.css src/test/renderApp.test.tsx
git commit -m "feat: add admin content management ui"
```

### Task 5: Move Daily Challenge Consumption to the Backend

**Files:**
- Modify: `src/hooks/useTypingSession.ts`
- Modify: `src/content/contentLibrary.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Add a failing trainer integration test for backend-backed daily challenges**

```ts
it("hydrates daily challenge mode from the backend content source", async () => {
  const fetchMock = createFetchMock({
    contentDailyChallenge: {
      dateKey: "2026-05-05",
      source: "manual",
      content: {
        id: "content-1",
        category: "technical",
        topic: "api",
        difficulty: "medium",
        length: "medium",
        label: "HTTP retry note",
        prompt: "Retry idempotent HTTP requests with exponential backoff.",
      },
    },
  });

  vi.stubGlobal("fetch", fetchMock);
  render(<App />);

  await screen.findByRole("heading", { name: /programmer typing trainer/i });
  fireEvent.click(screen.getByRole("button", { name: /daily challenge/i }));

  expect(await screen.findByText(/http retry note/i)).toBeInTheDocument();
  expect(screen.getByText(/retry idempotent http requests with exponential backoff\./i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the frontend suite and confirm daily mode still uses local content**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL because `daily` mode does not yet read `/api/content/daily-challenge`.

- [ ] **Step 3: Add the backend-backed daily challenge types and fetch helper**

```ts
// src/domain/types.ts
export interface BackendDailyChallengeResponse {
  dateKey: string;
  source: "manual" | "generated";
  content: ContentItem;
}
```

```ts
// src/admin/adminApi.ts or a new shared content api file
export async function fetchBackendDailyChallenge() {
  const response = await fetch("/api/content/daily-challenge", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Daily challenge fetch failed: ${response.status}`);
  }

  return response.json() as Promise<BackendDailyChallengeResponse>;
}
```

- [ ] **Step 4: Replace local daily challenge selection inside the typing hook**

```ts
// src/hooks/useTypingSession.ts
useEffect(() => {
  if (mode !== "daily") {
    return;
  }

  let cancelled = false;

  fetchBackendDailyChallenge()
    .then((payload) => {
      if (cancelled) {
        return;
      }

      setContent(payload.content);
      setDailyChallenge({
        dateKey: payload.dateKey,
        challengeId: payload.content.id,
        completed: currentChallenge?.completed ?? false,
        bestWpm: currentChallenge?.bestWpm ?? 0,
        bestAccuracy: currentChallenge?.bestAccuracy ?? 0,
      });
    })
    .catch((error) => {
      setProgressError(error instanceof Error ? error.message : "Daily challenge fetch failed");
    });

  return () => {
    cancelled = true;
  };
}, [mode]);
```

- [ ] **Step 5: Run the frontend suite again and confirm daily challenge mode uses backend content**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS for daily challenge hydration from `/api/content/daily-challenge` without regressing mixed/focused behavior.

- [ ] **Step 6: Commit the trainer daily challenge migration**

```powershell
git add src/hooks/useTypingSession.ts src/domain/types.ts src/test/renderApp.test.tsx
git commit -m "feat: back daily challenge with admin content api"
```

### Task 6: Final Verification and Manual Admin QA

**Files:**
- Verify: `server/test/adminRoutes.test.ts`
- Verify: `src/test/renderApp.test.tsx`
- Verify: `server/routes/admin.ts`
- Verify: `src/components/AdminView.tsx`

- [ ] **Step 1: Run the targeted verification suites**

Run: `npm.cmd test -- server/test/adminRoutes.test.ts`

Expected: PASS for content CRUD, validation, assignment generation, and safe-delete behavior.

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS for trainer, leaderboard, admin, and backend-backed daily challenge UI flows.

- [ ] **Step 2: Run the full project verification suite**

Run: `npm.cmd test`

Expected: PASS across auth, progress, leaderboard, admin, and frontend app suites.

Run: `npm.cmd run build`

Expected: PASS and Vite production bundle completes cleanly.

Run: `npm.cmd run build:server`

Expected: PASS and server TypeScript build includes the new content-management modules without type errors.

- [ ] **Step 3: Manually validate the end-to-end admin loop**

Run:

```powershell
npm.cmd run dev:server
```

and in another terminal:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5175
```

Manual checks:

- sign in and open the `Admin` view
- create a new prompt and confirm it appears in the content list
- edit the prompt to inactive and confirm it still renders but no longer qualifies for generated daily challenges
- manually assign a date to a known prompt and confirm the assignment is visible in `Daily Challenge`
- switch to `Trainer`, choose `Daily Challenge`, and confirm the prompt label/prompt text come from the admin-managed challenge
- try deleting an assigned prompt and confirm the UI shows the backend conflict error
- generate a challenge for a date with only one active eligible prompt and confirm repeated generation for the same date remains stable

- [ ] **Step 4: Commit any verification-only cleanup if tracked files changed**

```powershell
git add .
git commit -m "test: finalize content admin verification"
```

Skip this commit if verification did not require file changes.
