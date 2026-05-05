# Programmer Typing App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 of a programmer-focused web typing trainer with mixed practice, focused practice, a daily challenge, local progress tracking, and lightweight achievements.

**Architecture:** The app is a React + TypeScript single-page application with the training experience centered around a pure typing engine and pure scoring/progress modules. UI components render mode selection, live typing feedback, results, progress, and daily challenge state while browser storage persists local data behind a small repository layer.

**Tech Stack:** React, Vite, TypeScript, Vitest, React Testing Library, jsdom, localStorage

---

## File Structure

Create these files during implementation. Keep responsibilities narrow and avoid turning `App.tsx` into a catch-all file.

- `package.json`
  Defines scripts and dependencies.
- `index.html`
  Vite entry HTML.
- `tsconfig.json`
  TypeScript compiler settings.
- `vite.config.ts`
  Vite + test runner configuration.
- `src/main.tsx`
  React bootstrap.
- `src/App.tsx`
  Top-level application flow and view switching.
- `src/styles/app.css`
  Global styles, layout, variables, and responsive rules.
- `src/domain/types.ts`
  Shared domain types for content, session state, results, achievements, and daily challenge data.
- `src/content/contentLibrary.ts`
  Static content set plus functions for category selection and deterministic daily challenge selection.
- `src/engine/typingEngine.ts`
  Pure state machine for session input, cursor position, and error handling.
- `src/scoring/sessionScoring.ts`
  Pure session metric calculations.
- `src/progress/achievementRules.ts`
  Achievement definitions and evaluation logic.
- `src/progress/storage.ts`
  Local persistence helpers and repository interface.
- `src/hooks/useTypingSession.ts`
  UI-facing hook that coordinates content, engine, scoring, and storage.
- `src/components/ModePicker.tsx`
  Practice mode and content selection controls.
- `src/components/TypingPanel.tsx`
  Live session UI, prompt rendering, and metrics display.
- `src/components/ResultsPanel.tsx`
  Results summary and unlocked achievements.
- `src/components/ProgressSidebar.tsx`
  Daily challenge card, history summary, and achievement preview.
- `src/test/testContent.ts`
  Small deterministic fixtures shared by tests.
- `src/test/renderApp.test.tsx`
  Smoke-level app rendering and flow tests.
- `src/content/contentLibrary.test.ts`
  Unit tests for content selection.
- `src/engine/typingEngine.test.ts`
  Unit tests for typing engine behavior.
- `src/scoring/sessionScoring.test.ts`
  Unit tests for scoring calculations.
- `src/progress/achievementRules.test.ts`
  Unit tests for achievements and daily challenge behavior.
- `src/progress/storage.test.ts`
  Unit tests for local persistence behavior.

## Task 1: Bootstrap the React + TypeScript App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/app.css`
- Test: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Write the failing app smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "../App";

