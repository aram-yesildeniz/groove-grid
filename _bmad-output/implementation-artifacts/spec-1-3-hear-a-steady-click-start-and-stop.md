---
title: 'Story 1.3: Hear a steady click — Start and Stop'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '336e9bfc8bcd93d96cc6be7bf670465e19356480'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The timing core exists but nothing sounds. A musician needs Start to produce a steady click (higher on beat 1) and Stop to end it, on a phone, with no late or doubled clicks.

**Approach:** Add the Web Audio engine adapter (suspended context at boot, pre-decoded placeholder samples, worker wake-up driving core `plan`, `AudioOut` port) behind `EnginePort`, wire it in `main.ts`, and add a Start/Stop pill to the placeholder page. Tempo fixed at 80 BPM, 4/4.

## Boundaries & Constraints

**Always:** `AudioContext` is created only in `src/engine/audio-context.ts`, at boot, suspended, after setting `navigator.audioSession.type = 'playback'` where present. Samples decode at boot; nothing is fetched inside a gesture. `resume()` is called synchronously in the Start tap, before any `await`. `start` begins from beat 1 at `currentTime + START_LEAD`. The scheduler calls core `plan` with raw `currentTime`; each event plays via `AudioOut.play(sampleId, time, gain, bus)`; an event with `time < currentTime` is skipped and counted, never played late. `stop()` cancels every scheduled node. Only `main.ts` constructs adapters. Constants (`WAKEUP_INTERVAL` 25 ms, `START_LEAD` 0.1 s) live in `src/core/constants.ts`. Placeholder WAVs are short mono with the transient at sample 0, named `sounds/click-beep-accent.wav` / `click-beep-normal.wav`, URLs built from `BASE_URL` in one function. Button: 56px ink pill, `surface-raised` text, label is the next action (`Start`/`Stop`).

**Never:** No tempo/meter/settings UI, no `apply` effect while playing (store only), no dot or canvas (1.4), no visibility/interruption/wake-lock/silent-switch hint or context recreation (1.5), no marker sounds, no new sound ids, no network calls, no audio libraries.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Start | stopped, bank ready, tap | `resume()` sync in tap; clicks from beat 1 at `currentTime + START_LEAD`; beat 1 plays accent sample, other beats normal; status `playing` | N/A |
| Start before bank ready | tap while decoding | `start` waits for `bankReady`, then begins | decode failure → status stays `stopped`, `console.warn` |
| Stop | playing | all scheduled sources stopped, worker halted, status `stopped`, nothing sounds after | N/A |
| Late event | wake-up delayed so `event.time < currentTime` | Event not played; `skipped` count +1 | N/A |
| Restart | Stop then Start | New timeline from beat 1 at new `currentTime + START_LEAD`; no leftover nodes | N/A |
| Double Start | `start` while playing | Ignored | N/A |

</frozen-after-approval>

## Code Map

- `src/core/constants.ts` -- add `WAKEUP_INTERVAL`, `START_LEAD`.
- `src/core/ports.ts` (new) -- `Bus`, `AudioOut {play, cancelAll}`, `Wakeup {start(cb), stop()}`, `EnginePort {start, stop, apply, status, pending, subscribe}`, `EngineStatus`. Pure types, no browser imports.
- `src/core/plan.ts`, `timeline.ts`, `settings.ts` -- reuse `createPlanState`, `plan`, `startTimeline`, `DEFAULT_SETTINGS`; do not change.
- `src/engine/scheduler.ts` (new) -- `createScheduler({out, wakeup, now})`: owns plan state; maps `CoreEvent` click → `(sampleId, gain)`; ignores `downbeat`; counts `skipped`; implements `EnginePort`.
- `src/engine/audio-context.ts` (new) -- creates the suspended context, audioSession, exposes `resume()`.
- `src/engine/sample-bank.ts` (new) -- `sampleUrl(id)` from `BASE_URL`, `loadBank(ctx)` fetch+decode, `bankReady` promise.
- `src/engine/audio-out.ts` (new) -- Web Audio `AudioOut`: `AudioBufferSourceNode.start(time)`, click bus gain, tracks live sources, `cancelAll`.
- `src/engine/wakeup.worker.ts` (new) + `src/engine/wakeup.ts` -- worker posting a tick every `WAKEUP_INTERVAL`; adapter implementing `Wakeup`.
- `src/engine/fakes.ts` (new) -- fake `AudioOut`, `Wakeup`, clock for tests.
- `public/sounds/click-beep-{accent,normal}.wav` -- generated placeholders; generator at `scripts/make-click-samples.ts` (kept so files are reproducible).
- `src/ui/App.svelte` -- Start/Stop pill via injected `EnginePort` prop; `src/main.ts` -- composition root.
- `scripts/check-boundaries.ts` -- must still pass (engine imports core only).

