# Database-Backed Content Design

## Summary

Replace the current split content system with a single database-backed runtime model.

Today the app has two live content sources:

- `Mixed` and `Focused` training still read from static frontend prompt files
- `Daily Challenge` and `Admin` already depend on backend database content

This creates an inconsistent product experience. Admin can show an empty database while Trainer still works from static files, and content changes made in Admin do not affect all training modes.

The target state is:

- all training modes read prompts from the backend database
- `content_items` becomes the only runtime source of truth
- static prompt files remain only long enough to seed the database once
- after migration and verification, static prompt runtime usage is removed

## Goals

- Seed existing static prompt data into `content_items`
- Add backend content APIs for `mixed` and `focused` training sessions
- Move frontend training session loading entirely to backend content APIs
- Keep `Daily Challenge` database-backed
- Remove runtime dependency on frontend static content files after migration

## Non-Goals

- Bulk import UI or CSV upload
- New ranking logic
- New content recommendation algorithms
- Multi-admin workflows
- Changing the existing typing engine scoring model

## Current Problems

### Split Source of Truth

The app currently uses:

- frontend static files for `mixed` and `focused`
- database content for `admin` and `daily challenge`

This means:

- Admin does not reflect the prompts users actually train on in all modes
- disabling or editing prompts in Admin does not affect every training path
- database emptiness is masked by frontend static fallbacks

### Migration Ambiguity

There is no current mechanism to initialize `content_items` from the original prompt set. A fresh database starts with an empty Admin content list, even though the product still appears to have a full prompt library.

## Target Architecture

### Single Runtime Content Source

`content_items` becomes the only runtime prompt source.

All three training modes consume backend-managed content:

- `mixed`
- `focused`
- `daily`

### Static Content as Seed Input Only

The existing static prompt files are temporarily retained for a one-time seed path:

- seed database when `content_items` is empty
- do not use static files as runtime fallback after backend session APIs are in place

After the migration is verified, static runtime content files and frontend lookup logic are removed.

## Backend Design

### Seed Strategy

Add a startup seed step during backend initialization.

Behavior:

1. Initialize database schema normally
2. Count rows in `content_items`
3. If the table is empty:
   - load the existing prompt set from the current static library source
   - insert every prompt into `content_items`
4. If the table is not empty:
   - do nothing

This seed must be idempotent at the application level:

- an empty database gets seeded exactly once
- a non-empty database is never overwritten by startup seeding

The seed step should emit a clear startup log indicating:

- whether seeding ran
- how many prompts were inserted

### Content Session API

Add a new backend route for training queue retrieval.

#### `GET /api/content/session`

Query parameters:

- `mode`: `mixed | focused`
- `category`: required only for `focused`

Response:

- `items: ContentItem[]`

Rules:

- only active prompts are eligible
- `mixed` returns a shuffled queue spanning all active categories
- `focused` returns a shuffled queue for the requested category only
- inactive prompts are excluded
- if no eligible prompts exist, return an empty `items` array

The queue length should remain aligned with the current UX expectations:

- `mixed` returns a short round-sized queue, matching the current session rhythm
- `focused` returns a queue suitable for continuous mode rather than a single item

This keeps continuous typing and prompt skipping behavior stable while moving source-of-truth logic to the server.

### Daily Challenge API

Keep `GET /api/content/daily-challenge`, but ensure it resolves content strictly from database-backed records.

Rules:

- if a manual assignment exists, use it
- otherwise use the existing generation logic against active database content
- do not fall back to frontend static prompt files

### Repository/Service Additions

Add the minimal repository/service surface needed for backend session retrieval:

- list active content by category
- list active content across categories
- shuffle and build training queues in the service layer
- reuse existing daily challenge assignment and generation logic

The backend remains responsible for content selection; the frontend remains responsible for stepping through the returned queue.

## Frontend Design

### Remove Runtime Static Content Reads

Update the typing session flow so `useTypingSession` no longer calls:

- static mixed prompt selection
- static focused category selection
- static daily challenge fallback

Instead:

- `mixed` mode loads a backend-provided queue
- `focused` mode loads a backend-provided queue for the chosen category
- `daily` mode loads the backend daily challenge content

### Queue Lifecycle

Frontend behavior should stay familiar:

- switching mode fetches a new queue
- changing focused category fetches a new queue
- queue items are advanced locally during typing
- `Skip Prompt` advances within the already-fetched queue
- when a queue is exhausted, fetch a new queue from the backend

This preserves the current interaction model while changing the data source.

### Admin Expectations

After seeding, `Admin -> Content` should display the full existing prompt library from the database without requiring manual re-entry.

Admin remains the management surface for:

- editing prompts
- creating prompts
- deleting prompts
- activating/deactivating prompts

Those changes should now affect all training modes because all training modes use database content.

## Error Handling

### Empty Database Content

If the database has no eligible prompts for a requested mode:

- backend returns an empty `items` array for session routes
- frontend shows an explicit empty-state message
- frontend must not fall back to static content

### Missing Focused Category Content

If a focused category has no active prompts:

- backend returns an empty list
- frontend displays a clear category-specific empty state

### Daily Challenge Resolution Failure

If no daily challenge content can be resolved from the database:

- backend returns an explicit error or empty result, not a static fallback
- frontend shows a clear unavailable state

### Content API Request Failure

If `/api/content/session` or `/api/content/daily-challenge` fails:

- frontend shows a clear loading or error message
- frontend does not silently recover by reading local static files

### Auth Expiry

These content APIs remain inside the signed-in app experience.

If a content request returns unauthorized:

- frontend routes back to sign-in
- existing auth-expiry handling remains consistent with progress and leaderboard flows

## Testing Strategy

### Backend Tests

Add tests for:

- empty `content_items` triggers seed insertion
- non-empty `content_items` skips seeding
- `GET /api/content/session?mode=mixed` returns active database content only
- `GET /api/content/session?mode=focused&category=...` returns only that category
- inactive content is excluded from all training APIs
- `GET /api/content/daily-challenge` resolves database content correctly

### Frontend Tests

Add tests for:

- `mixed` mode requests backend session content
- `focused` mode requests backend session content for the selected category
- queue exhaustion fetches a new backend queue
- empty backend queues show empty-state UI
- daily challenge still hydrates from backend content

### Manual Verification

Verify:

1. Start with an empty local database and confirm Admin content auto-populates
2. Open Admin and confirm existing prompts are visible
3. Run `Mixed`, `Focused`, and `Daily Challenge` and confirm they still work
4. Deactivate a prompt in Admin and confirm it no longer appears in training results
5. Confirm no user-facing mode depends on static prompt files anymore

## Migration Sequence

Implement in this order:

1. Add startup seeding into `content_items`
2. Verify existing prompts are inserted into the database
3. Add `GET /api/content/session`
4. Move `mixed` and `focused` frontend training modes to backend session APIs
5. Verify all modes run correctly from database content
6. Remove runtime static content usage
7. Remove obsolete static content files and lookup code

This order is important. Do not delete the static library before database seeding and backend session delivery are confirmed working.

## Success Criteria

This work is complete when:

- `Admin -> Content` shows the existing prompt library after seeding
- `Mixed`, `Focused`, and `Daily Challenge` all train from database content
- editing or disabling prompts in Admin affects all training modes
- no training mode uses frontend static prompt selection at runtime
- static prompt files are no longer needed for runtime behavior
