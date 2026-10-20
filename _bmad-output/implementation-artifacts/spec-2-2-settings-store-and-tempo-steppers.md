---
title: 'Story 2.2: Settings store and tempo steppers'
type: 'feature'
created: '2026-10-20'
status: 'done'
route: 'dispatch'
baseline_commit: 'ec0fa22ba4015326f230a74f6ff8cde54791889c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tempo is fixed at 80 BPM and the numeral is static. A musician needs `−` and `+` to set the speed, and the app needs one settings owner for the rest of Epic 2.

**Approach:** Add `src/ui/settings.svelte.ts` as the only settings writer (named actions through core `normalize`) with a subscribe hook that `main.ts` uses to call `engine.apply(snapshot)`. Add two 56px stepper buttons with hold-repeat around the numeral. Remove the spike `?bpm=` hook.

## Boundaries & Constraints

**Always:** The store holds a full `Settings`, starts from `DEFAULT_SETTINGS` (80 BPM), and every action builds the next value and passes it through `normalize`; `setTempo(bpm)` ends clamped to 30–250 integers. It exposes a reactive `current` for the UI and `subscribe(listener)` (framework-neutral, called after each change) for `main.ts`; only `main.ts` calls `engine.apply`. Start uses `current` at tap time. Steppers: 56px circles, 1.5px `ink` border, `surface-raised` fill, `surface-pressed` while pressed, ±1 per tap; `−` disabled at 30 and `+` at 250 (glyph `ink-disabled`, border at 0.4 opacity); labels `Decrease tempo` / `Increase tempo`. Hold: first step on press, repeat after 400 ms at 8 steps/s, then 20/s once held 1.5 s; repeating stops at a limit, on release, cancel, leave and blur. Keyboard Enter/Space steps once. No text selection or iOS callout on long press. Numeral and unit stay centered on the screen; the row remains 88px. Hold-repeat logic is a pure module with injectable timers.

**Never:** No drag-on-numeral or Tap tempo (2.4); no pending/secondary-ink numeral and no on-the-beat landing (2.3); no persistence (Epic 5); no change to scheduler or timeline code; no other settings actions yet; no `?bpm=`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tap + | bpm 80 | 81, numeral updates, subscribers notified once | N/A |
| Limit | bpm 250, `+` | stays 250, `+` disabled | normalize clamps |
| Limit low | bpm 30, `−` | stays 30, `−` disabled | normalize clamps |
| Hold | press and hold | +1 immediately, repeats at 8/s after 400 ms, 20/s after 1.5 s, stops at the limit | release/cancel/leave/blur stops |
| Bad input | `setTempo(NaN)` or 999 | repaired by `normalize` (NaN keeps current/default, 999 → 250) | never throws |
| Start after change | bpm set to 120, stopped, Start | plays at 120 | N/A |
| Spike URL | `?spike=1&bpm=250` | panel shows; tempo stays 80 | `bpm` ignored |

</frozen-after-approval>

## Code Map

- `src/core/settings.ts` -- `DEFAULT_SETTINGS`, `normalize`; reuse, do not change.
- `src/engine/scheduler.ts` -- `apply(next)` only stores settings today; tempo landing on the beat is 2.3, so a tempo change while playing is not audible until then.
- `src/main.ts` -- composition root: subscribe store → `engine.apply`; the spike `bpm` is replaced by the store's `current.bpm` in the snapshot.
- `src/ui/App.svelte` -- numeral row, `toggle` start settings, spike prop use.
- `src/ui/spike.ts`, `spike.test.ts` -- remove `bpm` from `parseSpike` and `SpikeHooks`.
- `src/ui/tokens.css` -- stepper colors/sizes come from tokens.
- New: `src/ui/settings.svelte.ts`, `src/ui/hold-repeat.ts`, `src/ui/Stepper.svelte`, and tests.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/settings.svelte.ts`, `settings.svelte.test.ts` -- store, `setTempo`, `subscribe` -- matrix rows tap/limit/bad input
- [x] `src/ui/hold-repeat.ts`, `hold-repeat.test.ts` -- timers injectable; 400 ms delay, 8/s, 20/s after 1.5 s, stop conditions -- hold row
- [x] `src/ui/Stepper.svelte`, `src/ui/App.svelte` -- 56px steppers around a centered numeral, store-driven numeral and start settings -- UX-DR10/11
- [x] `src/main.ts`, `src/ui/spike.ts`, `spike.test.ts` -- subscribe → `engine.apply`; remove `?bpm=` -- spike row
- [x] Screenshot check at 375×667 (headless), note result -- layout

**Acceptance Criteria:**
- Given the app at default, when `+` is tapped, then the numeral shows 81 and `engine.apply` receives a settings object with `bpm` 81.
- Given bpm at 30 or 250, then the matching stepper is disabled and does not repeat.
- Given stopped at a changed tempo, when Start is tapped, then the click runs at that tempo.
- Given `npm run check`, `npm test`, `npm run lint`, `npm run build`, then all pass.

## Implementation Notes

- Implemented directly. Store `createSettingsStore()` + `settingsStore` singleton; `setTempo` ignores non-finite input (keeps current). Listener list is a plain array (lint rule `prefer-svelte-reactivity` flags `Set`). `Stepper.svelte` steps on `pointerdown` via `createHoldRepeat`; `click` only steps for keyboard (`detail === 0`). ESLint config now parses `*.svelte.ts` with the TS parser. Spike `bpm` hook removed; the panel snapshot reads the store. Not tested automatically: `Stepper.svelte`/`App` wiring (no DOM runner); screenshot at 375×667 checked; pointer hold and iOS long-press behavior need a device check.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|
| `stepTempo` limit arithmetic confusing and untested | medium | patch: moved to `settingsStore.stepTempo`, direction-aware, tested at 30/31/249/250 |
| Trailing click double-steps on pointer press (`detail === 0` unreliable) | medium | patch: `pointerPressed` flag |
| No pointer capture; mouse leave drops hold | low | patch: `setPointerCapture`, `pointerleave` removed |
| Hold timer can outlive the component | low | patch: `$effect` cleanup releases |
| `setTempo` notifies when the value is unchanged | low | patch: commit skips unchanged snapshots, tested |
| Removed `?bpm=` leaves docs pointing at it | medium | patch: README and `spike/RESULTS.md` updated |
| Button disabled mid-hold may miss pointerup | false | `step` returns false at the limit, which stops the hold; capture and cleanup also release |
| Keyboard Enter auto-repeat steps at OS rate | low | reject: fix adds a keydown path; keyboard use is secondary |
| Multi-touch on one stepper | low | reject: not an everyday case |
| Listener throwing breaks other listeners | low | reject: one listener (engine.apply), which does not throw |
| `engine.apply` safe before first Start | false | `apply` only assigns settings |
| Tempo row not pinned to 88px | false | grid rows set 88px in `.column` |
| Store to engine wiring untested | medium | defer: tempo landing and `apply` tests belong with story 2.3 |
| Stepper/App component tests missing | medium | defer: no DOM runner (already logged for 2.1) |
| `aria-live` on numeral | low | reject: steppers carry labels; revisit with a11y pass |

## Verification

**Commands:**
- `npm run check && npm test && npm run lint && npm run build` -- expected: all pass

**Manual checks (if no CLI):**
- Dev server at 375×667: tap and hold `−`/`+`, stop at 30/250, Start at the new tempo.
- Playing, changing tempo changes the numeral but the click keeps its tempo until story 2.3 (known interim).
