---
title: 'Story 1.5: Audio that behaves on phones'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '217cbee999ab2f7ad8c20e05cf2344a1363cd67e'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A phone call, lock screen or app switch can leave the click silent or frozen while the UI says "playing". A musician needs playback to stop cleanly, say so when it matters, and recover on the next tap.

**Approach:** Add an engine lifecycle (AD-8): detect hidden / interrupted / suspended / hung-resume, stop with `paused-by-system` and a reason, never auto-resume, and on the next Start close and recreate the context, bank and timeline. Add a minimal notice line, a one-time silent-switch hint and a `ui` wake-lock module.

## Boundaries & Constraints

**Always:** `src/engine/audio-context.ts` stays the only creator of `AudioContext`; it sets `navigator.audioSession.type = 'playback'` before every creation where `audioSession` exists. `EnginePort` gains `pausedReason: 'hidden' | 'interrupted' | 'resume-failed' | null` and `audioSessionSupported: boolean`. Triggers while `playing`: `document.visibilityState` becomes hidden → `hidden`; context state becomes `interrupted` or `suspended` → `interrupted`; `resume()` rejects or has not settled after 1000 ms → `resume-failed`. Each stops playback exactly like `stop()` (cancel nodes, halt wake-up, drop timeline) but sets `paused-by-system`; nothing resumes on its own. `start` from `paused-by-system` (or after a bank decode failure) recreates the context in the same tick as the tap (before any await, so `resume()` is still inside the gesture), closes the old one without awaiting, reloads the bank, and starts from beat 1; `pausedReason` clears on `playing` or `stop`. `ClockReader` follows the current context and resets its monotonic floor when the context changes. Notice line: 48px reserved, polite live region, shows `Sound paused. Tap Start to play again.` for `paused-by-system` with reason `interrupted` or `resume-failed` only. The hint `No sound? Check the silent switch.` shows only when `audioSessionSupported` is false on iOS (iPhone/iPad/iPod UA, or MacIntel with touch), on the first Start of the page's life, held in an in-memory flag; the audio notice takes priority over it. Wake lock: requested on `playing`, released on any other status; `ui` module `wake-lock.ts` follows `status`, handles release-before-grant, and swallows unsupported/denied. The engine never throws or rejects into the UI. Only `main.ts` builds adapters.

**Never:** No persistence of the hint flag (Epic 5); no auto-resume or auto-restart; no visibility handler in the wake-lock module; no new notice priorities beyond audio > hint; no layout work beyond the 48px line (Story 2.1); no changes to `core/timeline.ts`/`plan.ts` or the planner.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tab hidden | playing, `visibilitychange` → hidden | stopped sound and dot, `paused-by-system`/`hidden`, no notice | N/A |
| Call/lock | playing, ctx `interrupted` or `suspended` | `paused-by-system`/`interrupted`, notice shown | N/A |
| Hung resume | Start, `resume()` pending > 1000 ms | `paused-by-system`/`resume-failed`, notice shown, bank/timeline not started | late settle ignored |
| Resume rejects | Start, `resume()` rejects or throws | same as hung resume | no throw into UI |
| Recover | `paused-by-system`, tap Start | new context + bank, plays from beat 1, notice cleared | decode failure → stays stopped, retry rebuilds again |
| iOS without audioSession | first Start | hint shows; second Start in same page life shows none | N/A |
| Wake lock denied/unsupported | playing | nothing visible, playback unaffected | swallowed |

</frozen-after-approval>

## Code Map

- `src/core/ports.ts` -- extend `EnginePort` (`pausedReason`, `audioSessionSupported`); export `PausedReason`.
- `src/engine/audio-context.ts` -- `AudioHost`: mutable `ctx`, `recreate()` (sets audioSession, creates, closes old unawaited), `onSystemPause(cb)` for visibility + `statechange` (re-attached per context), `audioSessionSupported`.
- `src/engine/scheduler.ts` -- deps `recreate`, `onSystemPause`, `audioSessionSupported`; resume timeout; `pause(reason)`; reuse `generation` guard; no change to planning code.
- `src/engine/clock.ts` -- accept `() => ClockSource`; reset floor on source identity change.
- `src/engine/fakes.ts` -- fakes for the new deps in scheduler tests.
- `src/main.ts` -- mutable `bank`/`out` chain rebuilt by `recreate`; attach a catch so a boot decode failure is not an unhandled rejection.
- `src/ui/notice.ts` (new) -- pure `deriveNotice({ status, pausedReason, silentHint })`; `src/ui/wake-lock.ts` (new) -- `createWakeLock(nav, engine)`.
- `src/ui/App.svelte` -- notice line (`aria-live="polite"`, 48px), silent-hint flag set on first Start, wake-lock wiring.
- Tests: `scheduler.test.ts`, `clock.test.ts`, `src/ui/notice.test.ts`, `src/ui/wake-lock.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/ports.ts`, `src/engine/audio-context.ts` -- port fields; host recreate and system-pause source -- AD-8
- [x] `src/engine/scheduler.ts`, `fakes.ts`, `scheduler.test.ts` -- pause reasons, 1 s resume timeout, rebuild on Start, never auto-resume, no throws -- FR24
- [x] `src/engine/clock.ts`, `clock.test.ts` -- follow current context, reset floor -- dot stays correct after recreate
- [x] `src/main.ts` -- rebuildable bank/out chain, wiring -- composition root
- [x] `src/ui/notice.ts`, `wake-lock.ts`, tests, `App.svelte` -- notice line, silent hint, wake lock -- UX/FR24

**Acceptance Criteria:**
- Given playing, when the page hides, the context is `interrupted`/`suspended`, or `resume()` exceeds 1000 ms, then status is `paused-by-system` with the matching reason and no sound is scheduled afterwards.
- Given `paused-by-system`, when Start is tapped, then `recreate` and `resume` are called before any await and playback begins from beat 1 with a fresh timeline.
- Given the reasons `interrupted`/`resume-failed`/`hidden`, then the paused notice shows for the first two only.
- Given the wake-lock request is denied or resolves after Stop, then nothing throws and no lock stays held.
- Given `npm run check`, `npm test`, `npm run lint`, `npm run build`, then all pass including the boundary test.

## Implementation Notes

- Implemented directly (no subagent). `AudioHost.recreate()` is synchronous; `main.ts` rebuilds the bank/out chain and the scheduler awaits the new `ready`. A bank decode failure also sets rebuild-on-next-Start. `createClockReader` now takes `() => ClockSource` and resets its floor on context change. Hint and paused notice share the one `<p aria-live>` line; the hint clears when playback leaves `playing`.
- Not unit-tested: `audio-context.ts` DOM listeners and `App.svelte` wiring (manual check on a phone).

## Spec Change Log

## Review Triage Log

Inline review (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Wake-lock grant arriving after stop or after a restart could leave a lock held | false | `sync` releases a late grant when `!wanted` or a sentinel already exists; covered by `wake-lock.test.ts` |
| `statechange` to `suspended` during Start could pause before playing | false | `pause` ignores any status but `playing`; status flips only after resume settles |
| Hidden tab during an in-flight Start is not caught | low | reject: the page is unusable then, and the next Start rebuilds on any later pause; fix adds a guard for a rare race |
| `audio-context.ts` listeners and `App.svelte` wiring have no unit tests | low | reject: DOM-bound; covered by the manual phone check |
