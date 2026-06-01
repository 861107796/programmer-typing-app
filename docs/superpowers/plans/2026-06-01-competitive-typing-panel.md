# Competitive Typing Panel Implementation Plan

## Goal

Implement the competitive prompt-area redesign described in `2026-06-01-competitive-typing-panel-design.md` so the typing experience feels more like an active challenge surface and less like a passive code block.

## Scope

This plan covers:

- prompt-area visual hierarchy changes
- prompt typography and container changes
- stronger current/completed/error character styling
- light metric styling support if it materially strengthens the prompt feel
- regression verification for typing behavior

This plan does not cover:

- changes to scoring logic
- animation-heavy reward systems
- leaderboard or progress feature changes

## Task 1: Review Prompt Rendering Boundaries

Inspect the current practice surface and confirm which parts are purely presentational versus behavior-sensitive.

Target files:

- `src/components/TypingPanel.tsx`
- `src/components/ResultsPanel.tsx`
- `src/styles/app.css`

Expected output:

- clear understanding of which visual changes can stay CSS-only
- confirmation that no prompt progression logic needs to move

## Task 2: Strengthen Prompt-Area Structure

Refactor the prompt panel markup only as needed to support a more arena-like hierarchy.

Potential changes:

- add clearer prompt-frame wrapper elements
- add dedicated class hooks for prompt copy, prompt surface, and metrics rows
- preserve semantic structure and accessibility labels

Constraints:

- no typing behavior changes
- no new state added unless strictly necessary for presentation

## Task 3: Rebuild Prompt Surface Styling

Update the prompt container so it reads as the primary gameplay surface.

CSS goals:

- deeper background treatment
- stronger visual separation from surrounding panels
- more intentional internal padding and framing
- wider, more stable code lane feeling

Success criteria:

- the prompt surface becomes the most visually dominant area inside the trainer
- code-heavy prompts remain readable on desktop and mobile

## Task 4: Upgrade Competitive Typography

Restyle prompt typography to increase typing desire and target clarity.

CSS goals:

- larger prompt font size
- slightly stronger perceived weight
- tuned line height and spacing
- improved prompt text contrast against the arena surface

Constraints:

- multiline prompts must still wrap cleanly
- command, code, and technical prompts must all remain readable

## Task 5: Rework Character State Hierarchy

Strengthen the visual distinction between remaining, completed, current, and error characters.

Implementation goals:

- remaining text becomes quieter
- completed text feels more rewarding
- current character becomes unmistakable
- error state remains sharp and readable

Possible tactics:

- color hierarchy
- opacity/contrast shifts
- subtle glow or weight emphasis
- stronger cursor-anchor treatment

Constraints:

- do not rely on color alone
- preserve readability for color-sensitive users

## Task 6: Tune Supporting Metrics

Lightly restyle the metrics row so it supports the competitive typing tone without stealing focus from the prompt.

Possible changes:

- stronger numeric emphasis
- cleaner layout rhythm
- better positive/negative state distinction

This task should remain secondary. If the metrics redesign starts competing with the prompt surface, scale it back.

## Task 7: Regression and Visual Verification

Run focused verification to ensure the redesign does not break the trainer.

Required checks:

- existing typing-related tests still pass
- build still passes
- multiline prompt rendering still works
- desktop and narrow-width layouts still hold together

Recommended commands:

- `npm.cmd test -- src/test/renderApp.test.tsx`
- `npm.cmd run build`

## Task 8: Manual Experience Pass

Open the local app and inspect the trainer experience with at least:

- command prompt
- multiline YAML or code prompt
- focused mode
- continuous typing flow after completion

Manual review criteria:

- prompt feels more like a target than a display block
- current character is easy to track
- completed characters feel more rewarding
- the redesign improves motivation without becoming visually noisy

## Deliverables

- updated `TypingPanel.tsx` presentation structure if needed
- updated `ResultsPanel.tsx` support styling only if justified
- updated `app.css`
- passing regression/build verification

## Risks and Mitigations

### Risk: Visual noise

Too much glow, contrast, or emphasis could make the prompt harder to read.

Mitigation:

- prefer hierarchy over decoration
- keep effects subtle and test with multiline prompts

### Risk: Mobile regression

Larger prompt typography may overflow or feel cramped on smaller screens.

Mitigation:

- add responsive typography adjustments
- manually verify narrow layouts

### Risk: Prompt no longer feels technical

An overly gamified treatment could undermine the programmer-tool identity.

Mitigation:

- keep the palette and structure technical
- use competitive framing, not arcade gimmicks
