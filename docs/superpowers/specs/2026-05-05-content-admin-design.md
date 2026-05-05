# Content Admin Design

Date: 2026-05-05
Status: Approved for spec review

## Overview

This document defines the next product phase for the programmer typing trainer: a lightweight content administration system.

The product already supports:

- authenticated users
- cloud-backed progress
- leaderboards

The next gap is content operations. Prompts are still managed primarily through code, which makes it inconvenient to expand the library, control daily challenges, or operate the product without shipping code changes.

This phase adds a lightweight admin experience for the project owner to manage prompts and daily challenges from within the existing application.

## Product Goal

Add a first-version content administration system that lets the owner:

- create, edit, activate, deactivate, and delete prompts
- manually assign daily challenges
- generate daily challenges automatically when no manual assignment exists
- gradually shift the trainer from code-backed prompt data to database-backed prompt data

The goal is not to build a full CMS. The goal is to make the prompt library operable without editing source files.

## Scope

This phase includes:

- a new `Admin` top-level view inside the existing authenticated app
- prompt management backed by the existing server database
- daily challenge assignment management
- manual and generated daily challenge support
- database-backed content models
- trainer integration for backend-backed daily challenges
- backend content APIs for admin and trainer consumption

This phase excludes:

- multi-role permission systems
- moderation workflows
- review/approval pipelines
- bulk import/export
- version history
- operation logs
- collaborative editing
- PostgreSQL migration
- advanced search and pagination optimization

## Recommended Approach

The recommended first version is to add an admin area inside the existing app shell rather than creating a separate admin frontend.

Recommended structure:

- keep one frontend project
- add a new `Admin` top-level view beside `Trainer` and `Leaderboard`
- split `Admin` internally into:
  - `Content`
  - `Daily Challenge`

This approach is preferred because:

- it reuses the existing auth shell
- it keeps development focused and fast
- it avoids building a second product surface too early
- it is enough for single-owner operation

## Database Choice

This phase should continue using `SQLite`.

Reasons:

- the backend already uses `Express + SQLite`
- auth, cloud progress, and leaderboards already depend on it
- the new content management workload is modest
- continuing with SQLite keeps the implementation focused on product behavior instead of infrastructure migration

This phase should not migrate to PostgreSQL. That is a future concern only if product scale or operational complexity justifies it.

## Product Structure

This phase introduces a lightweight admin area inside the existing signed-in experience.

Recommended top-level views:

- `Trainer`
- `Leaderboard`
- `Admin`

Inside `Admin`, the first version should expose two sections:

1. `Content`
2. `Daily Challenge`

The app should remain single-page and lightweight. This phase should not introduce a large route system unless implementation details strongly require one.

## Content Management

The content management area is responsible for prompt CRUD and lifecycle control.

The owner should be able to:

- list prompts
- filter prompts by metadata
- create new prompts
- edit existing prompts
- activate/deactivate prompts
- delete prompts when safe

Managed prompt fields:

- `category`
- `topic`
- `difficulty`
- `length`
- `label`
- `prompt`
- `is_active`

The existing structured prompt model should remain the source of truth for these dimensions.

## Daily Challenge Management

The daily challenge management area should support two assignment paths:

1. `manual`
2. `generated`

Rules:

- if a date has a manual assignment, use it
- if a date has no manual assignment, generate a challenge using the automatic rules
- generated assignments may be persisted so the same day remains stable across requests

This phase should support both manual and generated challenge sources, but manual control is primary.

## Data Model

This phase should introduce two new content-oriented tables.

### `content_items`

This table becomes the database-backed source of managed prompts.

Recommended columns:

- `id`
- `category`
- `topic`
- `difficulty`
- `length`
- `label`
- `prompt`
- `is_active`
- `created_at`
- `updated_at`

Behavior:

- inactive prompts remain stored but are excluded from automatic generation
- inactive prompts can still exist historically

### `daily_challenge_assignments`

This table stores explicit or generated daily challenge selections.

Recommended columns:

- `date_key`
- `content_item_id`
- `source`
  - `manual`
  - `generated`
- `created_at`
- `updated_at`

Behavior:

- one effective challenge per date
- if `source = manual`, it always wins
- generated rows provide stability and prevent repeated recomputation from picking different prompts on the same day

## API Structure

This phase should separate admin management APIs from trainer consumption APIs.

### Admin APIs

These routes serve the `Admin` interface.

#### `GET /api/admin/content`

Purpose:

- list content items
- support metadata filtering

Recommended filters:

- `category`
- `topic`
- `difficulty`
- `length`
- `is_active`

#### `POST /api/admin/content`

Purpose:

- create a new prompt

#### `PUT /api/admin/content/:id`

Purpose:

- update an existing prompt

#### `DELETE /api/admin/content/:id`

Purpose:

- delete a prompt when it is not unsafe to remove

#### `GET /api/admin/daily-challenge`

Purpose:

- inspect one date or a recent date range of challenge assignments

#### `PUT /api/admin/daily-challenge/:dateKey`

Purpose:

- manually assign a specific prompt to a date

#### `POST /api/admin/daily-challenge/generate`

Purpose:

- generate a challenge for a date when desired

### Trainer Content APIs

These routes serve the trainer experience.

#### `GET /api/content/daily-challenge`

Purpose:

- return today’s challenge content from the database-backed assignment system

#### `GET /api/content/session`

