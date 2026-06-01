# Auth Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real email/password authentication backend plus frontend login flow so the typing trainer supports persistent signed-in users.

**Architecture:** Introduce a small Express + SQLite backend under `server/` with cookie-based JWT auth, then gate the existing React app behind an auth bootstrap flow under `src/auth/`. Keep the typing trainer itself intact by wrapping it in authenticated app state instead of rewriting trainer logic.

**Tech Stack:** Node.js, Express, SQLite, bcrypt, jsonwebtoken, React, Vite, Vitest, Testing Library

---

## File Structure

### New backend files

- `server/index.ts`: starts the backend HTTP server
- `server/app.ts`: builds the Express app, middleware, and route registration
- `server/config.ts`: reads backend environment variables and defaults
- `server/db/client.ts`: creates the SQLite database connection
- `server/db/init.ts`: creates the `users` table if it does not exist
- `server/repositories/userRepository.ts`: user read/write helpers
- `server/services/authService.ts`: register/login/token logic
- `server/middleware/auth.ts`: identifies the current user from the auth cookie
- `server/routes/auth.ts`: `/api/auth/*` routes
- `server/types/auth.ts`: auth request and response types
- `server/test/authRoutes.test.ts`: backend auth integration tests

### New frontend files

- `src/auth/authApi.ts`: frontend API calls for auth endpoints
- `src/auth/authTypes.ts`: frontend auth types
- `src/auth/useAuth.ts`: auth bootstrap and actions
- `src/components/AuthGate.tsx`: gates the trainer behind auth state
- `src/components/AuthForm.tsx`: login/register form UI

### Modified existing files

- `package.json`: add backend dependencies, scripts, and test support
- `vite.config.ts`: add API proxy for `/api`
- `src/App.tsx`: render auth gate instead of directly rendering trainer UI
- `src/styles/app.css`: auth screen styling and signed-in header styling
- `src/test/renderApp.test.tsx`: update frontend tests for unauthenticated and authenticated flows
- `src/test/setup.ts`: add fetch and cookie-friendly test helpers if needed

---

### Task 1: Create the Backend Skeleton

**Files:**
- Create: `server/index.ts`
- Create: `server/app.ts`
- Create: `server/config.ts`
- Create: `server/db/client.ts`
- Create: `server/db/init.ts`
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Write the failing configuration smoke test**

Create `server/test/authRoutes.test.ts` with a first backend boot test:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("auth backend bootstrap", () => {
  it("responds to unauthenticated me requests", async () => {
    const app = createApp();
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- server/test/authRoutes.test.ts`

Expected: FAIL because backend app files and route handlers do not exist yet.

- [ ] **Step 3: Add backend dependencies and scripts**

Update `package.json` to add the minimal backend toolchain:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "tsc -b && vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "test": "vitest run"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sqlite": "^5.1.1",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.8",
    "@types/express": "^5.0.1",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/supertest": "^6.0.3",
    "supertest": "^7.0.0",
    "tsx": "^4.19.3"
  }
}
```

- [ ] **Step 4: Add the minimal backend app skeleton**

Create `server/config.ts`:

```ts
export const config = {
  port: Number(process.env.AUTH_SERVER_PORT ?? "3001"),
  jwtSecret: process.env.AUTH_JWT_SECRET ?? "dev-only-secret",
  authCookieName: "typing_auth",
  databasePath: process.env.AUTH_DB_PATH ?? "./data/auth.sqlite",
};
```

Create `server/db/client.ts`:

```ts
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { config } from "../config";

export async function createDatabase() {
  await mkdir(dirname(config.databasePath), { recursive: true });

  return open({
    filename: config.databasePath,
    driver: sqlite3.Database,
  });
}
```

Create `server/db/init.ts`:

```ts
import type { Database } from "sqlite";

export async function initDatabase(db: Database) {
  await db.exec(`
    create table if not exists users (
      id text primary key,
      email text not null unique,
      password_hash text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
}
```

Create `server/app.ts`:

```ts
import cookieParser from "cookie-parser";
import express from "express";

import { config } from "./config";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser(config.jwtSecret));

  app.get("/api/auth/me", (_request, response) => {
    response.status(200).json({ user: null });
  });

  return app;
}
```

Create `server/index.ts`:

```ts
import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`Auth server listening on http://localhost:${config.port}`);
});
```

Update `vite.config.ts`:

```ts
server: {
  proxy: {
    "/api": "http://localhost:3001",
  },
},
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm.cmd test -- server/test/authRoutes.test.ts`

Expected: PASS with one passing bootstrap test.

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.ts server
git commit -m "feat: add auth backend scaffold"
```

### Task 2: Implement User Storage and Auth Service