## Tasks & Acceptance

**Execution:**
- [x] `src/core/constants.ts`, `src/core/ports.ts` -- constants and port types -- single contract for engine/UI/fakes
- [x] `scripts/make-click-samples.ts`, `public/sounds/*.wav` -- generate accent (higher) and normal beeps, ~30 ms, transient at sample 0 -- placeholder AD-11 assets
- [x] `src/engine/scheduler.ts`, `fakes.ts`, `scheduler.test.ts` -- scheduler against fakes -- matrix rows incl. late skip, stop cancels, restart, double start, accent on beat 1 only, wake-up cadence drives `plan`
- [x] `src/engine/audio-context.ts`, `sample-bank.ts`, `audio-out.ts`, `wakeup.worker.ts`, `wakeup.ts` -- Web Audio/worker adapters -- unit-test the pure bits (`sampleUrl`)
- [x] `src/ui/App.svelte`, `src/main.ts` -- pill and wiring; `resume()` reached synchronously from the click handler -- label reflects `status`

**Acceptance Criteria:**
- Given the app loads, then the context is `suspended`, the bank is decoding, and no `start` has run.
- Given Start is tapped, then `resume()` is invoked before any `await` in the handler.
- Given a 4/4 run, then beat 1 events use the accent sample and the other three the normal sample, each at the core's closed-form time.
- Given `npm run check`, `npm test`, `npm run lint`, `npm run build`, then all pass including the boundary test.

## Implementation Notes

- Implemented directly (no subagent). `resume` is `() => Promise<void>` and `start` awaits it with `ready`, so beat 1 isn't skipped while the context wakes. `main.ts` hands the scheduler a deferred `AudioOut` that forwards once the bank has decoded.
- Beat 1 is committed on the first wake-up after start (window end equals `startTime` at start; `LOOKAHEAD == START_LEAD`). The spike tunes both.
- `apply` stores settings only; `pending` is always `null` this story.

## Spec Change Log

## Review Triage Log

Inline review (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Sample bank failure at boot leaves an unhandled rejection in `main.ts` and every later Start fails the same way | low | defer: only a missing or corrupt asset triggers it; Start already stays stopped and warns. Retry/recreate belongs with 1.5 lifecycle |
| Start → Stop → Start before the first start settles ignores the second tap (`starting` still true) | low | reject: window is the decode/resume time only; the guard fix adds state for a rare double tap |
| Beat 1 is committed on the first wake-up after start, not inside the tap (`START_LEAD == LOOKAHEAD`) | false | wake-up fires within 25 ms and beat 1 is 100 ms out; covered by the start test, and the spike tunes both constants |
| `cancelAll` via the deferred `out` runs in a microtask after `stop` | false | later `play` calls chain on the same resolved promise, so order is preserved |

## Design Notes

The scheduler depends only on `AudioOut`, `Wakeup` and a `now()` function, so tests drive it with a fake clock and fake wake-up ticks. Gains: accent 1.0, beat 0.7, sub 0.45 (applied on the click bus, mute is a later story). Sample id for a click: `click-<clickSound>-<accent|normal>`; `beat` and `sub` both use `normal`.

## Verification

**Commands:**
- `npm run check && npm test && npm run lint && npm run build` -- expected: all exit 0

**Manual checks:**
- `npm run dev` on a phone or desktop: Start clicks steadily with a higher first beat; Stop silences immediately; Start again restarts at beat 1.