Purpose:

- return content for mixed or focused practice

The trainer content APIs should be distinct from admin APIs so the app keeps a clean boundary between content management and practice consumption.

## Frontend Admin Structure

The admin area should be lightweight and operationally focused.

Recommended structure:

### `Admin`

Top-level view inside the authenticated app.

Contains two internal sections:

- `Content`
- `Daily Challenge`

### `Content List`

Displays prompts with:

- metadata filters
- active/inactive status
- edit action
- delete action
- create-new action

### `Content Editor`

Simple form for create/edit actions.

Fields:

- category
- topic
- difficulty
- length
- label
- prompt
- active toggle

### `Daily Challenge Manager`

Displays:

- today’s challenge
- selected date challenge
- whether the source is `manual` or `generated`
- action to manually assign a prompt
- action to generate a challenge automatically

## Automatic Daily Challenge Rules

The automatic generation logic should be simple, stable, and explainable.

Recommended rule set:

- manual assignment always takes priority
- when generating automatically, use only `is_active = true` prompts
- prefer `technical` and `code` categories
- prefer `medium` difficulty
- prefer `medium` length
- avoid repeating the same `topic` or `content_item_id` from recent days when possible

This phase should not introduce complex recommendation logic. The generator only needs to produce stable and reasonable results.

## Trainer Integration Strategy

This phase should migrate trainer content in two steps.

### Step 1: Move `Daily Challenge` to the backend content source

This is the highest-value first move because:

- it creates the shortest admin-to-user visible loop
- it proves that admin changes affect the live product
- it limits risk compared with changing all practice modes at once

### Step 2: Move `Mixed` and `Focused` content sourcing to backend APIs

This should happen after daily challenge integration is stable.

The existing local prompt queue and shuffle behavior should be preserved conceptually, but the content source should progressively move from static arrays to backend-provided content.

## Validation Rules

The backend must validate prompt writes.

Required rules:

- `category` must be a valid enum value
- `topic` must be a valid enum value
- `difficulty` must be a valid enum value
- `length` must be a valid enum value
- `label` must not be empty
- `prompt` must not be empty
- `prompt` must not be whitespace-only

The backend should remain the final authority for validation, even if the frontend also validates form input.

## Deletion and Activation Rules

Prompt lifecycle rules should favor safety over convenience.

### Deletion

If a prompt is currently referenced by a daily challenge assignment:

- deletion should be blocked in the first version
- the admin should be guided to change the assignment first

This is preferred over silently breaking challenge data.

### Deactivation

If a prompt is deactivated:

- it must be excluded from automatic challenge generation
- it must be excluded from future automated session selection
- existing historical rows that reference it remain valid
- an already assigned daily challenge may continue to resolve until changed

## Error Handling

This phase should prioritize data safety and explicit operator feedback.

### Invalid Prompt Input

If prompt fields fail validation:

- return clear validation errors
- do not partially write data

### Unsafe Delete

If a prompt is still referenced by a daily challenge assignment:

- reject deletion
- return a clear error message

### Challenge Generation Failure

If no eligible content exists for generation:

- return a clear error such as `No eligible content available for challenge generation.`
- do not silently fall back to arbitrary content

### Trainer Content Read Failure

If trainer content retrieval fails:

- show an explicit error state
- do not pretend the library is empty

This distinction matters for both debugging and operator trust.

## Security Expectations

This phase is for single-owner use, but it still runs behind authentication.

Required safeguards:

- admin APIs require authentication
- content writes occur only through backend validation
- trainer content APIs return only the prompt fields needed for consumption

This phase does not add a role system. It assumes the current authenticated environment is owner-controlled.

## Testing Strategy

### Backend Content Tests

Required coverage:

- create prompt success
- invalid enum or empty fields are rejected
- update prompt success
- inactive state persists correctly
- deletion is blocked when a prompt is referenced by a daily challenge assignment

### Backend Daily Challenge Tests

Required coverage:

- manual assignment succeeds
- automatic generation succeeds when eligible prompts exist
- inactive prompts are excluded
- the same day returns a stable assignment
- no eligible prompt set returns a clear error

### Frontend Admin Tests

Required coverage:

- content list renders
- metadata filters work
- create/edit form submits correctly
- active/inactive controls update visible state
- daily challenge manager can manually assign and generate
- backend errors render clearly

### Trainer Integration Tests

Required coverage:

- daily challenge content comes from the backend-backed source
- admin changes to today’s challenge are reflected in trainer reads
- inactive prompts do not appear in generated challenge output

## Performance Expectations

This phase should optimize for correctness and manageability, not scale.

The expected workload is small enough that:

- SQLite remains acceptable
- simple filters are acceptable
- no advanced indexing or pagination strategy is required beyond reasonable defaults

If the content library grows significantly later, optimization can be revisited.

## Non-Goals

This phase should not expand into:

- multi-role admin permissions
- content review workflows
- prompt versioning
- collaboration features
- bulk ingestion pipelines
- analytics dashboards
- database migration infrastructure

## Success Criteria

This phase is successful if:

- the owner can manage prompts without editing source code
- the owner can manually assign daily challenges
- the system can generate stable fallback daily challenges
- daily challenge content in the trainer is sourced from the backend-backed content system
- invalid writes and unsafe deletes are blocked cleanly
- the admin UI is lightweight but operationally complete for single-owner use