**Files:**
- Create: `server/types/auth.ts`
- Create: `server/repositories/userRepository.ts`
- Create: `server/services/authService.ts`
- Modify: `server/app.ts`
- Modify: `server/db/init.ts`
- Test: `server/test/authRoutes.test.ts`

- [ ] **Step 1: Extend backend tests for registration and login rules**

Add these tests to `server/test/authRoutes.test.ts`:

```ts
it("registers a user with valid email and password", async () => {
  const app = createApp();

  const response = await request(app).post("/api/auth/register").send({
    email: "dev@example.com",
    password: "strong-pass-123",
  });

  expect(response.status).toBe(201);
  expect(response.body.user.email).toBe("dev@example.com");
  expect(response.body.user).not.toHaveProperty("password_hash");
});

it("rejects duplicate email registration", async () => {
  const app = createApp();

  await request(app).post("/api/auth/register").send({
    email: "dup@example.com",
    password: "strong-pass-123",
  });

  const duplicate = await request(app).post("/api/auth/register").send({
    email: "dup@example.com",
    password: "strong-pass-123",
  });

  expect(duplicate.status).toBe(409);
  expect(duplicate.body).toEqual({ error: "Email already registered" });
});

it("logs in a user with valid credentials", async () => {
  const app = createApp();

  await request(app).post("/api/auth/register").send({
    email: "login@example.com",
    password: "strong-pass-123",
  });

  const response = await request(app).post("/api/auth/login").send({
    email: "login@example.com",
    password: "strong-pass-123",
  });

  expect(response.status).toBe(200);
  expect(response.body.user.email).toBe("login@example.com");
});

it("rejects invalid credentials", async () => {
  const app = createApp();

  const response = await request(app).post("/api/auth/login").send({
    email: "missing@example.com",
    password: "wrong-pass",
  });

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ error: "Invalid credentials" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- server/test/authRoutes.test.ts`

Expected: FAIL because `/api/auth/register` and `/api/auth/login` do not exist yet.

- [ ] **Step 3: Add repository and service types**

Create `server/types/auth.ts`:

```ts
export interface AuthPayload {
  email: string;
  password: string;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  createdAt: string;
}
```

Create `server/repositories/userRepository.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { Database } from "sqlite";

import type { UserRecord } from "../types/auth";

export function createUserRepository(db: Database) {
  return {
    async findByEmail(email: string) {
      return db.get<UserRecord>(
        "select * from users where email = ?",
        email,
      );
    },
    async findById(id: string) {
      return db.get<UserRecord>("select * from users where id = ?", id);
    },
    async create(email: string, passwordHash: string) {
      const now = new Date().toISOString();
      const user: UserRecord = {
        id: randomUUID(),
        email,
        password_hash: passwordHash,
        created_at: now,
        updated_at: now,
      };

      await db.run(
        "insert into users (id, email, password_hash, created_at, updated_at) values (?, ?, ?, ?, ?)",
        user.id,
        user.email,
        user.password_hash,
        user.created_at,
        user.updated_at,
      );

      return user;
    },
  };
}
```

Create `server/services/authService.ts`:

```ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { config } from "../config";
import type { PublicUser, UserRecord } from "../types/auth";

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalizedEmail)) {
    throw new Error("Invalid email");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  return { normalizedEmail, password };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signUserToken(user: UserRecord) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyUserToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as { sub: string };
}
```

- [ ] **Step 4: Wire registration and login service flow**

Update `server/app.ts` so it:

```ts
import { createDatabase } from "./db/client";
import { initDatabase } from "./db/init";
import { createUserRepository } from "./repositories/userRepository";
import {
  hashPassword,
  normalizeEmail,
  signUserToken,
  toPublicUser,
  validateCredentials,
  verifyPassword,
} from "./services/authService";
```

and route logic:

```ts
app.post("/api/auth/register", async (request, response) => {
  try {
    const { normalizedEmail, password } = validateCredentials(
      request.body.email ?? "",
      request.body.password ?? "",
    );

    if (await userRepository.findByEmail(normalizedEmail)) {
      response.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create(normalizedEmail, passwordHash);
    const token = signUserToken(user);

    response.cookie(config.authCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    response.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid email") {
      response.status(400).json({ error: "Invalid email" });
      return;
    }
    if (
      error instanceof Error &&
      error.message === "Password must be at least 8 characters"
    ) {
      response.status(400).json({ error: error.message });
      return;
    }
    response.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (request, response) => {
  const email = normalizeEmail(request.body.email ?? "");
  const password = String(request.body.password ?? "");
  const user = await userRepository.findByEmail(email);

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    response.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signUserToken(user);
  response.cookie(config.authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  response.status(200).json({ user: toPublicUser(user) });
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm.cmd test -- server/test/authRoutes.test.ts`

Expected: PASS with registration and login tests green.

- [ ] **Step 6: Commit**

```bash
git add server package.json
git commit -m "feat: add auth registration and login services"
```

