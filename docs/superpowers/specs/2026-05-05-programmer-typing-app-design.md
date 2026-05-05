# Programmer Typing App Design

Date: 2026-05-05
Status: Approved for spec review

## Overview

This document defines the first implementation phase for a web-based typing practice application aimed at programmers rather than beginners. The product focuses on realistic developer input patterns by combining code snippets, terminal commands, and technical English sentences into structured typing exercises.

The first phase should deliver a polished, usable core training experience plus lightweight progression features. Community features such as online leaderboards and cloud-backed accounts are intentionally deferred, but the design should leave clear extension points for them.

## Product Goal

Build a programmer-focused typing training web app that helps users improve speed, accuracy, and comfort with real development input. The app should emphasize symbol-heavy typing, realistic syntax patterns, and short repeatable sessions that encourage daily use.

## Phase 1 Scope

Phase 1 includes:

- A browser-based single-page application
- Mixed typing practice using code, command line, and technical English content
- Focused practice by content category
- A daily challenge mode
- Real-time typing feedback
- Session result summaries
- Local history tracking
- Lightweight achievements
- Local persistence for user progress and settings

Phase 1 excludes:

- User accounts
- Cloud sync
- Online leaderboards
- Friend systems
- Shared challenges
- Freeform pasted-content practice

## Target User

The initial target user is a programmer who already knows how to type normally and wants to get better at the kinds of input they use during development. This includes:

- Writing code with symbols, brackets, punctuation, and indentation
- Entering shell commands and filesystem paths
- Reading and typing technical English phrases and short documentation-like text

The experience should feel more like practicing real developer input than using a general-purpose typing tutor.

## Product Shape

Phase 1 should be implemented as a web application with a strong single-page experience. The main product surface should feel focused and fast rather than dashboard-heavy. The application should prioritize the quality of the typing session itself while still showing progress and habit-building features around it.

The recommended shape is a single-page app with distinct feature sections rather than a large multi-route shell. This keeps the first version compact while still allowing the internal logic to be modular and extensible.

## Core Modes

Phase 1 includes three practice modes.

### Mixed Practice

This is the default mode. It combines:

- Code snippets
- Command line snippets
- Technical English sentences

The mix should reflect realistic developer typing rather than equal weighting by default. Symbol-rich content should be well represented.

### Focused Practice

This mode lets the user choose one content category to train specifically. Supported categories in Phase 1:

- Code
- Command line
- Technical English

This mode exists to help users improve weak areas instead of always practicing blended content.

### Daily Challenge

This mode generates one fixed challenge per day using deterministic content selection based on the local date. The user should be able to complete it and see whether they have already finished it that day. Phase 1 stores challenge completion locally only.

## Session Flow

Each typing session should follow this flow:

1. The user chooses a mode.
2. The app prepares a content item or content sequence.
3. The user starts the session.
4. The timer begins on first meaningful input.
5. The app performs real-time character-by-character validation.
6. The session ends when the content is completed.
7. The app calculates scoring and progress updates.
8. The results screen shows performance and any unlocked achievements or challenge completion.

Sessions should be short and replayable. A typical session should take roughly 30 to 90 seconds or one concise content block.

## Typing Interaction Rules

The typing engine is the most important part of the product and should follow strict, predictable rules.

### Character Validation

- Validation is strict and character-by-character.
- Incorrect input should not silently auto-skip characters.
- Users should correct mistakes rather than advancing through invalid input.
- Special developer-relevant characters such as brackets, quotes, slashes, underscores, operators, and punctuation should be visually distinct when incorrect.

### Start and End Timing

- A session starts timing on the first valid user input action, not when the page loads.
- A session ends when the full content has been entered correctly.

### Error Handling During Input

- Mistakes should be clearly highlighted.
- Backspace correction should be supported and reflected accurately in session state.
- The app should not attempt smart correction or intent guessing.

### Pasting

Phase 1 should discourage score inflation through pasting. If the app detects multi-character insertion that appears to be a paste or bulk insert, it should invalidate that session for scoring purposes or block the action entirely. The implementation choice should prioritize fairness and simplicity.

