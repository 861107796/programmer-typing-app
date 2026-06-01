# Cloud Progress Sync Design

Date: 2026-05-05
Status: Approved for spec review

## Overview

This document defines the second backend phase for the programmer typing trainer: moving user progress from browser-only storage into authenticated server-backed persistence.

The project already has working email-and-password authentication. Users must now be able to save their practice history, achievement progress, and daily challenge state to their account so the product can preserve progress across refreshes and future devices.

## Product Goal

Add a real cloud-backed progress layer for authenticated users so that practice sessions, achievements, and daily challenge progress belong to the signed-in account instead of only living in browser storage.

## Scope

This phase includes:

- Saving completed practice sessions to the backend
- Loading recent practice history from the backend
- Saving achievement progress to the backend
- Loading achievement progress from the backend
- Saving per-user daily challenge progress to the backend
- Loading per-user daily challenge progress from the backend
- Updating the frontend to use server-backed progress after login
- Using the authenticated user as the owner of all saved progress

This phase excludes:

- Global leaderboards
- Comparing users against each other
- Multi-device conflict resolution
- Offline retry queues
- Migration of old local-only progress into the server
- User-managed deletion of history
- Admin editing for achievements or challenge rules
- Prompt management or content admin tools

## Recommended Architecture

The recommended design is a structured server-backed progress system with separate storage for:

1. `practice sessions`
2. `achievement progress`
3. `daily challenge progress`

This is preferred over storing one large progress JSON blob because the app will soon need structured querying for trends, leaderboard preparation, and profile statistics. Practice sessions especially should remain queryable as first-class rows.

The backend should remain the source of truth for user progress once authentication is required. The frontend can still calculate a just-finished session result locally, but it should not treat local storage as the authoritative record after login.

## Product Behavior

After this phase:

1. A signed-in user loads the app
2. The frontend restores authentication via `/api/auth/me`
3. The frontend requests a progress snapshot from the backend
4. The app initializes recent sessions, achievements, and daily challenge state from server data
5. When the user finishes a practice session, the frontend submits the result to the backend
6. The backend saves the session and updates derived progress
7. The frontend updates its UI from the server response

This keeps the app behavior consistent with the new account system: progress belongs to the account, not to a specific browser tab.

## Backend Responsibilities

The backend should be responsible for:

- validating authenticated progress requests
- storing completed practice sessions
- calculating updated achievement state from saved sessions
- calculating updated daily challenge state from saved sessions
- returning structured progress snapshots for the signed-in user

The backend should not become responsible for prompt rendering, typing mechanics, or raw key-by-key gameplay state in this phase.

## Frontend Responsibilities

The frontend should be responsible for:

- loading server-backed progress after authentication succeeds
- showing recent sessions, achievements, and daily challenge state from backend data
- calculating a session result locally when the user completes a prompt
- submitting the completed result to the backend
- updating the UI from backend-confirmed progress data

The frontend should not maintain a separate competing source of truth for authenticated progress.

## Data Model

This phase should add three progress tables, all owned by `user_id`.

### `practice_sessions`

Purpose:

- store each completed practice result as a separate row

Recommended fields:

- `id`
- `user_id`
- `mode`
- `category`
- `duration_ms`
- `total_chars`
- `correct_chars`
- `error_count`
- `wpm`
- `accuracy`
- `valid`
- `created_at`

Notes:

- this table should preserve a historical trail
- later stats and leaderboard features will depend on this data
- `created_at` should represent when the session was completed and stored

### `user_achievements`

Purpose:

- store each user's current achievement progress and unlock status

Recommended fields:

- `user_id`
- `achievement_id`
- `progress`
- `unlocked`
- `unlocked_at`
- `updated_at`

Notes:

- each row represents one achievement definition for one user
- `progress` should support partially completed achievements
- `unlocked_at` should remain null until the achievement is unlocked

### `daily_challenge_progress`

Purpose:

- store the signed-in user's status for a given challenge date

Recommended fields:

