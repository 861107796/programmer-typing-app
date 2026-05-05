# Content Library Expansion Design

Date: 2026-05-05
Status: Approved for spec review

## Overview

This document defines the next product phase for the programmer typing trainer: expanding the practice library from a small seed set into a large, structured, maintainable content system. The goal is to move from a proof-of-concept library to a production-worthy catalog that feels meaningfully varied for repeat use.

This phase focuses on content depth, metadata quality, and maintainable content organization. It does not introduce new backend systems or social features.

## Product Goal

Expand the typing content library to a structured set of more than 400 programmer-relevant prompts so the app feels diverse, realistic, and worth revisiting. The expanded library should support future filtering, specialized practice modes, and richer progress features without requiring a redesign of the content model.

## Scope

This phase includes:

- Expanding the library to approximately 420 prompts
- Structuring content by category, topic, difficulty, and length
- Reorganizing content into maintainable data files
- Updating content selection logic to support metadata-aware filtering
- Preserving compatibility with the existing mixed practice, focused practice, and daily challenge flows

This phase excludes:

- User-generated prompt imports
- AI-generated on-demand prompts at runtime
- Online content sync
- Community-shared content packs
- New progression systems beyond what is needed to support the expanded library

## Target Content Shape

The expanded library should feel like realistic developer input, not generic typing practice. Prompts should reflect things programmers actually type in code editors, terminals, API docs, logs, config files, and technical writeups.

The content set should be broad enough to feel fresh over repeated sessions while still being curated enough to avoid filler and low-quality repetition.

## Total Volume

The target size for the first large expansion is approximately 420 prompts.

Recommended distribution:

- `code`: 180 prompts
- `command`: 140 prompts
- `technical`: 100 prompts

This weighting reflects the product’s focus on real programming input, with code as the largest and most central typing surface.

## Category Design

### Code

Code prompts should emphasize syntax-heavy input and realistic snippets rather than large algorithm exercises.

Target topics:

- JavaScript
- TypeScript
- Python
- SQL
- Shell scripting
- JSON
- YAML

Examples of characteristics:

- Function signatures
- Object and array literals
- Conditions and comparisons
- Async code
- Query fragments
- Config fragments
- Symbol-dense expressions

### Command

Command prompts should reflect realistic terminal use and ops-style typing.

Target topics:

- Git
- Package managers
- Filesystem commands
- Search and filtering
- Docker
- Curl and HTTP requests
- Environment variables
- Command chaining

Examples of characteristics:

- Flags and options
- Paths
- Quoted arguments
- Pipes
- Long multi-parameter commands

### Technical

Technical prompts should feel like developer-facing English rather than general prose.

Target topics:

- APIs
- Databases
- Logging
- Deployment
- Debugging
- Error descriptions
- Documentation-style instructions

Examples of characteristics:

- API behavior statements
- Error handling notes
- Infra and deployment instructions
- Code review or architecture guidance

## Topic Metadata

Each prompt should carry a `topic` field so the system can later support topic-specific practice modes without restructuring the dataset.

Examples:

- Code topics: `javascript`, `typescript`, `python`, `sql`, `shell`, `json`, `yaml`
- Command topics: `git`, `npm`, `pip`, `filesystem`, `search`, `docker`, `curl`
- Technical topics: `api`, `database`, `logging`, `deploy`, `debugging`, `docs`, `errors`

Not every category must use exactly the same topic count, but each topic should have enough volume to feel real when selected on its own.

## Length Model

Each prompt should include a `length` field.

Supported values:

- `short`
- `medium`
- `long`

Recommended distribution:

- `short`: 45%
- `medium`: 40%
- `long`: 15%

### Short

Designed for quick rounds and repetition. Typical feel: 5 to 15 seconds.

### Medium

Designed for the default rhythm of the app. Typical feel: 15 to 35 seconds.

### Long

Designed for sustained focus and stability. Typical feel: 35 to 60 seconds.

The library should not collapse into one dominant length. Users should experience meaningful variety.

## Difficulty Model

Each prompt should include a `difficulty` field.

Supported values:

- `easy`
- `medium`
- `hard`

Recommended distribution:

- `easy`: 25%
- `medium`: 50%
- `hard`: 25%

### Easy

Simple structure, moderate symbol density, and clearer readability.

### Medium

The default tier. Realistic development typing with normal syntax and terminology.

### Hard

Higher symbol density, deeper nesting, longer paths, more flags, or more complex technical phrasing.

Difficulty should come from realistic input complexity, not from making prompts awkward or unnatural.

## Prompt Data Model

Each prompt should use a structured object shape.

