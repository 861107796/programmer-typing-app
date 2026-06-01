# Auth Backend Design

Date: 2026-05-05
Status: Approved for spec review

## Overview

This document defines the first backend phase for the programmer typing trainer: adding a real email-and-password authentication system to a project that is currently a frontend-only Vite application.

The goal of this phase is to turn the app from a local-only typing trainer into a product with real user identity. This phase establishes the backend boundary, persistence layer, authentication model, and frontend authentication flow needed for later cloud sync, leaderboards, and admin tooling.

## Product Goal

Add a complete, production-shaped authentication foundation with email registration, email login, logout, and current-user session restoration so the app can support persistent user accounts and future server-backed features.

## Scope

This phase includes:

- Creating a backend service for authentication
- Adding user registration with email and password
- Adding user login with email and password
- Adding logout
- Adding current-user lookup for session restoration
- Storing users in a real database
- Hashing passwords securely before storage
- Protecting authenticated routes with server-side user identification
- Updating the frontend to show authentication screens and signed-in state

This phase excludes:

- Password reset
- Email verification
- OAuth or social login
- Profile editing
- Cloud sync for practice history
- Leaderboards
- Admin tools
- Role-based permissions

## Recommended Stack

Recommended backend stack:

- `Node.js`
- `Express`
- `SQLite`
- `bcrypt` for password hashing
- `jsonwebtoken` or an equivalent JWT library
- `HttpOnly` cookies for session transport

Recommended frontend additions:

- Authentication state in React
- Login and registration forms
- Session bootstrap request on app load

This stack keeps the first backend phase simple to run locally while still being structurally correct for a real product.

## Architecture

The project should become a two-part application:

1. `frontend`
The existing Vite + React app remains responsible for UI, typing logic, and local interaction.

2. `backend`
A new Express server handles authentication, persistence, and user identity for protected routes.

The frontend should communicate with the backend over HTTP under an `/api` namespace. Authentication state should be restored by calling a current-user endpoint instead of reading raw tokens in the browser.

## Backend Responsibilities

The backend should be responsible for:

- Validating registration and login payloads
- Creating user records
- Hashing and verifying passwords
- Issuing authenticated sessions
- Identifying the current user for incoming requests
- Rejecting unauthorized access to protected endpoints

The backend should not be responsible for typing gameplay, scoring, or prompt rendering in this phase.

## Frontend Responsibilities

The frontend should be responsible for:

- Showing login and registration flows
- Submitting authentication forms
- Restoring session state on page load
- Showing the typing application only after authentication is established
- Letting the user log out

The frontend should not store password hashes, implement trust-sensitive auth decisions, or treat local UI state as proof of identity.

## Data Model

This phase needs one core table: `users`.

Recommended fields:

- `id`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

Field expectations:

- `id` should be a stable primary key
- `email` should be unique
- `password_hash` should never be exposed to the client
- timestamps should be stored for future auditing and profile features

The table is intentionally minimal. It is enough to support real authentication without prematurely adding profile or application-specific fields.

## Authentication Model

The recommended model is:

- Validate credentials on the server
- Issue a signed token after successful authentication
- Send that token in an `HttpOnly` cookie
- Use a backend middleware layer to parse the cookie, validate the token, and attach the user to the request
- Use `/api/auth/me` to restore frontend session state

This approach is preferred over storing raw JWTs in `localStorage` because the browser cannot directly read `HttpOnly` cookies, which reduces exposure to client-side token theft.

## Authentication Routes

This phase should expose four authentication endpoints.

### `POST /api/auth/register`

Purpose:

- Create a new user account
- Establish a signed-in session immediately after registration

Input:

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

Success response shape:

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "createdAt": "2026-05-05T10:00:00.000Z"
  }
}
```

### `POST /api/auth/login`

Purpose:

- Validate an existing user
- Establish a signed-in session

Input:

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

Success response shape:

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "createdAt": "2026-05-05T10:00:00.000Z"
  }
}
```

### `POST /api/auth/logout`

Purpose:

- Clear the authentication cookie
- End the authenticated browser session

Success response shape:

```json
{
  "ok": true
}
```

### `GET /api/auth/me`

Purpose:

- Return the currently authenticated user if a valid session exists
- Let the frontend restore login state after refresh