- `user_id`
- `date_key`
- `challenge_id`
- `completed`
- `best_wpm`
- `best_accuracy`
- `updated_at`

Notes:

- one row should represent one user on one date
- the backend should keep the best values for the day instead of duplicating rows for the same date

## Data Ownership Rules

All progress rows must be owned by the authenticated user identified from the auth cookie. The frontend must not send arbitrary `user_id` values. The backend should derive ownership from authentication middleware and ignore any client attempt to claim another identity.

## API Design

This phase should add a focused progress API under `/api`.

### `GET /api/progress`

Purpose:

- return the current signed-in user's progress snapshot in one request

Recommended response shape:

```json
{
  "sessions": [],
  "achievements": [],
  "dailyChallenge": null
}
```

Behavior:

- return recent practice sessions for the current user
- return current achievement state for the current user
- return the current day's daily challenge status for the current user

This endpoint is intended to bootstrap the trainer UI after login.

### `POST /api/sessions`

Purpose:

- save one completed practice session for the current user
- update derived achievement and daily challenge state

Recommended request shape:

```json
{
  "mode": "mixed",
  "category": "mixed",
  "durationMs": 42000,
  "totalChars": 120,
  "correctChars": 118,
  "errorCount": 2,
  "wpm": 67,
  "accuracy": 98,
  "valid": true
}
```

Recommended response shape:

```json
{
  "session": {
    "id": "session_123"
  },
  "sessions": [],
  "achievements": [],
  "dailyChallenge": null
}
```

Behavior:

- create a new practice session row
- recalculate the user's achievement state
- update that user's daily challenge row for today if relevant
- return the updated progress summary needed by the frontend

### `GET /api/sessions`

Purpose:

- return a recent history list for the current user

Behavior:

- default to a modest limit such as the most recent 20 to 50 sessions
- reserve room for future pagination without requiring it now

### `GET /api/achievements`

Purpose:

- return the current achievement state for the current user

### `GET /api/daily-challenge`

Purpose:

- return the current day's challenge state for the current user

## Why Both Snapshot and Focused Endpoints Exist

The frontend can stay simple by using `GET /api/progress` as its main bootstrap endpoint and `POST /api/sessions` as its main mutation endpoint.

The additional focused `GET` endpoints should still exist because they create clean boundaries for future dedicated pages such as a history page, achievements page, or profile dashboard.

## Backend Service Structure

The backend should extend the existing auth-oriented structure with progress modules such as:

- `server/routes/progress.ts`
- `server/services/progressService.ts`
- `server/repositories/sessionRepository.ts`
- `server/repositories/achievementRepository.ts`
- `server/repositories/dailyChallengeRepository.ts`

Responsibilities:

- `progress.ts`: route wiring for progress APIs
- `progressService.ts`: orchestration for saving sessions and updating derived state
- repositories: persistence logic for each data set

This keeps the existing auth boundary intact and introduces progress as a second backend domain instead of mixing it into auth code.

## Achievement Update Model

Achievement rules already exist in the frontend codebase. In this phase, the backend should become the authority that applies those rules when a session is saved.

Recommended behavior:

- use the saved session as the input event
- load the user's current achievement state
- evaluate the next state
- persist the updated achievement rows

The exact rules do not need to change in this phase. The goal is to move ownership of the resulting state to the backend.

## Daily Challenge Update Model

Daily challenge status should update on session submission, not through a separate button or manual sync flow.

Recommended behavior:

- determine the current challenge date key on the server
- detect whether the just-finished session should count for today
- update or create the signed-in user's row for that date
- keep the best daily WPM and best daily accuracy
- mark `completed` true once a valid challenge completion occurs

This phase should remain user-specific only. It should not attempt to create a global shared challenge system beyond the existing date-based challenge selection.

## Frontend Integration

The frontend should move from local progress initialization to backend-backed initialization for authenticated users.

Recommended flow:

1. app loads
2. auth state is restored
3. if signed in, request `/api/progress`
4. hydrate recent sessions, achievements, and daily challenge UI from the response