```ts
{
  id: "code-ts-001",
  category: "code",
  topic: "typescript",
  difficulty: "medium",
  length: "short",
  label: "Typed function",
  prompt: "const formatPrice = (value: number) => value.toFixed(2);"
}
```

Required fields:

- `id`
- `category`
- `topic`
- `difficulty`
- `length`
- `label`
- `prompt`

### Field Rules

- `id` must be unique and stable
- `label` should be short and readable in the UI
- `prompt` must be the exact string the user types
- `topic`, `difficulty`, and `length` must be constrained to known values

## File Organization

The content library should move out of one inline file and into explicit data files.

Recommended structure:

- `src/content/data/code.ts`
- `src/content/data/command.ts`
- `src/content/data/technical.ts`
- `src/content/contentLibrary.ts`

Responsibilities:

- Data files define prompt records only
- `contentLibrary.ts` composes and filters them
- UI and hooks should not need to know where content physically lives

This structure keeps the library maintainable as it grows and makes future review simpler.

## Selection Behavior

The content system should support current product modes and leave room for future filtering.

Required capabilities:

- Fetch all prompts
- Fetch by category
- Fetch by topic
- Fetch by difficulty
- Fetch by length
- Fetch by combinations of those filters
- Build mixed practice sets with balanced category rotation
- Build deterministic daily challenges

Mixed practice should continue to feel varied and should not accidentally collapse into one category because of ordering artifacts.

## Daily Challenge Compatibility

The expanded library must remain compatible with the existing daily challenge system.

Requirements:

- A date should still deterministically map to a prompt or a small set of prompts
- The challenge pool should draw from the richer metadata model without becoming unstable
- Daily challenge selection should remain reproducible for testing and debugging

## Content Production Strategy

The recommended workflow is:

1. Define prompt templates by topic
2. Generate a large draft set from those templates
3. Curate down to the final approved library

### Step 1: Template Design

For each topic, create a bank of realistic prompt patterns. Examples:

- TypeScript function declarations
- Python comprehension expressions
- SQL selection and filtering snippets
- Git status and branch commands
- Curl requests with headers
- Documentation-style architecture guidance

Templates should generate realistic diversity without reading like simple variable swaps.

### Step 2: Large Draft Generation

Generate more prompts than needed, aiming for roughly 500 initial candidates so curation can remove weak content without dropping below the target volume.

### Step 3: Human Curation

Remove prompts that are:

- Too repetitive
- Too artificial
- Semantically awkward
- Poorly balanced in length
- Excessively similar except for renamed identifiers
- Too far from real developer input

The final accepted set should land around 420 prompts.

## Quality Standards

Every accepted prompt should meet these standards:

- It resembles real developer input
- It contains meaningful typing value, especially for symbols and developer syntax
- It is readable and coherent
- It adds variety rather than duplicate coverage
- It fits the intended difficulty and length tags

Technical English prompts should feel like actual developer communication, not like ESL practice content.

## Non-Goals

This phase should not attempt to solve all future content problems at once.

Specifically out of scope:

- Procedural content generation in the shipped app
- User-uploaded snippets
- Localization
- Runtime personalization
- A full editorial CMS

## Architecture Impact

This content phase should require only modest app architecture changes if done cleanly.

Likely code changes:

- Expand domain types to include `topic`, `difficulty`, and `length`
- Split the content library into multiple files
- Update filtering and mixed set generation logic
- Add tests for metadata-aware selection

The typing engine, scoring, and storage layers should need little or no redesign.

## Testing Strategy

Testing should focus on both data integrity and selection correctness.

### Data Integrity Tests

Verify:

- All prompt ids are unique
- All prompts use valid metadata values
- Category counts match expectations
- Prompt totals remain above the target threshold

### Selection Logic Tests

Verify:

- Category filtering works correctly
- Topic filtering works correctly
- Difficulty and length filtering work correctly
- Mixed practice pulls from multiple categories
- Daily challenge selection is deterministic

### Manual Review

Human review is required before finalizing the library.

Review should check:

- Realism
- Variety
- Symbol density
- Distribution balance
- Awkward or repetitive content

## Success Criteria

This phase is successful if:

- The app ships with roughly 420 curated prompts
- The library covers general programmer input rather than one narrow ecosystem
- Repeated practice sessions feel noticeably more varied
- Metadata is rich enough to support future filtering and specialized training modes
- The dataset is maintainable without turning `contentLibrary.ts` into a monolith

## Open Implementation Notes

- Prefer stable, human-readable ids
- Keep topic names lowercase and normalized
- Avoid prompt strings that are too long for the current UI without explicit long-length intent
- Balance realism and typing value; not every realistic line is a good exercise