Authenticated response:

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "createdAt": "2026-05-05T10:00:00.000Z"
  }
}
```

Unauthenticated response:

```json
{
  "user": null
}
```

## Validation Rules

Authentication inputs should follow explicit rules.

### Email

- Required
- Trim surrounding whitespace
- Normalize to lowercase before uniqueness checks
- Must match a reasonable email format check

### Password

- Required
- Minimum length: 8 characters
- Stored only as a hash
- Never returned in any response

### Duplicate Accounts

- Registration must fail if the normalized email already exists

### Login Errors

- Login failure messages should not reveal whether the email or password was wrong
- A generic invalid-credentials response is preferred

## Error Handling

Authentication should fail clearly without leaking sensitive information.

Recommended cases:

- Invalid request body: `400`
- Duplicate email registration: `409`
- Invalid credentials: `401`
- Missing or invalid authenticated session for protected routes: `401`
- Unexpected server or database failure: `500`

The error payloads should be simple and consistent, such as:

```json
{
  "error": "Invalid credentials"
}
```

## Backend File Structure

Recommended new backend-oriented structure:

- `server/index.ts`
- `server/app.ts`
- `server/routes/auth.ts`
- `server/middleware/auth.ts`
- `server/services/authService.ts`
- `server/db/client.ts`
- `server/db/init.ts`
- `server/repositories/userRepository.ts`
- `server/types/auth.ts`

Responsibilities:

- `index.ts`: starts the HTTP server
- `app.ts`: creates the Express app, middleware, and route registration
- `routes/auth.ts`: request-to-service wiring for auth routes
- `middleware/auth.ts`: identifies current user from cookie token
- `authService.ts`: registration, login, token issuance, token verification
- `db/client.ts`: SQLite connection setup
- `db/init.ts`: create tables if missing
- `userRepository.ts`: user persistence and lookup
- `types/auth.ts`: shared request and response types where useful

This structure keeps authentication logic separated from routing and persistence so later backend features can reuse the same patterns.

## Frontend Integration

The frontend should gain a lightweight authentication layer without rewriting the typing app.

Recommended frontend additions:

- `src/auth/` folder for auth-specific state and API calls
- login form UI
- registration form UI
- auth session bootstrap on app startup
- logout control in the signed-in UI

Recommended frontend behavior:

1. On initial load, call `/api/auth/me`
2. While waiting, show a loading or bootstrapping state
3. If a user is returned, show the app
4. If no user is returned, show auth entry UI

The existing typing experience should remain intact after sign-in. Authentication should gate access, not redesign the trainer itself.

## Protected Route Foundation

This phase should establish a reusable protection model for future backend features.

That means the backend should support:

- middleware that identifies a user when a valid cookie is present
- route helpers or patterns that reject unauthenticated access

Even if no non-auth protected endpoints ship yet, this foundation should exist so later sync and leaderboard endpoints do not invent their own auth logic.

## Local Development Expectations

The project should remain easy to run on one machine.

Recommended local workflow:

- frontend Vite dev server runs for the UI
- backend Express dev server runs separately for APIs
- frontend requests are configured to reach the backend cleanly during local development

This likely means adding a Vite dev proxy or equivalent local API configuration so the browser can call `/api/...` without awkward manual URL changes.

## Testing Strategy

Testing should treat authentication as infrastructure, not just UI behavior.

### Backend Tests

Required coverage:

- register succeeds with valid email and password
- register fails for duplicate email
- register fails for invalid email
- register fails for short password
- login succeeds for correct credentials
- login fails for incorrect credentials
- `/api/auth/me` returns the authenticated user when cookie is valid
- `/api/auth/me` returns no user when not signed in
- logout clears the session

### Frontend Tests

Required coverage:

- unauthenticated users see login or registration entry
- successful registration enters the app
- successful login enters the app
- app bootstraps session state from `/api/auth/me`
- logout returns the user to the auth screen

### Manual Verification

Check:

- registration flow
- login flow
- page refresh preserves session
- logout works
- invalid credentials show an understandable error

## Security Expectations

This phase is not a full security program, but it should meet baseline standards.

Requirements:

- never store plaintext passwords
- use a modern password hashing strategy
- avoid exposing raw auth tokens to frontend JavaScript
- clear cookies correctly on logout
- validate request payloads before using them
- avoid differentiated login failure messages that help account enumeration

This is enough for a strong first authentication phase without expanding into broader security architecture.

## Deployment Impact

Once authentication exists, the app is no longer a purely static site if deployed as one combined product. The frontend can still build to static assets, but the backend must run somewhere that supports an HTTP server and persistent database storage.

That means:

- static-only hosting is no longer enough by itself
- deployment planning should eventually choose a backend-capable platform
- SQLite is acceptable for local development and early hosted experiments, but future scale may require a server database

This phase should optimize for correctness and simplicity first, not for final infrastructure choices.

## Non-Goals

This phase should not quietly expand into broader product systems.

Out of scope:

- practice history sync
- per-user cloud settings
- daily challenge sync
- leaderboard submission
- password recovery emails
- email confirmation
- moderation or admin dashboards
- organization or team accounts

## Success Criteria

This phase is successful if:

- a new user can register with email and password
- an existing user can log in with email and password
- the browser stays signed in across refreshes
- a signed-in user can log out cleanly
- credentials are securely stored
- the frontend only shows the typing app when authentication is established
- the codebase has a reusable backend auth boundary for future user-specific features

## Open Implementation Notes

- Prefer normalized email handling everywhere to avoid duplicate-account edge cases
- Keep API responses small and stable
- Use a user-safe response DTO so the password hash never accidentally leaks
- Add backend environment configuration for auth secrets early instead of hardcoding them
- Keep the first database migration simple and explicit