### Task 3: Add Cookie Session Restoration and Logout

**Files:**
- Create: `server/middleware/auth.ts`
- Create: `server/routes/auth.ts`
- Modify: `server/app.ts`
- Modify: `server/services/authService.ts`
- Test: `server/test/authRoutes.test.ts`

- [ ] **Step 1: Write failing tests for `/me` and logout**

Add these tests to `server/test/authRoutes.test.ts`:

```ts
it("returns the authenticated user from /api/auth/me", async () => {
  const app = createApp();
  const agent = request.agent(app);

  await agent.post("/api/auth/register").send({
    email: "session@example.com",
    password: "strong-pass-123",
  });

  const response = await agent.get("/api/auth/me");

  expect(response.status).toBe(200);
  expect(response.body.user.email).toBe("session@example.com");
});

it("clears the session on logout", async () => {
  const app = createApp();
  const agent = request.agent(app);

  await agent.post("/api/auth/register").send({
    email: "logout@example.com",
    password: "strong-pass-123",
  });

  await agent.post("/api/auth/logout");
  const response = await agent.get("/api/auth/me");

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ user: null });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- server/test/authRoutes.test.ts`

Expected: FAIL because `/me` still returns `null` and logout does not clear auth.

- [ ] **Step 3: Add middleware and route modules**

Create `server/middleware/auth.ts`:

```ts
import type { NextFunction, Request, Response } from "express";

import { config } from "../config";
import { verifyUserToken } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

export function authMiddleware(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
) {
  const token = request.cookies[config.authCookieName];

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyUserToken(token);
    request.authUserId = payload.sub;
  } catch {
    request.authUserId = undefined;
  }

  next();
}
```

Create `server/routes/auth.ts`:

```ts
import { Router } from "express";

import { config } from "../config";
import type { AuthenticatedRequest } from "../middleware/auth";
import { toPublicUser } from "../services/authService";

export function createAuthRouter(dependencies: {
  getCurrentUser: (request: AuthenticatedRequest) => Promise<unknown | null>;
  registerHandler: Router["post"];
  loginHandler: Router["post"];
}) {
  const router = Router();

  dependencies.registerHandler.call(router, "/register");
  dependencies.loginHandler.call(router, "/login");

  router.post("/logout", (_request, response) => {
    response.clearCookie(config.authCookieName);
    response.status(200).json({ ok: true });
  });

  router.get("/me", async (request: AuthenticatedRequest, response) => {
    const user = await dependencies.getCurrentUser(request);
    response.status(200).json({ user: user ? toPublicUser(user as never) : null });
  });

  return router;
}
```

- [ ] **Step 4: Wire middleware, current-user lookup, and logout**

Update `server/app.ts` to:

```ts
app.use(authMiddleware);

const getCurrentUser = async (request: AuthenticatedRequest) => {
  if (!request.authUserId) {
    return null;
  }

  return userRepository.findById(request.authUserId);
};
```

and make sure:

- `/api/auth/me` looks up `request.authUserId`
- `/api/auth/logout` clears the cookie
- the app mounts routes under `/api/auth`

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm.cmd test -- server/test/authRoutes.test.ts`

Expected: PASS with session restoration and logout behavior working through cookies.

- [ ] **Step 6: Commit**

```bash
git add server
git commit -m "feat: add auth session restoration and logout"
```

### Task 4: Build the Frontend Auth Gate

**Files:**
- Create: `src/auth/authTypes.ts`
- Create: `src/auth/authApi.ts`
- Create: `src/auth/useAuth.ts`
- Create: `src/components/AuthForm.tsx`
- Create: `src/components/AuthGate.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Test: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Write failing frontend auth-gate tests**

Add these tests to `src/test/renderApp.test.tsx`:

```ts
it("shows the auth form when no authenticated user is returned", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ user: null }),
  }));

  render(<App />);

  expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
});

it("shows the trainer when an authenticated user is returned", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      user: { id: "u1", email: "dev@example.com", createdAt: "2026-05-05T10:00:00.000Z" },
    }),
  }));

  render(<App />);

  expect(
    await screen.findByRole("heading", { name: /programmer typing trainer/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/dev@example.com/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: FAIL because the app always renders the trainer and has no auth bootstrap flow.

- [ ] **Step 3: Add the frontend auth state layer**

Create `src/auth/authTypes.ts`:

```ts
export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser | null;
}
```

Create `src/auth/authApi.ts`:

```ts
import type { AuthResponse } from "./authTypes";

export async function fetchCurrentUser() {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  return (await response.json()) as AuthResponse;
}

export async function login(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  return response;
}

export async function register(email: string, password: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  return response;
}

export async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
```

Create `src/auth/useAuth.ts`:

```ts
import { useEffect, useState } from "react";

