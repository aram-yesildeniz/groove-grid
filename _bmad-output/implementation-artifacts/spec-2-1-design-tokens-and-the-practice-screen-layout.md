---
title: 'Story 2.1: Design tokens and the practice-screen layout'
type: 'feature'
created: '2026-10-20'
status: 'done'
route: 'dispatch'
baseline_commit: '221f54b63b5428cd5a25a2f4b0b0c8c61d5f6c0c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Epic 1 screen is a centered spike page with ad-hoc colors and sizes. Every later Epic 2 story needs the real tokens and the portrait column to build into, readable from a music stand.

**Approach:** Add the DESIGN tokens as CSS variables (light only) and rebuild `App.svelte`'s markup into the UX-DR3 column: top bar slot, grid circle, 48px notice line, 88px tempo row, 56px transport row. Existing Start/Stop, notice and canvas move in with unchanged behavior.

## Boundaries & Constraints

**Always:** Tokens live in one `src/ui/tokens.css` as `:root` custom properties named after the DESIGN tokens (`--surface`, `--ink-secondary`, `--space-3`, `--radius-lg`, `--control-lg`, `--column-max`, ...), with the values in the epic context; type tokens as size/weight/line-height variables. `--surface`, `--surface-raised` and `--ink` keep their names (the render loop reads `--ink`/`--surface`). Column: centered, max 480px, 16px gutter, page background edge to edge, `env(safe-area-inset-*)` respected, bottom padding inset + 16px. Circle: square, `min(100vw − 32px, available height)`, never under 260px (about 325px at 375×667), and the canvas stays CSS-sized so `render/loop.ts` resizing keeps working. Top bar slot reserves 66px + 8px and is empty. Tempo row is 88px and shows the current BPM numeral (bpm-numeral style, tabular, fixed 3-digit width) with the `BPM` unit, read-only, no steppers; the value is `DEFAULT_SETTINGS.bpm`, or the spike bpm under `?spike=1`. The Start/Stop pill is 56px ink with a surface-raised label; the Tap slot is reserved (empty) beside it. Notice line keeps `aria-live="polite"`, 48px, caption style, ink-secondary, centered. The `h1` stays for screen readers, visually hidden. System fonts only; no shadows, gradients or decoration.

**Never:** No new controls (steppers, chips, Tap, mute, sheets), no settings store, no tempo change, no engine/timeline/render-layer logic changes, no dark theme, no landscape overlay (Epic 5), no changes to the spike panel behavior (it renders below the column).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Phone portrait | 375×667 | all rows visible without scroll, circle ≈325px, notice 48px | N/A |
| Short phone | height < 667 | circle shrinks, never below 260px, page may scroll | N/A |
| Wide viewport | ≥ 768px wide | column 480px centered, background edge to edge | N/A |
| Safe areas | notch / home bar insets | content clear of insets | N/A |
| Behavior unchanged | tap Start / Stop, paused notice, silent hint | same as Epic 1 | N/A |

</frozen-after-approval>

## Code Map

- `src/ui/App.svelte` -- current spike markup and ad-hoc CSS; restructure markup/styles, keep script logic (toggle, notice, wake lock, spike hooks).
- `src/main.ts` -- imports `App`; import `tokens.css` here or in `App.svelte`.
- `src/render/loop.ts` -- reads `--ink`/`--surface` and `canvas.clientWidth`; do not change.
- `src/ui/notice.ts` -- notice text; unchanged.
- `index.html` -- already has `viewport-fit=cover`; CSP allows inline styles.
- `_bmad-output/planning-artifacts/ux-designs/ux-groove-grid-2026-10-18/DESIGN.md`, `mockups/key-practice.html` -- visual reference if a value is unclear.
- New: `src/ui/tokens.css`, `src/ui/tokens.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/tokens.css` -- all color, type, spacing and radius tokens (UX-DR1, UX-DR2) -- single source
- [x] `src/ui/tokens.test.ts` -- read the CSS and assert every token name and value from the epic context exists -- guards drift
- [x] `src/ui/App.svelte`, `src/main.ts` -- UX-DR3 column, tempo numeral row, transport row, hidden h1; drop the old inline `:root` vars -- layout
- [x] Check at 375×667 and 1280×800 in a headless or real browser, note results -- layout verification

**Acceptance Criteria:**
- Given the app at 375×667, when it loads, then the tokens exist as CSS variables and the rows measure top bar 66+8, circle ≥ 260 (≈325), notice 48, tempo 88, transport 56 with no horizontal scroll.
- Given a wide viewport, then the column is centered at ≤ 480px with the cream background edge to edge.
- Given Start/Stop, paused notice, silent hint and `?spike=1`, then they behave as before inside the new layout.
- Given `npm run check`, `npm test`, `npm run lint`, `npm run build`, then all pass.

## Implementation Notes

- Implemented directly. Tokens in `src/ui/tokens.css` (imported in `main.ts`); `App.svelte` markup/CSS rebuilt, script logic untouched except a derived `bpm`. Circle sized with a size container (`min(100cqw, 100cqh)`). Headless Firefox screenshots at 375×667 and 1280×800 checked: circle ≈325px, column 480px centered, no horizontal scroll. Safe-area insets and the notice line were not visually exercised (need a device).

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|
| Hidden h1 absolutely positioned without positioned ancestor | low | patch: `.column` is `position: relative` |
| Empty top-bar and tap slots not hidden from assistive tech | low | patch: `aria-hidden` |
| Notice row height hardcoded 48px | low | patch: uses `--target-min` |
| No component/DOM test for BPM numeral, Start label, layout | medium | defer: repo has no DOM test runner; layout checked by screenshots |
| `tokens.css` import not covered by a test | low | reject: a missing import leaves the page visibly unstyled |
| tokens test restates the CSS / substring match | low | reject: the test guards drift from the spec values; prefix false-matches impossible (`name: ` follows) |
| Canvas floor 260px not enforced on very narrow widths | low | reject: viewports under 292px do not exist for the target phones |
| Pressed state ignores `--surface-pressed` | false | spec and DESIGN specify 0.85 opacity for Start/Stop |
| Focus ring same colour as button | false | outline has a 2px offset on the surface, visible |
| Short viewport scrolls; column `min-height: 640px` | low | reject: spec allows scroll on short phones |
| Numeral right-aligned in 3ch box | false | spec asks for tabular fixed 3-digit width |
| Spike panel layout below column | false | panel is a below-the-column diagnostic; screenshot-level OK |
| Canvas backing store after container sizing change | false | `loop.ts` re-reads `clientWidth` every frame |
| `aria-label` on BPM numeral | low | reject: 2.2 replaces it with the stepper control |
| Hardcoded 88px/260px/640px, button text 18px | low | reject: no matching tokens in the epic context |

## Verification

**Commands:**
- `npm run check && npm test && npm run lint && npm run build` -- expected: all pass

**Manual checks (if no CLI):**
- Open the dev server at 375×667 and 1280×800 (devtools or headless screenshot); rows and sizes match the spec, Start/Stop plays and the dot sweeps.
