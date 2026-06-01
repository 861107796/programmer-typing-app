# Competitive Typing Panel Redesign

## Goal

Rework the practice prompt area so typing feels like an active challenge instead of reading from a passive code block. The redesign should increase the user's sense of momentum, pressure, and reward while preserving the current trainer flow and input logic.

## Problem Statement

The current typing panel is functional but visually flat.

- The prompt text looks like ordinary code display, not a target worth attacking.
- Completed, current, and remaining characters do not feel distinct enough.
- The prompt container behaves like a neutral `pre` block instead of the main gameplay surface.
- The user gets correctness feedback, but not enough emotional feedback while progressing through a prompt.

As a result, typing does not feel satisfying, and the interface does not create enough motivation to continue.

## Design Direction

The prompt area should shift from "code viewer" to "typing arena".

This redesign should emphasize:

- target clarity: the current typing objective is obvious
- progression: each typed character visibly advances the run
- reward: completed characters feel conquered, not merely recolored
- pressure: the active prompt area feels important and high-stakes

The style should stay technical and clean, but move toward a competitive training aesthetic rather than a terminal or plain editor block.

## Scope

This redesign covers:

- the prompt container
- the prompt typography
- character state styling
- prompt-area spacing and hierarchy
- related metric presentation if needed to support the new feel

This redesign does not include:

- new scoring logic
- new animation-heavy game systems
- changes to typing correctness rules
- changes to content generation

## Visual Strategy

### 1. Prompt As Main Arena

The prompt container should become the most visually important region in the trainer.

It should feel:

- darker and deeper than surrounding panels
- more framed and deliberate
- closer to a race lane or combat surface than a passive code sample

Expected treatment:

- stronger contrast between page background and prompt background
- more deliberate inner depth using shadow or inset treatment
- tighter focus on the active text region

### 2. More Competitive Typography

The prompt text should feel stronger and more desirable to type.

Expected treatment:

- larger prompt font size
- slightly heavier visual weight
- tighter but still readable line height
- improved character density so the code feels more substantial

The result should feel closer to a high-focus challenge surface and less like documentation text.

### 3. Stronger Character State Hierarchy

Character states need a more dramatic visual separation.

#### Remaining characters

- visually quieter
- slightly dimmed
- still readable, but clearly secondary

#### Completed characters

- brighter and more rewarding
- should feel locked in or captured
- not only green; they may also gain subtle emphasis through weight, glow, or contrast

#### Current character

- the strongest focal point in the prompt
- should feel like the player's active target
- should read like a cursor-anchor, not just a highlight

#### Error state

- should remain clear and immediate
- should feel sharper and more consequential than the current treatment
- must not overwhelm readability

## Layout Adjustments

To support the new typing feel:

- the prompt block should get slightly more breathing room internally
- the prompt area should remain wide enough for code-heavy prompts
- title and category should support the prompt without visually competing with it
- the input area should still sit close enough to the prompt that the two feel connected

The prompt should clearly remain the hero of the panel.

## Metrics Support

The existing "Correct / Errors / Status" line is useful but visually low-impact.

This redesign may lightly restyle these metrics to support the competitive tone:

- slightly stronger numeric emphasis
- more dashboard-like alignment
- clearer distinction between positive and negative stats

This remains a secondary enhancement. The primary redesign target is the prompt area itself.

## Interaction Constraints

The redesign must preserve current functionality:

- multiline prompt rendering
- per-character state updates
- continuous practice mode
- keyboard input handling including `Enter`, `Tab`, and `Backspace`
- responsive behavior on smaller screens

No behavior regressions should be introduced while improving the visual feel.

## Accessibility

The redesign must keep the prompt readable and not rely on color alone.

Requirements:

- sufficient contrast between prompt text and background
- current-character state visible without requiring perfect color perception
- completed and error states still distinguishable for users with reduced color sensitivity
- no essential information conveyed only through subtle glow effects

## Testing Strategy

### Manual verification

- confirm the prompt area feels visually dominant on desktop
- confirm typing progression is easier to track at a glance
- confirm completed/current/error states remain readable on multiline prompts
- confirm mobile and narrow layouts do not collapse the hierarchy

### Regression verification

- existing typing panel tests should continue to pass
- no behavior changes should be required in prompt progression logic
- no interaction changes should break the current continuous typing flow

## Implementation Notes

This should primarily be a component-and-CSS pass focused on:

- `TypingPanel.tsx`
- potentially `ResultsPanel.tsx` if metric styling is adjusted
- `app.css`

The work should avoid introducing unnecessary state or logic complexity unless a visual treatment genuinely requires it.

## Success Criteria

The redesign is successful if:

- the prompt looks like the main challenge surface
- users can feel progress more strongly while typing
- the current character is unmistakable
- completed text feels rewarding instead of merely correct
- the overall trainer looks more like a competitive programming practice tool than a generic code exercise page