## Content Design

Content should come from a local curated library in Phase 1.

### Content Categories

#### Code

Short snippets with realistic syntax. Examples of characteristics:

- Brackets and parentheses
- Quotes and escaping
- Object literals and arrays
- Function signatures
- Comparisons and operators
- Semicolons, commas, and colons

#### Command Line

Short realistic command sequences. Examples of characteristics:

- Commands with flags
- File paths
- Chained arguments
- Quoted parameters
- Package manager commands

#### Technical English

Short technical sentences rather than casual prose. Examples of characteristics:

- API-related wording
- Error descriptions
- Documentation-style phrases
- Setup instructions

### Content Constraints

- Content should be concise enough for short sessions.
- Content should avoid large multiline blocks in Phase 1.
- Content should feel realistic to developers rather than generic.
- Content should be stored locally in structured JSON or equivalent static data files.

## Real-Time Feedback

The app should show real-time performance indicators during a session.

Required metrics:

- Current WPM
- Accuracy
- Error count
- Combo or streak indicator

Required visual feedback:

- Current cursor position
- Correctly entered characters
- Incorrect characters
- Clear visual distinction for code and terminal content styles

The UI should make symbol errors obvious because that is disproportionately important for programmer-focused practice.

## Results and Progress

After each session, the app should display a compact but satisfying results summary.

Required results:

- Final WPM
- Final accuracy
- Total errors
- Session duration
- Content type or mode

The results step should also:

- Save the session into local history
- Check whether the user completed the daily challenge
- Check whether an achievement was unlocked

## Achievement System

Phase 1 includes lightweight achievements that reinforce momentum without becoming a large meta-system.

Recommended achievement categories:

- Speed achievements
- Accuracy achievements
- Consistency achievements
- Mode-specific achievements

Examples:

- Reach a target WPM in one session
- Finish multiple sessions above a high accuracy threshold
- Complete the daily challenge on consecutive days
- Finish several command line or code sessions

Achievement rules should be deterministic and easy to explain. Phase 1 should avoid complex branching progression trees.

## Daily Challenge Design

The daily challenge exists to build repeat usage and habit.

Requirements:

- Generate one challenge per local calendar day
- Use deterministic selection so the same day always maps to the same challenge
- Track whether the challenge has been completed
- Track the best result for that day
- Store all challenge status locally in Phase 1

The daily challenge should feel distinct from free practice, but it should still use the same scoring and typing engine underneath.

## Data Model

Phase 1 should persist four categories of local data.

### Session Records

Each completed session should capture:

- Session id
- Timestamp
- Mode
- Content type
- Content item id
- Duration
- WPM
- Accuracy
- Error count
- Score
- Whether the session was valid for ranking or achievement purposes

### Daily Challenge State

Each day should capture:

- Date key
- Challenge content id or derived challenge id
- Completion status
- Completion count
- Best score
- Best WPM
- Best accuracy

### Achievement State

The app should store:

- Achievement id
- Unlock status
- Unlock timestamp
- Partial progress when applicable

### User Preferences

The app should store:

- Preferred mode
- Visual preferences such as font size or theme if implemented
- Optional toggles such as helper visibility

## Persistence Strategy

Phase 1 should use local browser storage only. The default persistence recommendation is `localStorage`, unless implementation details make `IndexedDB` meaningfully simpler for structured records. Since Phase 1 is modest in scale, local persistence should stay simple.

The persistence layer should be abstracted behind a small module so that future account or cloud sync work can replace storage details without rewriting the typing engine or UI.

## Architecture

The codebase should be split into clear modules with single responsibilities.

### `content-library`

Responsibilities:

- Store and provide content items
- Support category-based selection
- Support mixed-mode selection
- Support deterministic daily challenge selection

### `typing-engine`

Responsibilities:

- Hold session input state
- Validate input character-by-character
- Track cursor position
- Track errors and corrections
- Decide when a session starts and ends

This is the most critical logic module in the project.

### `session-scoring`

Responsibilities:

