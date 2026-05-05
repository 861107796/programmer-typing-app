# Content Library Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the typing trainer’s prompt library to a structured, maintainable catalog of roughly 420 programmer-focused prompts with metadata-aware selection.

**Architecture:** The content layer will move from one inline seed array to three category-specific data modules plus a metadata-aware `contentLibrary` selector. Domain types and tests will expand first so the larger dataset can be added safely, then the data files and selection logic will be filled in and verified.

**Tech Stack:** React, TypeScript, Vitest, Vite, local static data modules

---

## File Structure

- Modify: `src/domain/types.ts`
  Add topic, difficulty, and length metadata types.
- Create: `src/content/data/code.ts`
  Holds the curated code prompt dataset.
- Create: `src/content/data/command.ts`
  Holds the curated command prompt dataset.
- Create: `src/content/data/technical.ts`
  Holds the curated technical English prompt dataset.
- Modify: `src/content/contentLibrary.ts`
  Composes all data modules and exposes metadata-aware selection helpers.
- Modify: `src/content/contentLibrary.test.ts`
  Validates counts, balanced mixed selection, and deterministic challenge selection.
- Create: `src/content/contentIntegrity.test.ts`
  Verifies ids, metadata, totals, and distribution invariants.
- Modify: `src/hooks/useTypingSession.ts`
  Keeps existing flows compatible with richer content metadata.

## Task 1: Upgrade Domain Types for Rich Content Metadata

**Files:**
- Modify: `src/domain/types.ts`
- Test: `src/content/contentLibrary.test.ts`

- [ ] **Step 1: Write the failing metadata test**

```ts
import { describe, expect, it } from "vitest";

import { getAllContent } from "./contentLibrary";

describe("content metadata", () => {
  it("exposes topic, difficulty, and length on every prompt", () => {
    const items = getAllContent();

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.topic).toBeTruthy();
      expect(["easy", "medium", "hard"]).toContain(item.difficulty);
      expect(["short", "medium", "long"]).toContain(item.length);
    }
  });
});
```

- [ ] **Step 2: Run the metadata test to verify it fails**

Run: `npm.cmd test -- src/content/contentLibrary.test.ts`

Expected: FAIL because the current `ContentItem` type and library data do not provide the new metadata fields.

- [ ] **Step 3: Add the metadata types to the domain model**

Update `src/domain/types.ts` to include:

```ts
export type PracticeDifficulty = "easy" | "medium" | "hard";
export type PracticeLength = "short" | "medium" | "long";

export type PracticeTopic =
  | "javascript"
  | "typescript"
  | "python"
  | "sql"
  | "shell"
  | "json"
  | "yaml"
  | "git"
  | "npm"
  | "pip"
  | "filesystem"
  | "search"
  | "docker"
  | "curl"
  | "api"
  | "database"
  | "logging"
  | "deploy"
  | "debugging"
  | "docs"
  | "errors";

export interface ContentItem {
  id: string;
  category: PracticeCategory;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  length: PracticeLength;
  label: string;
  prompt: string;
}
```

- [ ] **Step 4: Run the metadata test again**

Run: `npm.cmd test -- src/content/contentLibrary.test.ts`

Expected: FAIL again, but now because the existing data records do not yet include the new fields.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/content/contentLibrary.test.ts
git commit -m "refactor: add rich content metadata types"
```

## Task 2: Split the Content Library into Category Data Modules

**Files:**
- Create: `src/content/data/code.ts`
- Create: `src/content/data/command.ts`
- Create: `src/content/data/technical.ts`
- Modify: `src/content/contentLibrary.ts`
- Test: `src/content/contentLibrary.test.ts`

- [ ] **Step 1: Write the failing import-and-merge test**

```ts
import { describe, expect, it } from "vitest";

import { getAllContent } from "./contentLibrary";