import * as authApi from "./authApi";
import type { AuthUser } from "./authTypes";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .fetchCurrentUser()
      .then((result) => setUser(result.user))
      .catch(() => setError("Unable to restore session"))
      .finally(() => setLoading(false));
  }, []);

  return { user, setUser, loading, error, setError };
}
```

- [ ] **Step 4: Add auth form and gate components**

Create `src/components/AuthForm.tsx`:

```tsx
import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (email: string, password: string) => Promise<void>;
  error: string | null;
}

export function AuthForm({ mode, onSubmit, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="auth-card">
      <h1>{mode === "login" ? "Sign In" : "Create Account"}</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(email, password);
        }}
      >
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p>{error}</p> : null}
        <button type="submit">{mode === "login" ? "Sign In" : "Register"}</button>
      </form>
    </section>
  );
}
```

Create `src/components/AuthGate.tsx`:

```tsx
import { useState } from "react";

import * as authApi from "../auth/authApi";
import { useAuth } from "../auth/useAuth";
import { AuthForm } from "./AuthForm";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, setUser, loading, error, setError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  if (loading) {
    return <main className="auth-shell"><p>Restoring session...</p></main>;
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <AuthForm
          mode={mode}
          error={error}
          onSubmit={async (email, password) => {
            setError(null);
            const response =
              mode === "login"
                ? await authApi.login(email, password)
                : await authApi.register(email, password);
            const body = await response.json();

            if (!response.ok) {
              setError(body.error ?? "Authentication failed");
              return;
            }

            setUser(body.user);
          }}
        />
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
      </main>
    );
  }

  return (
    <>
      <header className="signed-in-bar">
        <span>{user.email}</span>
        <button
          type="button"
          onClick={async () => {
            await authApi.logout();
            setUser(null);
          }}
        >
          Log Out
        </button>
      </header>
      {children}
    </>
  );
}
```

- [ ] **Step 5: Mount the auth gate and style it**

Update `src/App.tsx`:

```tsx
import { AuthGate } from "./components/AuthGate";

export default function App() {
  return (
    <AuthGate>
      <TrainerApp />
    </AuthGate>
  );
}
```

where `TrainerApp` contains the current session-driven UI extracted from the existing app body.

Add to `src/styles/app.css`:

```css
.auth-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
}

.auth-card {
  width: min(420px, 100%);
  padding: 24px;
  border-radius: 20px;
  background: rgba(15, 27, 49, 0.92);
}

.signed-in-bar {
  width: min(1200px, 100%);
  margin: 24px auto 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--muted);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS with auth entry and authenticated app rendering both covered.

- [ ] **Step 7: Commit**

```bash
git add src package.json vite.config.ts
git commit -m "feat: add frontend auth gate"
```

### Task 5: Final Integration and Verification

**Files:**
- Modify: `src/test/setup.ts`
- Modify: `package.json`
- Modify: `docs` only if usage notes are needed
- Test: `server/test/authRoutes.test.ts`
- Test: `src/test/renderApp.test.tsx`

- [ ] **Step 1: Add full integration tests for logout and bootstrap**

Extend `src/test/renderApp.test.tsx` with:

```ts
it("logs out back to the auth form", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: "u1", email: "dev@example.com", createdAt: "2026-05-05T10:00:00.000Z" },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

  vi.stubGlobal("fetch", fetchMock);

  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: /log out/i }));

  expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run targeted tests**

Run: `npm.cmd test -- server/test/authRoutes.test.ts`

Expected: PASS

Run: `npm.cmd test -- src/test/renderApp.test.tsx`

Expected: PASS

- [ ] **Step 3: Run full project verification**

Run: `npm.cmd test`

Expected: PASS across backend and frontend tests.

Run: `npm.cmd run build`

Expected: PASS for frontend build. If the backend has a separate TypeScript build step, also run:

`npm.cmd run build:server`

Expected: PASS

- [ ] **Step 4: Manual verification checklist**

Run backend:

`npm.cmd run dev:server`

Run frontend:

`npm.cmd run dev`

Verify:

- register with a new account
- refresh and remain signed in
- log out and return to auth form
- log in again with the same account
- invalid password shows a generic error

- [ ] **Step 5: Commit**

```bash
git add src server package.json vite.config.ts
git commit -m "test: verify auth backend integration"
```

## Self-Review

Spec coverage:

- backend service creation: Tasks 1-3
- secure password storage: Task 2
- cookie-based auth and `/me`: Task 3
- frontend auth flows: Task 4
- testing and manual verification: Task 5

Placeholder scan:

- No `TODO`, `TBD`, or vague “handle later” instructions remain
- Every task includes files, commands, and concrete snippets

Type consistency:

- `AuthUser`, `AuthResponse`, `UserRecord`, and `PublicUser` are defined once and reused consistently
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, and `/api/auth/me` are the only auth endpoints referenced throughout