describe("App", () => {
  it("shows the product heading and start controls", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /programmer typing trainer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start practice/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand`

Expected: FAIL with package or module resolution errors because the project scaffold does not exist yet.

- [ ] **Step 3: Add the minimal project scaffold and app shell**

`package.json`

```json
{
  "name": "programmer-typing-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

`vite.config.ts`

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
```

`src/test/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

`src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Phase 1</p>
        <h1>Programmer Typing Trainer</h1>
        <p>
          Practice code, terminal commands, and technical English with
          developer-focused feedback.
        </p>
        <button type="button">Start Practice</button>
      </section>
    </main>
  );
}
```

`src/styles/app.css`

```css
:root {
  color-scheme: dark;
  --bg: #09111f;
  --panel: #0f1b31;
  --panel-strong: #162644;
  --text: #eef4ff;
  --muted: #9db0cf;
  --accent: #5cd6ff;
  --success: #57d38c;
  --danger: #ff6b7a;
  font-family: "Cascadia Code", "Fira Code", monospace;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(92, 214, 255, 0.18), transparent 35%),
    linear-gradient(180deg, #050a13 0%, #09111f 100%);
  color: var(--text);
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
}

.hero-card {
  width: min(720px, 100%);
  padding: 32px;
  border-radius: 24px;
  background: rgba(15, 27, 49, 0.92);
  border: 1px solid rgba(157, 176, 207, 0.2);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}
```

- [ ] **Step 4: Run the smoke test and build**

Run: `npm install`

Expected: Packages install successfully.

Run: `npm test -- --runInBand`

Expected: PASS for `src/test/renderApp.test.tsx`.

Run: `npm run build`

Expected: Vite production build completes successfully.

- [ ] **Step 5: Commit**

```bash
git add package.json index.html tsconfig.json vite.config.ts src
git commit -m "feat: bootstrap typing trainer app shell"
```

## Task 2: Define Domain Types and Content Library

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/content/contentLibrary.ts`
- Create: `src/test/testContent.ts`
- Test: `src/content/contentLibrary.test.ts`

- [ ] **Step 1: Write the failing content selection tests**

```ts
import { describe, expect, it } from "vitest";

import {
  getContentByCategory,
  getDailyChallenge,
  getMixedPracticeSet,
} from "./contentLibrary";

describe("contentLibrary", () => {
  it("returns only command items for focused command practice", () => {
    const items = getContentByCategory("command");
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.category === "command")).toBe(true);
  });

  it("returns a stable daily challenge for the same date", () => {
    const first = getDailyChallenge("2026-05-05");
    const second = getDailyChallenge("2026-05-05");
    expect(second).toEqual(first);
  });

  it("builds a mixed set containing at least two categories", () => {
    const items = getMixedPracticeSet(4);
    const categories = new Set(items.map((item) => item.category));
    expect(items).toHaveLength(4);
    expect(categories.size).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/content/contentLibrary.test.ts --runInBand`

Expected: FAIL because `contentLibrary.ts` does not exist yet.

- [ ] **Step 3: Add the shared types and local content library**

`src/domain/types.ts`

```ts
export type PracticeCategory = "code" | "command" | "technical";
export type PracticeMode = "mixed" | "focused" | "daily";

export interface ContentItem {
  id: string;
  category: PracticeCategory;
  label: string;
  prompt: string;
}

export interface DailyChallenge {
  dateKey: string;
  content: ContentItem;
}

export interface SessionResult {
  mode: PracticeMode;
  category: PracticeCategory | "mixed";
  durationMs: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  wpm: number;
  accuracy: number;
  valid: boolean;
}
```

`src/content/contentLibrary.ts`

```ts
import type { ContentItem, DailyChallenge, PracticeCategory } from "../domain/types";

const CONTENT: ContentItem[] = [
  {
    id: "code-01",
    category: "code",
    label: "TypeScript function",
    prompt: "const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));",
  },
  {
    id: "code-02",
    category: "code",
    label: "Object mapping",
    prompt: "const userMap = users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});",
  },
  {
    id: "command-01",
    category: "command",
    label: "Git cleanup",
    prompt: "git fetch origin --prune && git status --short --branch",
  },
  {
    id: "command-02",
    category: "command",
    label: "Node script",
    prompt: "npm run build -- --mode production",
  },
  {
    id: "technical-01",
    category: "technical",
    label: "API sentence",
    prompt: "The handler should return a cached response when the upstream request times out.",
  },
  {
    id: "technical-02",
    category: "technical",
    label: "Docs sentence",
    prompt: "Refactor the parser so each token transformation can be tested in isolation.",
  },
];

export function getContentByCategory(category: PracticeCategory): ContentItem[] {
  return CONTENT.filter((item) => item.category === category);
}

export function getMixedPracticeSet(count: number): ContentItem[] {
  const pool = [...CONTENT];
  const items: ContentItem[] = [];

  for (let index = 0; index < count; index += 1) {
    items.push(pool[index % pool.length]);
  }

  return items;
}

export function getDailyChallenge(dateKey: string): DailyChallenge {
  const hash = [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const content = CONTENT[hash % CONTENT.length];

  return {
    dateKey,
    content,
  };
}
```

- [ ] **Step 4: Run the content tests**

Run: `npm test -- src/content/contentLibrary.test.ts --runInBand`

Expected: PASS for all three content selection tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/content/contentLibrary.ts src/content/contentLibrary.test.ts src/test/testContent.ts
git commit -m "feat: add typing content library"
```

## Task 3: Build the Pure Typing Engine

**Files:**
- Create: `src/engine/typingEngine.ts`
- Test: `src/engine/typingEngine.test.ts`

- [ ] **Step 1: Write the failing typing engine tests**

```ts
import { describe, expect, it } from "vitest";

import { createSessionState, handleCharacterInput, handleBackspace } from "./typingEngine";

describe("typingEngine", () => {
  it("marks a matching character as correct and advances the cursor", () => {
    const state = createSessionState("git");
    const next = handleCharacterInput(state, "g", 100);

    expect(next.cursor).toBe(1);
    expect(next.correctChars).toBe(1);
    expect(next.errorCount).toBe(0);
    expect(next.startedAt).toBe(100);
  });

  it("records an incorrect character without advancing the cursor", () => {
    const state = createSessionState("git");
    const next = handleCharacterInput(state, "x", 100);

    expect(next.cursor).toBe(0);
    expect(next.correctChars).toBe(0);
    expect(next.errorCount).toBe(1);
    expect(next.invalid).toBe("x");
  });

  it("allows backspace to clear the current invalid state", () => {
    const state = handleCharacterInput(createSessionState("git"), "x", 100);
    const next = handleBackspace(state);

    expect(next.invalid).toBeNull();
    expect(next.errorCount).toBe(1);
    expect(next.cursor).toBe(0);
  });
});
```

- [ ] **Step 2: Run the typing engine tests to verify they fail**

Run: `npm test -- src/engine/typingEngine.test.ts --runInBand`

Expected: FAIL because `typingEngine.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal pure typing engine**

`src/engine/typingEngine.ts`

```ts
export interface TypingSessionState {
  target: string;
  cursor: number;
  correctChars: number;
  errorCount: number;
  invalid: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

export function createSessionState(target: string): TypingSessionState {
  return {
    target,
    cursor: 0,
    correctChars: 0,
    errorCount: 0,
    invalid: null,
    startedAt: null,
    completedAt: null,
  };
}

export function handleCharacterInput(
  state: TypingSessionState,
  input: string,
  timestamp: number,
): TypingSessionState {
  const startedAt = state.startedAt ?? timestamp;
  const expected = state.target[state.cursor];

  if (input !== expected) {
    return {
      ...state,
      startedAt,
      invalid: input,
      errorCount: state.errorCount + 1,
    };
  }

  const cursor = state.cursor + 1;
  const completedAt = cursor === state.target.length ? timestamp : null;

  return {
    ...state,
    startedAt,
    cursor,
    invalid: null,
    correctChars: state.correctChars + 1,
    completedAt,
  };
}

export function handleBackspace(state: TypingSessionState): TypingSessionState {
  if (state.invalid) {
    return {
      ...state,
      invalid: null,
    };
  }

  if (state.cursor === 0) {
    return state;
  }

  return {
    ...state,
    cursor: state.cursor - 1,
    correctChars: Math.max(0, state.correctChars - 1),
    completedAt: null,
  };
}
```

- [ ] **Step 4: Run the typing engine tests**

Run: `npm test -- src/engine/typingEngine.test.ts --runInBand`

Expected: PASS for cursor advancement, incorrect character handling, and backspace behavior.

- [ ] **Step 5: Commit**

```bash
git add src/engine/typingEngine.ts src/engine/typingEngine.test.ts
git commit -m "feat: add pure typing engine"
```

## Task 4: Add Session Scoring and Achievement Rules

**Files:**
- Create: `src/scoring/sessionScoring.ts`
- Create: `src/progress/achievementRules.ts`
- Test: `src/scoring/sessionScoring.test.ts`
- Test: `src/progress/achievementRules.test.ts`

- [ ] **Step 1: Write the failing scoring and achievement tests**

```ts
import { describe, expect, it } from "vitest";

import { calculateSessionResult } from "./sessionScoring";
import { evaluateAchievements } from "../progress/achievementRules";

describe("sessionScoring", () => {
  it("computes wpm and accuracy from typed session data", () => {
    const result = calculateSessionResult({
      mode: "focused",
      category: "code",
      startedAt: 0,
      completedAt: 30000,
      totalChars: 60,
      correctChars: 60,
      errorCount: 2,
      valid: true,
    });

    expect(result.wpm).toBe(24);
    expect(result.accuracy).toBeCloseTo(96.77, 2);
  });
});

describe("achievementRules", () => {
  it("unlocks a speed achievement when the threshold is met", () => {
    const unlocked = evaluateAchievements([], {
      mode: "focused",
      category: "code",
      durationMs: 30000,
      totalChars: 60,
      correctChars: 60,
      errorCount: 0,
      wpm: 24,
      accuracy: 100,
      valid: true,
    });

    expect(unlocked.some((item) => item.id === "speed-20")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/scoring/sessionScoring.test.ts src/progress/achievementRules.test.ts --runInBand`

Expected: FAIL because the scoring and achievement modules do not exist yet.

- [ ] **Step 3: Implement session scoring and deterministic achievement rules**

`src/scoring/sessionScoring.ts`

```ts
import type { PracticeMode, SessionResult } from "../domain/types";

interface ScoreInput {
  mode: PracticeMode;
  category: SessionResult["category"];
  startedAt: number;
  completedAt: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  valid: boolean;
}

export function calculateSessionResult(input: ScoreInput): SessionResult {
  const durationMs = input.completedAt - input.startedAt;
  const minutes = durationMs / 60000;
  const wpm = Number(((input.correctChars / 5) / minutes).toFixed(2));
  const attempts = input.correctChars + input.errorCount;
  const accuracy = attempts === 0 ? 100 : Number(((input.correctChars / attempts) * 100).toFixed(2));

  return {
    mode: input.mode,
    category: input.category,
    durationMs,
    totalChars: input.totalChars,
    correctChars: input.correctChars,
    errorCount: input.errorCount,
    wpm,
    accuracy,
    valid: input.valid,
  };
}
```

`src/progress/achievementRules.ts`

```ts
import type { SessionResult } from "../domain/types";

export interface AchievementState {
  id: string;
  unlockedAt: string | null;
}

const ACHIEVEMENTS = [
  {
    id: "speed-20",
    test: (result: SessionResult) => result.valid && result.wpm >= 20,
  },
  {
    id: "accuracy-98",
    test: (result: SessionResult) => result.valid && result.accuracy >= 98,
  },
  {
    id: "command-starter",
    test: (result: SessionResult) => result.valid && result.category === "command",
  },
];

export function evaluateAchievements(
  previous: AchievementState[],
  result: SessionResult,
): AchievementState[] {
  const existingIds = new Set(previous.filter((item) => item.unlockedAt).map((item) => item.id));
  const unlockedAt = new Date().toISOString();
  const next = [...previous];

  for (const achievement of ACHIEVEMENTS) {
    if (!existingIds.has(achievement.id) && achievement.test(result)) {
      next.push({ id: achievement.id, unlockedAt });
    }
  }

  return next;
}
```

- [ ] **Step 4: Run the scoring and achievement tests**

Run: `npm test -- src/scoring/sessionScoring.test.ts src/progress/achievementRules.test.ts --runInBand`

Expected: PASS with correct WPM, accuracy, and unlock behavior.

- [ ] **Step 5: Commit**

```bash
git add src/scoring/sessionScoring.ts src/scoring/sessionScoring.test.ts src/progress/achievementRules.ts src/progress/achievementRules.test.ts
git commit -m "feat: add session scoring and achievements"
```

## Task 5: Add Local Persistence and Daily Challenge Tracking

**Files:**
- Create: `src/progress/storage.ts`
- Test: `src/progress/storage.test.ts`
- Modify: `src/domain/types.ts`

- [ ] **Step 1: Write the failing storage tests**

```ts
import { describe, expect, it } from "vitest";

import { createProgressRepository } from "./storage";

describe("storage", () => {
  it("persists and reloads session history", () => {
    const repo = createProgressRepository(localStorage);

    repo.saveSession({
      mode: "mixed",
      category: "mixed",
      durationMs: 1000,
      totalChars: 10,
      correctChars: 10,
      errorCount: 0,
      wpm: 120,
      accuracy: 100,
      valid: true,
    });

    expect(repo.getSessions()).toHaveLength(1);
  });

  it("stores completion state for the daily challenge", () => {
    const repo = createProgressRepository(localStorage);

    repo.saveDailyChallenge({
      dateKey: "2026-05-05",
      challengeId: "code-01",
      completed: true,
      bestWpm: 42,
      bestAccuracy: 99,
    });

    expect(repo.getDailyChallenge("2026-05-05")?.completed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the storage tests to verify they fail**

Run: `npm test -- src/progress/storage.test.ts --runInBand`

Expected: FAIL because `storage.ts` does not exist yet.

- [ ] **Step 3: Implement the local progress repository**

`src/domain/types.ts`

```ts
export interface StoredDailyChallenge {
  dateKey: string;
  challengeId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
}
```

`src/progress/storage.ts`

```ts
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
      storage.setItem(SESSIONS_KEY, JSON.stringify([result, ...current].slice(0, 50)));
    },
    getAchievements(): AchievementState[] {
      return safeRead(storage, ACHIEVEMENTS_KEY, []);
    },
    saveAchievements(items: AchievementState[]) {
      storage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(items));
    },
    getDailyChallenge(dateKey: string): StoredDailyChallenge | null {
      const map = safeRead<Record<string, StoredDailyChallenge>>(storage, CHALLENGES_KEY, {});
      return map[dateKey] ?? null;
    },
    saveDailyChallenge(challenge: StoredDailyChallenge) {
      const map = safeRead<Record<string, StoredDailyChallenge>>(storage, CHALLENGES_KEY, {});
      map[challenge.dateKey] = challenge;
      storage.setItem(CHALLENGES_KEY, JSON.stringify(map));
    },
  };
}
```

- [ ] **Step 4: Run the storage tests**

Run: `npm test -- src/progress/storage.test.ts --runInBand`

Expected: PASS for session history and daily challenge persistence.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/progress/storage.ts src/progress/storage.test.ts
git commit -m "feat: persist local progress state"
```

## Task 6: Build the Session Hook and Practice UI

**Files:**
- Create: `src/hooks/useTypingSession.ts`
- Create: `src/components/ModePicker.tsx`
- Create: `src/components/TypingPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Test: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Extend the app flow tests to cover starting and finishing a session**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "../App";

describe("practice flow", () => {
  it("starts a practice session and shows the result after typing the prompt", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
    const textbox = screen.getByRole("textbox", { name: /typing input/i });
    const prompt = screen.getByTestId("prompt-text").textContent ?? "";

    for (const char of prompt) {
      fireEvent.change(textbox, { target: { value: char } });
    }

    expect(screen.getByRole("heading", { name: /session results/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the app flow tests to verify they fail**

Run: `npm test -- src/test/renderApp.test.tsx --runInBand`

Expected: FAIL because the interactive practice UI and session hook are not implemented yet.

- [ ] **Step 3: Implement the session hook, mode picker, and typing panel**

`src/hooks/useTypingSession.ts`

```ts
import { useMemo, useState } from "react";

import { getContentByCategory, getDailyChallenge, getMixedPracticeSet } from "../content/contentLibrary";
import type { PracticeCategory, PracticeMode } from "../domain/types";
import { createSessionState, handleBackspace, handleCharacterInput } from "../engine/typingEngine";
import { calculateSessionResult } from "../scoring/sessionScoring";

export function useTypingSession() {
  const [mode, setMode] = useState<PracticeMode>("mixed");
  const [focusedCategory, setFocusedCategory] = useState<PracticeCategory>("code");
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionState, setSessionState] = useState(() => createSessionState(""));

  const content = useMemo(() => {
    if (mode === "focused") {
      return getContentByCategory(focusedCategory)[0];
    }
    if (mode === "daily") {
      return getDailyChallenge(new Date().toISOString().slice(0, 10)).content;
    }
    return getMixedPracticeSet(1)[sessionIndex % getMixedPracticeSet(1).length];
  }, [focusedCategory, mode, sessionIndex]);

  const result =
    sessionState.completedAt && sessionState.startedAt
      ? calculateSessionResult({
          mode,
          category: mode === "mixed" ? "mixed" : content.category,
          startedAt: sessionState.startedAt,
          completedAt: sessionState.completedAt,
          totalChars: content.prompt.length,
          correctChars: sessionState.correctChars,
          errorCount: sessionState.errorCount,
          valid: true,
        })
      : null;

  function startSession() {
    setSessionState(createSessionState(content.prompt));
  }

  function inputCharacter(char: string) {
    setSessionState((current) => handleCharacterInput(current, char, Date.now()));
  }

  function backspace() {
    setSessionState((current) => handleBackspace(current));
  }

  function nextSession() {
    setSessionIndex((value) => value + 1);
    setSessionState(createSessionState(content.prompt));
  }

  return {
    mode,
    setMode,
    focusedCategory,
    setFocusedCategory,
    content,
    sessionState,
    result,
    startSession,
    inputCharacter,
    backspace,
    nextSession,
  };
}
```

`src/components/ModePicker.tsx`

```tsx
import type { PracticeCategory, PracticeMode } from "../domain/types";

interface ModePickerProps {
  mode: PracticeMode;
  focusedCategory: PracticeCategory;
  onModeChange: (mode: PracticeMode) => void;
  onCategoryChange: (category: PracticeCategory) => void;
}

export function ModePicker({
  mode,
  focusedCategory,
  onModeChange,
  onCategoryChange,
}: ModePickerProps) {
  return (
    <section className="mode-picker">
      <h2>Practice Mode</h2>
      <div className="mode-picker__buttons">
        <button type="button" onClick={() => onModeChange("mixed")}>Mixed</button>
        <button type="button" onClick={() => onModeChange("focused")}>Focused</button>
        <button type="button" onClick={() => onModeChange("daily")}>Daily Challenge</button>
      </div>
      {mode === "focused" ? (
        <label>
          Focus category
          <select
            value={focusedCategory}
            onChange={(event) => onCategoryChange(event.target.value as PracticeCategory)}
          >
            <option value="code">Code</option>
            <option value="command">Command Line</option>
            <option value="technical">Technical English</option>
          </select>
        </label>
      ) : null}
    </section>
  );
}
```

`src/components/TypingPanel.tsx`

```tsx
import type { ContentItem, SessionResult } from "../domain/types";
import type { TypingSessionState } from "../engine/typingEngine";

interface TypingPanelProps {
  content: ContentItem;
  sessionState: TypingSessionState;
  result: SessionResult | null;
  onStart: () => void;
  onInput: (char: string) => void;
  onBackspace: () => void;
}

export function TypingPanel({
  content,
  sessionState,
  result,
  onStart,
  onInput,
  onBackspace,
}: TypingPanelProps) {
  return (
    <section className="typing-panel">
      <p className="typing-panel__label">{content.label}</p>
      <pre className="typing-panel__prompt" data-testid="prompt-text">{content.prompt}</pre>
      {!sessionState.target ? (
        <button type="button" onClick={onStart}>Start Practice</button>
      ) : null}
      {sessionState.target ? (
        <label>
          Hidden input
          <input
            aria-label="Typing input"
            type="text"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Backspace") {
                event.preventDefault();
                onBackspace();
              }
            }}
            onChange={(event) => {
              const value = event.target.value;
              const nextChar = value[value.length - 1];
              if (nextChar) {
                onInput(nextChar);
              }
              event.currentTarget.value = "";
            }}
          />
        </label>
      ) : null}
      {result ? <p className="typing-panel__complete">Prompt complete.</p> : null}
    </section>
  );
}
```

`src/App.tsx`

```tsx
import { ModePicker } from "./components/ModePicker";
import { TypingPanel } from "./components/TypingPanel";
import { useTypingSession } from "./hooks/useTypingSession";

export default function App() {
  const {
    mode,
    setMode,
    focusedCategory,
    setFocusedCategory,
    content,
    sessionState,
    result,
    startSession,
    inputCharacter,
    backspace,
  } = useTypingSession();

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Phase 1</p>
        <h1>Programmer Typing Trainer</h1>
        <p>
          Practice code, terminal commands, and technical English with
          developer-focused feedback.
        </p>
        <ModePicker
          mode={mode}
          focusedCategory={focusedCategory}
          onModeChange={setMode}
          onCategoryChange={setFocusedCategory}
        />
        <TypingPanel
          content={content}
          sessionState={sessionState}
          result={result}
          onStart={startSession}
          onInput={inputCharacter}
          onBackspace={backspace}
        />
      </section>
    </main>
  );
}
```

`src/styles/app.css`

```css
.mode-picker,
.typing-panel {
  margin-top: 24px;
  padding: 20px;
  border-radius: 18px;
  background: rgba(22, 38, 68, 0.65);
}

.mode-picker__buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.typing-panel__prompt {
  overflow-x: auto;
  padding: 18px;
  border-radius: 14px;
  background: rgba(5, 10, 19, 0.85);
  color: var(--accent);
}
```

- [ ] **Step 4: Run the app flow tests**

Run: `npm test -- src/test/renderApp.test.tsx --runInBand`

Expected: PASS with a complete happy-path practice flow.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTypingSession.ts src/components/ModePicker.tsx src/components/TypingPanel.tsx src/App.tsx src/styles/app.css src/test/renderApp.test.tsx
git commit -m "feat: add interactive practice flow"
```

## Task 7: Add Results, Progress Sidebar, and Daily Challenge Completion

**Files:**
- Create: `src/components/ResultsPanel.tsx`
- Create: `src/components/ProgressSidebar.tsx`
- Modify: `src/hooks/useTypingSession.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Test: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Extend the flow test to verify progress UI**

```tsx
it("stores completed sessions and shows the daily challenge card", () => {
  render(<App />);

  expect(screen.getByText(/daily challenge/i)).toBeInTheDocument();
  expect(screen.getByText(/recent sessions/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the flow test to verify it fails**

Run: `npm test -- src/test/renderApp.test.tsx --runInBand`

Expected: FAIL because results and progress sidebar UI are not rendered yet.

- [ ] **Step 3: Wire storage, achievements, and results into the app shell**

`src/components/ResultsPanel.tsx`

```tsx
import type { SessionResult } from "../domain/types";

interface ResultsPanelProps {
  result: SessionResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <section className="results-panel" aria-labelledby="results-heading">
      <h2 id="results-heading">Session Results</h2>
      <dl>
        <div><dt>WPM</dt><dd>{result.wpm}</dd></div>
        <div><dt>Accuracy</dt><dd>{result.accuracy}%</dd></div>
        <div><dt>Errors</dt><dd>{result.errorCount}</dd></div>
      </dl>
    </section>
  );
}
```

`src/components/ProgressSidebar.tsx`

```tsx
import type { SessionResult, StoredDailyChallenge } from "../domain/types";
import type { AchievementState } from "../progress/achievementRules";

interface ProgressSidebarProps {
  sessions: SessionResult[];
  dailyChallenge: StoredDailyChallenge | null;
  achievements: AchievementState[];
}

export function ProgressSidebar({
  sessions,
  dailyChallenge,
  achievements,
}: ProgressSidebarProps) {
  return (
    <aside className="progress-sidebar">
      <section>
        <h2>Daily Challenge</h2>
        <p>{dailyChallenge?.completed ? "Completed today" : "Not completed yet"}</p>
      </section>
      <section>
        <h2>Recent Sessions</h2>
        <p>{sessions.length} sessions saved locally</p>
      </section>
      <section>
        <h2>Achievements</h2>
        <p>{achievements.length} unlocked</p>
      </section>
    </aside>
  );
}
```

`src/hooks/useTypingSession.ts`

```ts
import { useEffect, useMemo, useState } from "react";

import { getContentByCategory, getDailyChallenge, getMixedPracticeSet } from "../content/contentLibrary";
import type { PracticeCategory, PracticeMode } from "../domain/types";
import { createSessionState, handleBackspace, handleCharacterInput } from "../engine/typingEngine";
import { evaluateAchievements } from "../progress/achievementRules";
import { createProgressRepository } from "../progress/storage";
import { calculateSessionResult } from "../scoring/sessionScoring";

const repository = createProgressRepository(window.localStorage);

export function useTypingSession() {
  const [mode, setMode] = useState<PracticeMode>("mixed");
  const [focusedCategory, setFocusedCategory] = useState<PracticeCategory>("code");
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionState, setSessionState] = useState(() => createSessionState(""));
  const [sessions, setSessions] = useState(() => repository.getSessions());
  const [achievements, setAchievements] = useState(() => repository.getAchievements());

  const dateKey = new Date().toISOString().slice(0, 10);
  const content = useMemo(() => {
    if (mode === "focused") {
      return getContentByCategory(focusedCategory)[0];
    }
    if (mode === "daily") {
      return getDailyChallenge(dateKey).content;
    }
    const mixed = getMixedPracticeSet(6);
    return mixed[sessionIndex % mixed.length];
  }, [dateKey, focusedCategory, mode, sessionIndex]);

  const dailyChallenge = repository.getDailyChallenge(dateKey);
  const result =
    sessionState.completedAt && sessionState.startedAt
      ? calculateSessionResult({
          mode,
          category: mode === "mixed" ? "mixed" : content.category,
          startedAt: sessionState.startedAt,
          completedAt: sessionState.completedAt,
          totalChars: content.prompt.length,
          correctChars: sessionState.correctChars,
          errorCount: sessionState.errorCount,
          valid: true,
        })
      : null;

  useEffect(() => {
    if (!result) {
      return;
    }

    repository.saveSession(result);
    const nextSessions = repository.getSessions();
    setSessions(nextSessions);

    const nextAchievements = evaluateAchievements(repository.getAchievements(), result);
    repository.saveAchievements(nextAchievements);
    setAchievements(nextAchievements);

    if (mode === "daily") {
      repository.saveDailyChallenge({
        dateKey,
        challengeId: content.id,
        completed: true,
        bestWpm: Math.max(dailyChallenge?.bestWpm ?? 0, result.wpm),
        bestAccuracy: Math.max(dailyChallenge?.bestAccuracy ?? 0, result.accuracy),
      });
    }
  }, [content.id, dailyChallenge?.bestAccuracy, dailyChallenge?.bestWpm, dateKey, mode, result]);

  return {
    mode,
    setMode,
    focusedCategory,
    setFocusedCategory,
    content,
    sessionState,
    result,
    sessions,
    achievements,
    dailyChallenge: repository.getDailyChallenge(dateKey),
    startSession() {
      setSessionState(createSessionState(content.prompt));
    },
    inputCharacter(char: string) {
      setSessionState((current) => handleCharacterInput(current, char, Date.now()));
    },
    backspace() {
      setSessionState((current) => handleBackspace(current));
    },
    nextSession() {
      setSessionIndex((value) => value + 1);
      setSessionState(createSessionState(content.prompt));
    },
  };
}
```

`src/App.tsx`

```tsx
import { ModePicker } from "./components/ModePicker";
import { ProgressSidebar } from "./components/ProgressSidebar";
import { ResultsPanel } from "./components/ResultsPanel";
import { TypingPanel } from "./components/TypingPanel";
import { useTypingSession } from "./hooks/useTypingSession";

export default function App() {
  const session = useTypingSession();

  return (
    <main className="app-shell">
      <div className="dashboard">
        <section className="hero-card">
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
          {session.result ? <ResultsPanel result={session.result} /> : null}
        </section>
        <ProgressSidebar
          sessions={session.sessions}
          dailyChallenge={session.dailyChallenge}
          achievements={session.achievements}
        />
      </div>
    </main>
  );
}
```

`src/styles/app.css`

```css
.dashboard {
  width: min(1200px, 100%);
  display: grid;
  gap: 24px;
  align-items: start;
}

.progress-sidebar,
.results-panel {
  padding: 20px;
  border-radius: 18px;
  background: rgba(15, 27, 49, 0.92);
  border: 1px solid rgba(157, 176, 207, 0.2);
}
```

- [ ] **Step 4: Run the app flow test**

Run: `npm test -- src/test/renderApp.test.tsx --runInBand`

Expected: PASS and show progress-related UI after render and completed sessions.

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultsPanel.tsx src/components/ProgressSidebar.tsx src/hooks/useTypingSession.ts src/App.tsx src/styles/app.css src/test/renderApp.test.tsx
git commit -m "feat: add progress sidebar and results view"
```

## Task 8: Polish Content States, Responsive Styling, and Full Verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/content/contentLibrary.ts`
- Modify: `src/test/renderApp.test.tsx`
- Modify: `src/engine/typingEngine.test.ts`

- [ ] **Step 1: Add failing tests for symbol emphasis and empty-state handling**

```ts
it("keeps symbol-heavy prompts available in mixed practice", () => {
  const items = getMixedPracticeSet(6);
  expect(items.some((item) => /[{}()[\]=><;:_]/.test(item.prompt))).toBe(true);
});
```

```tsx
it("shows a friendly message when a focused category has no content", () => {
  render(<App />);
  expect(screen.queryByText(/no practice content available/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the full test suite to verify at least one new test fails**

Run: `npm test -- --runInBand`

Expected: FAIL until empty-state handling and content coverage are tightened.

- [ ] **Step 3: Implement the final quality pass**

Apply these code-level changes:

- Extend `src/content/contentLibrary.ts` so each category has at least four content items and mixed practice includes visible symbol-heavy entries.
- Update `src/App.tsx` to render a friendly fallback message when the selected focused category has no content.
- Update `src/styles/app.css` with a two-column desktop layout that collapses to one column below `960px`.
- Add `.prompt-char--correct`, `.prompt-char--error`, and `.prompt-char--cursor` styles so live typing feedback is easy to read.

Use this layout rule in `src/styles/app.css`:

```css
.dashboard {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 24px;
}

@media (max-width: 960px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run the full verification commands**

Run: `npm test -- --runInBand`

Expected: PASS for the entire unit and integration test suite.

Run: `npm run build`

Expected: Successful production build with no TypeScript errors.

Manual verification:

- Start the dev server with `npm run dev`.
- Confirm mixed mode, focused mode, and daily challenge mode all render.
- Type through one code prompt and one command prompt.
- Confirm incorrect symbol input is visually obvious.
- Confirm the layout remains readable on a narrow browser width.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/styles/app.css src/content/contentLibrary.ts src/test/renderApp.test.tsx src/engine/typingEngine.test.ts
git commit -m "feat: polish typing trainer experience"
```

## Plan Review Notes

Spec coverage check:

- Mixed practice, focused practice, and daily challenge are covered by Tasks 2, 6, and 7.
- The pure typing engine and strict character handling are covered by Task 3.
- WPM, accuracy, result summaries, and achievements are covered by Task 4.
- Local persistence and daily challenge status are covered by Task 5.
- Product shell, responsive layout, and manual interaction checks are covered by Tasks 1, 6, 7, and 8.

Placeholder scan:

- No `TODO`, `TBD`, or deferred placeholders remain in this plan.
- Each task includes explicit file paths, commands, and code-level direction.

Type consistency check:

- The plan uses `PracticeMode`, `PracticeCategory`, `SessionResult`, and `StoredDailyChallenge` consistently across later tasks.
- `calculateSessionResult`, `evaluateAchievements`, and `createProgressRepository` are referenced only after being defined in earlier tasks.