When the user completes a prompt:

1. frontend calculates the local `SessionResult`
2. frontend sends it to `POST /api/sessions`
3. frontend replaces local progress UI state with the returned server-backed snapshot

This avoids keeping parallel local-storage-based progress logic for authenticated users.

## Local Storage Expectations

Because the current product requires authentication before entering the trainer, the backend should become the primary storage system for progress in this phase.

Local storage may still be used for:

- temporary UI state
- non-sensitive preferences
- short-lived client cache if needed

Local storage should no longer be the authoritative source for authenticated practice history, achievements, or daily challenge completion.

## Error Handling

Progress syncing should fail clearly and predictably.

### Authentication Failure

- if a progress endpoint returns `401`, the frontend should treat the session as expired
- the user should be returned to the auth gate and prompted to sign in again

### Network Failure

- if session sync fails because the network is unavailable, the frontend should show a clear failure message
- this phase should not add an offline retry queue

### Server Failure

- the frontend should not assume a session was saved if the backend fails
- achievements and daily challenge UI should only update from confirmed server responses

### Empty Progress State

For a newly registered user, `GET /api/progress` should return:

- an empty session list
- an empty or default achievement list
- a null or not-yet-completed daily challenge state

The response should be explicit enough that the frontend does not need to invent hidden defaults.

## Validation Rules

The backend should validate incoming session payloads before saving them.

Recommended checks:

- `mode` must be one of the supported practice modes
- `category` must be one of the supported categories or `mixed`
- numeric fields must be finite and non-negative
- `accuracy` should remain within a valid percentage range
- `valid` should be boolean

The backend may trust frontend calculation format enough for this phase, but it should not accept obviously malformed values.

## Testing Strategy

### Backend Integration Tests

Required coverage:

- authenticated user can save a session
- unauthenticated user cannot save a session
- saving a session updates the current progress snapshot
- achievements are updated when a session is saved
- daily challenge progress is updated when a session is saved
- recent sessions are returned in reverse chronological order

### Frontend Integration Tests

Required coverage:

- authenticated app bootstraps from `GET /api/progress`
- completing a session triggers `POST /api/sessions`
- returned session history updates the sidebar
- returned achievements update the sidebar
- returned daily challenge state updates the sidebar
- `401` from progress endpoints returns the user to the auth screen

### Manual Verification

Check:

- new user sees empty progress but a working trainer
- after several completed sessions, history appears and persists across refreshes
- achievements unlock and remain after refresh
- daily challenge state persists after refresh
- logout and login restore the same progress

## Security Expectations

This phase extends authenticated user data and should preserve the same security shape as the auth phase.

Requirements:

- all progress endpoints require a valid authenticated session
- the backend derives the user identity from the auth cookie
- the backend never trusts client-provided ownership
- progress queries only return the current user's data

This is enough for a correct first user-data layer without yet introducing broader authorization concerns.

## Deployment Impact

This phase continues the move away from static-only hosting.

The backend now needs to persist both authentication data and user progress data. Local SQLite remains acceptable for local development and early hosted experiments, but future scale may require a more durable shared database.

The deployment story should still optimize for correctness and iteration speed rather than early infrastructure complexity.

## Success Criteria

This phase is successful if:

- a signed-in user's completed sessions are saved to the backend
- recent session history persists across refreshes
- achievements persist across refreshes
- daily challenge progress persists across refreshes
- the frontend initializes progress from the backend after login
- the frontend updates progress from backend-confirmed responses after each completed session

## Non-Goals

This phase should not quietly expand into:

- global ranking features
- friend systems
- analytics dashboards
- prompt authoring tools
- account settings pages
- background retry infrastructure
- migration tooling for prior browser-only progress

## Open Implementation Notes

- keep response shapes small and stable
- prefer one backend snapshot response for bootstrap simplicity
- reserve pagination shape flexibility for `GET /api/sessions`
- keep progress-specific code separate from auth-specific code
- preserve the existing frontend training flow while swapping the data source behind the sidebar and progress state