describe("content composition", () => {
  it("returns a merged list from all three category modules", () => {
    const items = getAllContent();
    const categories = new Set(items.map((item) => item.category));

    expect(categories.has("code")).toBe(true);
    expect(categories.has("command")).toBe(true);
    expect(categories.has("technical")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the composition test to verify it fails**

Run: `npm.cmd test -- src/content/contentLibrary.test.ts`

Expected: FAIL because `getAllContent()` and the split data modules do not exist yet.

- [ ] **Step 3: Create the three data modules and a new composition function**

Add these exports:

`src/content/data/code.ts`

```ts
import type { ContentItem } from "../../domain/types";

export const codePrompts: ContentItem[] = [
  {
    id: "code-ts-001",
    category: "code",
    topic: "typescript",
    difficulty: "easy",
    length: "short",
    label: "Typed function",
    prompt: "const formatPrice = (value: number) => value.toFixed(2);",
  },
];
```

`src/content/data/command.ts`

```ts
import type { ContentItem } from "../../domain/types";

export const commandPrompts: ContentItem[] = [
  {
    id: "command-git-001",
    category: "command",
    topic: "git",
    difficulty: "easy",
    length: "short",
    label: "Status check",
    prompt: "git status --short --branch",
  },
];
```

`src/content/data/technical.ts`

```ts
import type { ContentItem } from "../../domain/types";

export const technicalPrompts: ContentItem[] = [
  {
    id: "technical-api-001",
    category: "technical",
    topic: "api",
    difficulty: "easy",
    length: "short",
    label: "Timeout note",
    prompt: "Return a cached response when the upstream API times out.",
  },
];
```

Update `src/content/contentLibrary.ts` to export:

```ts
import { codePrompts } from "./data/code";
import { commandPrompts } from "./data/command";
import { technicalPrompts } from "./data/technical";

export function getAllContent() {
  return [...codePrompts, ...commandPrompts, ...technicalPrompts];
}
```

- [ ] **Step 4: Run the composition test**

Run: `npm.cmd test -- src/content/contentLibrary.test.ts`

Expected: PASS for merged-category coverage and metadata presence.

- [ ] **Step 5: Commit**

```bash
git add src/content/data/code.ts src/content/data/command.ts src/content/data/technical.ts src/content/contentLibrary.ts src/content/contentLibrary.test.ts
git commit -m "refactor: split content into category data modules"
```

## Task 3: Add Metadata-Aware Filtering Helpers

**Files:**
- Modify: `src/content/contentLibrary.ts`
- Modify: `src/content/contentLibrary.test.ts`

- [ ] **Step 1: Write the failing filter tests**

```ts
import { describe, expect, it } from "vitest";

import { filterContent } from "./contentLibrary";

describe("filterContent", () => {
  it("filters prompts by topic", () => {
    const items = filterContent({ topic: "git" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.topic === "git")).toBe(true);
  });

  it("filters prompts by difficulty and length together", () => {
    const items = filterContent({ difficulty: "hard", length: "long" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.difficulty === "hard" && item.length === "long")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the filter tests to verify they fail**

Run: `npm.cmd test -- src/content/contentLibrary.test.ts`

Expected: FAIL because `filterContent()` does not exist yet.

- [ ] **Step 3: Implement metadata-aware filtering**

Add to `src/content/contentLibrary.ts`:

```ts
import type {
  ContentItem,
  PracticeCategory,
  PracticeDifficulty,
  PracticeLength,
  PracticeTopic,
} from "../domain/types";

interface ContentFilter {
  category?: PracticeCategory;
  topic?: PracticeTopic;
  difficulty?: PracticeDifficulty;
  length?: PracticeLength;
}

export function filterContent(filter: ContentFilter): ContentItem[] {
  return getAllContent().filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.topic && item.topic !== filter.topic) return false;
    if (filter.difficulty && item.difficulty !== filter.difficulty) return false;
    if (filter.length && item.length !== filter.length) return false;
    return true;
  });
}
```

- [ ] **Step 4: Run the filter tests**

Run: `npm.cmd test -- src/content/contentLibrary.test.ts`

Expected: PASS for topic filtering and combined metadata filtering.

- [ ] **Step 5: Commit**

```bash
git add src/content/contentLibrary.ts src/content/contentLibrary.test.ts
git commit -m "feat: add metadata-aware content filters"
```

## Task 4: Expand the Code Prompt Dataset

**Files:**
- Modify: `src/content/data/code.ts`
- Create: `src/content/contentIntegrity.test.ts`

- [ ] **Step 1: Write the failing dataset count test for code prompts**

```ts
import { describe, expect, it } from "vitest";

import { codePrompts } from "./data/code";

describe("code prompt dataset", () => {
  it("contains at least 180 curated code prompts", () => {
    expect(codePrompts.length).toBeGreaterThanOrEqual(180);
  });
});
```

- [ ] **Step 2: Run the integrity test to verify it fails**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: FAIL because the code prompt dataset is still tiny.

- [ ] **Step 3: Expand `src/content/data/code.ts` to the target size**

Use this shape for every new record:

```ts
{
  id: "code-py-042",
  category: "code",
  topic: "python",
  difficulty: "medium",
  length: "medium",
  label: "List comprehension",
  prompt: "active_users = [user.email for user in users if user.is_active]",
}
```

Coverage requirements inside `code.ts`:

- JavaScript
- TypeScript
- Python
- SQL
- Shell
- JSON
- YAML

Keep the final file at or above 180 entries with a visible spread across difficulty and length tags.

- [ ] **Step 4: Run the code dataset test**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: PASS for the code dataset threshold.

- [ ] **Step 5: Commit**

```bash
git add src/content/data/code.ts src/content/contentIntegrity.test.ts
git commit -m "feat: expand code prompt dataset"
```

## Task 5: Expand the Command Prompt Dataset

**Files:**
- Modify: `src/content/data/command.ts`
- Modify: `src/content/contentIntegrity.test.ts`

- [ ] **Step 1: Add the failing command dataset test**

```ts
import { commandPrompts } from "./data/command";

it("contains at least 140 curated command prompts", () => {
  expect(commandPrompts.length).toBeGreaterThanOrEqual(140);
});
```

- [ ] **Step 2: Run the integrity test to verify it fails**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: FAIL because the command prompt dataset is still below target.

- [ ] **Step 3: Expand `src/content/data/command.ts` to the target size**

Use prompts like:

```ts
{
  id: "command-docker-019",
  category: "command",
  topic: "docker",
  difficulty: "hard",
  length: "medium",
  label: "Container logs",
  prompt: "docker logs api --tail 200 | grep \"UnhandledPromiseRejection\"",
}
```

Coverage requirements inside `command.ts`:

- Git
- npm
- pip
- Filesystem
- Search
- Docker
- Curl
- Shell-like command chaining

Keep the final file at or above 140 entries with visible length and difficulty variety.

- [ ] **Step 4: Run the command dataset test**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: PASS for the command dataset threshold.

- [ ] **Step 5: Commit**

```bash
git add src/content/data/command.ts src/content/contentIntegrity.test.ts
git commit -m "feat: expand command prompt dataset"
```

## Task 6: Expand the Technical Prompt Dataset

**Files:**
- Modify: `src/content/data/technical.ts`
- Modify: `src/content/contentIntegrity.test.ts`

- [ ] **Step 1: Add the failing technical dataset test**

```ts
import { technicalPrompts } from "./data/technical";

it("contains at least 100 curated technical prompts", () => {
  expect(technicalPrompts.length).toBeGreaterThanOrEqual(100);
});
```

- [ ] **Step 2: Run the integrity test to verify it fails**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: FAIL because the technical dataset is still below target.

- [ ] **Step 3: Expand `src/content/data/technical.ts` to the target size**

Use prompts like:

```ts
{
  id: "technical-errors-014",
  category: "technical",
  topic: "errors",
  difficulty: "medium",
  length: "medium",
  label: "Timeout summary",
  prompt: "The retry loop should stop after the third timeout and surface the last upstream error.",
}
```

Coverage requirements inside `technical.ts`:

- API
- Database
- Logging
- Deploy
- Debugging
- Docs
- Errors

Keep the final file at or above 100 entries with a realistic mix of short, medium, and long prompts.

- [ ] **Step 4: Run the technical dataset test**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: PASS for the technical dataset threshold.

- [ ] **Step 5: Commit**

```bash
git add src/content/data/technical.ts src/content/contentIntegrity.test.ts
git commit -m "feat: expand technical prompt dataset"
```

## Task 7: Add Full Integrity and Distribution Checks

**Files:**
- Modify: `src/content/contentIntegrity.test.ts`

- [ ] **Step 1: Add failing whole-library integrity tests**

```ts
import { describe, expect, it } from "vitest";

import { getAllContent } from "./contentLibrary";

describe("content integrity", () => {
  it("contains at least 420 total prompts", () => {
    expect(getAllContent().length).toBeGreaterThanOrEqual(420);
  });

  it("uses unique ids across the entire dataset", () => {
    const ids = getAllContent().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the integrity suite to verify it fails if totals or ids are wrong**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: FAIL until the whole dataset reaches target volume with unique ids.

- [ ] **Step 3: Complete the integrity suite**

Add checks for:

- Valid `category` values
- Valid `topic` values
- Valid `difficulty` values
- Valid `length` values
- Minimum per-category totals
- Mixed practice still spans multiple categories
- Daily challenge remains deterministic

Use assertions like:

```ts
expect(["short", "medium", "long"]).toContain(item.length);
expect(["easy", "medium", "hard"]).toContain(item.difficulty);
```

- [ ] **Step 4: Run the integrity suite**

Run: `npm.cmd test -- src/content/contentIntegrity.test.ts`

Expected: PASS for totals, ids, metadata validity, and distribution checks.

- [ ] **Step 5: Commit**

```bash
git add src/content/contentIntegrity.test.ts src/content/contentLibrary.ts src/content/contentLibrary.test.ts
git commit -m "test: add content integrity coverage"
```

## Task 8: Wire the Richer Library Through the Existing App

**Files:**
- Modify: `src/content/contentLibrary.ts`
- Modify: `src/hooks/useTypingSession.ts`
- Modify: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Write the failing app compatibility test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "../App";

describe("expanded content library app flow", () => {
  it("still renders a prompt label and allows practice to start", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /start practice/i })).toBeInTheDocument();
    expect(screen.getByTestId("prompt-text").textContent).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the app compatibility test to verify it fails if the new selectors broke the UI**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL if the content-selection API changed without keeping the existing session flow working.

- [ ] **Step 3: Update the app-facing content selection calls**

Ensure `useTypingSession.ts` still works with the richer library by keeping or reintroducing:

```ts
export function getContentByCategory(category: PracticeCategory) { ... }
export function getMixedPracticeSet(count: number) { ... }
export function getDailyChallenge(dateKey: string) { ... }
```

If needed, adapt `useTypingSession.ts` so it calls the updated helpers without changing the visible practice flow.

- [ ] **Step 4: Run the app compatibility test**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS with the expanded content library in place.

- [ ] **Step 5: Commit**

```bash
git add src/content/contentLibrary.ts src/hooks/useTypingSession.ts src/test/renderApp.test.tsx
git commit -m "feat: connect expanded content library to app flow"
```

## Task 9: Final Verification and Manual Review

**Files:**
- Modify: `src/content/data/code.ts`
- Modify: `src/content/data/command.ts`
- Modify: `src/content/data/technical.ts`
- Modify: `src/content/contentLibrary.ts`
- Modify: `src/content/contentLibrary.test.ts`
- Modify: `src/content/contentIntegrity.test.ts`

- [ ] **Step 1: Run the full test suite and note any failures**

Run: `npm.cmd test`

Expected: PASS for all unit and integration tests.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: Successful build with no TypeScript errors.

- [ ] **Step 3: Perform a manual content review pass**

Open the running app and review prompts for:

- obvious repetition
- awkward wording
- fake-looking code
- poor symbol density
- outlier length tags
- duplicated meanings with renamed variables

Make inline edits to the content data files where needed.

- [ ] **Step 4: Re-run the full verification commands**

Run: `npm.cmd test`

Expected: PASS after the final content edits.

Run: `npm.cmd run build`

Expected: PASS after the final content edits.

- [ ] **Step 5: Commit**

```bash
git add src/content/data/code.ts src/content/data/command.ts src/content/data/technical.ts src/content/contentLibrary.ts src/content/contentLibrary.test.ts src/content/contentIntegrity.test.ts
git commit -m "feat: ship expanded prompt library"
```

## Plan Review Notes

Spec coverage check:

- Total target volume and category split are covered by Tasks 4, 5, 6, and 7.
- Metadata shape and file organization are covered by Tasks 1 and 2.
- Filtering, mixed selection, and daily challenge compatibility are covered by Tasks 3, 7, and 8.
- Template-to-curation workflow is operationalized through dataset-expansion tasks plus the manual review pass in Task 9.

Placeholder scan:

- No `TODO`, `TBD`, or deferred placeholders remain in this plan.
- Each task includes exact file paths, commands, and concrete code shapes.

Type consistency check:

- `PracticeTopic`, `PracticeDifficulty`, `PracticeLength`, and `ContentItem` metadata fields are defined before later tasks rely on them.
- `getAllContent`, `filterContent`, `getContentByCategory`, `getMixedPracticeSet`, and `getDailyChallenge` are referenced consistently throughout the plan.