- Calculate WPM
- Calculate accuracy
- Count and classify errors
- Calculate final score
- Produce a session result summary

### `progress-tracker`

Responsibilities:

- Save and load session history
- Save and load daily challenge data
- Save and load achievements
- Save and load preferences

### `challenge-achievement`

Responsibilities:

- Evaluate achievement unlock rules
- Update achievement progress
- Generate and evaluate daily challenge metadata

### `ui-shell`

Responsibilities:

- Render the application layout
- Coordinate views and panels
- Bind user actions to the training flow
- Present results and progress information

## Error Handling

The app should prioritize predictability and recoverability.

### Input and Browser Edge Cases

- Use actual input characters for validation.
- Do not attempt intent-based correction.
- Handle deletion and correction cleanly.
- Treat composition or unusual input behavior conservatively rather than guessing.

### Empty or Missing Content

If a content category is empty, the app should degrade gracefully:

- Mixed mode should use remaining available categories.
- Focused mode should communicate that content is unavailable instead of breaking.

### Corrupt Local Data

If stored data cannot be parsed:

- Fall back to safe defaults
- Preserve valid subsets where practical
- Avoid crashing the app on startup

### Date Boundary Behavior

When the local day changes:

- A new daily challenge should become active
- Previous challenge data should remain accessible through stored history where applicable

## UI Direction

The product should feel closer to a modern coding environment than a generic educational dashboard. It should be visually intentional, focused, and readable on both desktop and mobile.

Recommended visual direction:

- Editor-inspired or terminal-inspired accents
- Strong differentiation between code and shell content
- Clear typographic hierarchy
- High clarity for cursor and error state
- Responsive layout with desktop-first optimization

The first implementation should not overcomplicate navigation. The priority is excellent interaction quality during practice.

## Technical Stack

Recommended implementation stack:

- React
- Vite
- TypeScript

Additional implementation guidance:

- Keep high-frequency typing state close to the feature rather than over-centralizing it
- Use local static content files for Phase 1
- Keep business logic separate from UI rendering

The design intentionally avoids requiring a backend in Phase 1.

## Testing Strategy

Testing should focus first on correctness of the training and scoring logic.

### Unit Tests

Priority unit test areas:

- `typing-engine`
- `session-scoring`
- `challenge-achievement`

Key cases to cover:

- Correct input progression
- Incorrect input handling
- Deletion and correction behavior
- Session completion
- Special symbol handling
- Empty content boundaries
- WPM and accuracy calculations
- Achievement unlock conditions
- Daily challenge generation stability

### Integration Tests

At least one end-to-end feature flow should be covered at the application level:

- Open practice screen
- Start session
- Complete typing input
- Show results
- Save history
- Update challenge and achievement state

### Manual Verification

Manual verification is required because the product is highly interaction-sensitive.

Required manual checks:

- Typing feel on desktop
- Cursor and error rendering
- Different content styles
- Short and long snippet layout behavior
- Mobile responsiveness

## Future Extension Points

This design should leave room for Phase 2 and beyond:

- User accounts
- Cloud sync
- Online leaderboards
- Friends or social competition
- Larger challenge systems
- More advanced analytics

These features should layer on top of existing module boundaries rather than forcing a rewrite of the typing engine.

## Non-Goals for Phase 1

To keep scope controlled, Phase 1 should not include:

- Multiplayer features
- Global online ranking
- Account registration
- AI-generated personalized lessons
- Arbitrary user-uploaded content workflows
- Large curriculum or classroom systems

## Success Criteria

Phase 1 is successful if:

- Users can complete short programmer-focused typing sessions smoothly
- The app accurately scores speed and correctness
- Mixed and focused practice both feel useful
- Daily challenge and achievement features encourage repeat use
- The architecture can later accept accounts and rankings without replacing the core engine

## Open Implementation Notes

- Prefer deterministic content selection for reproducibility and testing.
- Keep scoring rules transparent and stable.
- Optimize for interaction polish before expanding feature count.
- Build the app so the typing engine remains understandable and testable in isolation.
