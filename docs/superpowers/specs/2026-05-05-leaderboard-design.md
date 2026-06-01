# Leaderboard Design

Date: 2026-05-05
Status: Approved for spec review

## Overview

This document defines the next product phase for the programmer typing trainer: adding leaderboards for authenticated users.

The project already has account authentication and cloud-backed progress syncing. This phase adds two ranked views built on top of that data:

- a daily challenge leaderboard
- a global best-score leaderboard

The product goal is to make progress feel social and competitive without introducing heavy anti-cheat infrastructure or a full profile system in the first release.

## Product Goal

Add a first-version leaderboard experience that lets signed-in users compare themselves against other users through:

- a `Top 100` daily challenge leaderboard
- a `Top 100` global leaderboard based on best single-session WPM
- a personal rank summary for the current user

## Scope

This phase includes:

- a daily challenge leaderboard ranked by today's best challenge WPM
- a global leaderboard ranked by best single-session WPM
- a personal leaderboard summary for the signed-in user
- backend leaderboard query endpoints
- frontend leaderboard UI in a single-page in-app view
- ranking based on existing cloud progress data

This phase excludes:

- advanced anti-cheat or score validation
- nicknames or profile editing
- friend leaderboards
- weekly or monthly leaderboards
- historical leaderboard archives
- real-time websocket leaderboard updates
- rewards, badges, or prize systems

## Recommended Approach

The recommended first version is to calculate leaderboards from existing progress tables instead of maintaining dedicated materialized leaderboard tables.

Recommended sources:

- `daily_challenge_progress` for the daily challenge leaderboard
- `practice_sessions` for the global leaderboard

This approach is preferred because:

- the data model already exists
- the implementation is faster and easier to reason about
- the product can ship before adding optimization-only complexity

If usage grows later, the app can move to cached or materialized leaderboard rows, but that is not necessary for this phase.

## Product Structure

This phase should introduce a leaderboard view inside the existing signed-in app, not as a separate routing system.

Recommended UI structure:

1. a top-level navigation or mode switch that lets the user move between:
   - trainer
   - leaderboard
2. a leaderboard view with two tabs:
   - `Daily Challenge`
   - `Global`
3. a `My Rank` summary block for the signed-in user

This keeps the product lightweight and avoids adding router complexity before it is needed.

## Daily Challenge Leaderboard

The daily challenge leaderboard is the primary leaderboard in this phase.

Purpose:

- encourage daily return behavior
- give users a reason to complete today's challenge
- create short-term competition without requiring a long history

Rules:

- show `Top 100`
- rank by today's `best_wpm`
- break ties by `best_accuracy` descending
- break remaining ties by `updated_at` ascending

Recommended displayed columns:

- rank
- display name
- WPM
- accuracy
- updated time

## Global Leaderboard

The global leaderboard is the long-term performance board.

Purpose:

- reward personal bests
- give users a durable status target
- complement the short-term daily board

Rules:

- show `Top 100`
- rank by each user's best single valid session `wpm`
- break ties by that session's `accuracy` descending
- break remaining ties by session `created_at` ascending

Recommended displayed columns:

- rank
- display name
- best WPM
- accuracy
- recorded time

## My Rank Summary

The leaderboard view should also show the current user's own standing, even if they are not in the visible top 100.

Recommended summary fields:

- today's best daily challenge WPM
- today's daily challenge rank
- global best WPM
- global rank

This is important because many users will not make the top 100, but they still need useful feedback and a visible goal.

## Display Name Rules

The product does not yet have a nickname system, so this phase needs a simple display-name policy.

Recommended rule:

- derive display name from the email prefix
- do not show the full email address

Example:

- `alice@example.com` displays as `alice`

This is enough for a first version while avoiding a profile-editing feature expansion.

## Data Sources

### Daily Challenge Source

The daily leaderboard should be based on `daily_challenge_progress` joined with users.

Required fields:

- user identifier
- email
- date key
- challenge id
- completed
- best WPM
- best accuracy
- updated timestamp

Only records for the current date should be considered.

### Global Leaderboard Source

The global leaderboard should be based on `practice_sessions` joined with users and aggregated by user.

The query should determine each user's best valid session, then rank users by:

1. WPM descending
2. accuracy descending
3. created_at ascending

Only valid sessions should count toward the leaderboard.

## Backend Endpoints

This phase should add three leaderboard endpoints under `/api/leaderboard`.

### `GET /api/leaderboard/daily`

Purpose:

- return today's daily challenge leaderboard top 100

Recommended response shape:

```json
{
  "entries": [
    {
      "rank": 1,
      "displayName": "alice",
      "wpm": 92,
      "accuracy": 99,
      "updatedAt": "2026-05-05T10:10:00.000Z"
    }
  ]
}
```

### `GET /api/leaderboard/global`

Purpose:

- return the top 100 users by best single-session WPM

Recommended response shape:

```json
{
  "entries": [
    {
      "rank": 1,
      "displayName": "alice",
      "wpm": 108,
      "accuracy": 98,
      "createdAt": "2026-05-05T08:00:00.000Z"
    }
  ]
}
```

### `GET /api/leaderboard/me`

Purpose:

- return the signed-in user's leaderboard summary

Recommended response shape:

```json
{
  "daily": {
    "rank": 27,
    "wpm": 74,
    "accuracy": 97
  },
  "global": {
    "rank": 41,
    "wpm": 88,
    "accuracy": 99
  }
}
```

If the user has no qualifying score for a board, that section should return `null`.

## Query Model

This phase should use real-time query aggregation rather than precomputed leaderboard tables.

### Daily Query Model

The daily query should:

- filter to the current date key
- filter to completed daily challenge rows
- order by WPM, then accuracy, then timestamp
- limit to 100

### Global Query Model

The global query should:

- filter to valid sessions
- group by user
- find each user's best qualifying session
- order those best results by WPM, then accuracy, then timestamp
- limit to 100

### Personal Rank Query Model

The personal rank query should:

- calculate the user's best score for each board
- calculate how many users are ahead of that score under the same tie-break rules
- return a 1-based rank

The exact SQL can evolve during implementation, but the ranking semantics must match the UI rules.

## Backend Responsibilities

The backend should be responsible for:

- computing leaderboard rankings
- enforcing authentication for leaderboard access
- returning consistent leaderboard entry shapes
- deriving display names from user emails

The backend should not:

- add heavy anti-cheat checks in this phase
- create new user profile management features

## Frontend Responsibilities

The frontend should be responsible for:

- rendering the leaderboard view
- switching between daily and global tabs
- showing loading, empty, and error states
- showing `My Rank` summary

The frontend should not:

- compute ranks itself
- infer ranking rules from incomplete data
- show full raw email addresses

## Single-Page Integration

The recommended integration is an in-app single-page switch rather than route-based navigation.

Possible structure:

- `Trainer`
- `Leaderboard`

The leaderboard view should then contain its own internal daily/global switch.

This preserves the lightweight feel of the app and avoids broad navigation refactors.

## Error Handling

Leaderboard handling should be product-usable even when the data layer fails.

### Request Failure

If a leaderboard request fails:

- show a clear error message such as `Unable to load leaderboard right now.`
- do not blank the whole app shell

### Empty Leaderboard

If there are no entries:

- show an empty state such as `No entries yet. Be the first to set a score.`

### User Not in Top 100

This should not be treated as an error.

The leaderboard should still show the top 100 while `My Rank` displays the user's personal standing if available.

### Auth Expiry

Because the product already requires authentication:

- leaderboard endpoints should remain authenticated
- a `401` should return the user to the auth gate

## Testing Strategy

### Backend Tests

Required coverage:

- daily leaderboard sorts by WPM, then accuracy, then time
- global leaderboard returns one best row per user
- top 100 limiting works
- personal rank endpoint returns the current user's rank correctly
- empty boards return empty entry arrays
- unauthenticated leaderboard requests return `401`

### Frontend Tests

Required coverage:

- leaderboard view renders after entering the leaderboard screen
- daily/global switch works
- leaderboard entries render correctly
- `My Rank` summary renders correctly
- empty state renders correctly
- error state renders correctly

### Manual Verification

Check:

- multiple users with different daily challenge scores appear in correct order
- multiple users with different best sessions appear in correct global order
- users outside top 100 still see their personal rank summary
- auth expiry returns the user to sign-in

## Security Expectations

This phase is intentionally light on anti-cheat, but it still needs basic correctness.

Required safeguards:

- leaderboard endpoints require authentication
- only valid saved progress data is used as the source of ranking
- display names are derived server-side
- full user emails are not exposed in leaderboard entry payloads

This phase explicitly does not attempt to solve cheating thoroughly.

## Performance Expectations

This first version should optimize for correctness and simplicity, not premature scaling.

Real-time aggregation is acceptable because:

- current data volume is small
- `Top 100` responses are limited
- the product is still in an early phase

If query cost becomes a real problem later, the app can add:

- precomputed leaderboard tables
- scheduled refresh jobs
- query caching

Those are future optimizations, not current requirements.

## Non-Goals

This phase should not quietly expand into:

- anti-cheat systems
- nickname/profile editing
- leaderboard history pages
- social/friend ranking
- periodic seasonal ranking systems
- real-time ranking push updates
- prize or reward mechanics

## Success Criteria

This phase is successful if:

- signed-in users can open a leaderboard view inside the app
- the app shows a daily challenge top 100 board
- the app shows a global best-session top 100 board
- the app shows the current user's personal ranking summary
- rank ordering follows the defined sort rules
- empty and error states are usable

## Open Implementation Notes

- keep the leaderboard API response shapes small and stable
- share ranking tie-break rules explicitly between code and tests
- prefer clear SQL or repository logic over over-general abstractions
- do not build a profile system just to support leaderboard names
