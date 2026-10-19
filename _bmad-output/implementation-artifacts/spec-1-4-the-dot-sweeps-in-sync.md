---
title: 'Story 1.4: The dot sweeps in sync'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '0f0f28faaa37cb43c178ac09fb13bf6c95b7a215'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The click plays but nothing shows time. A musician needs a dot that rests on beat 1 when stopped and sweeps the ring clockwise in sync with the audible click when playing.

**Approach:** Add `engine/clock.ts` (audible-time `ClockReader`), a `render` layer with one rAF loop, grid (cached) and dot layers, and a `ui`-owned `<canvas>` on the placeholder page. The dot angle comes from core `positionAt` at `ClockReader.now()`.

## Boundaries & Constraints

**Always:** `ClockReader` (`now(): number`, `timeline(): Timeline | null`) is typed in `src/core/ports.ts`; its only implementation is `src/engine/clock.ts`. `now()` = `getOutputTimestamp().contextTime + (performance.now() − performanceTime)/1000`, falling back to `currentTime − baseLatency − (outputLatency ?? 0)`; it never returns less than its previous value. `src/render/` has the only `requestAnimationFrame` loop; each frame reads `ClockReader` once, builds one `Frame`, and calls layers bottom to top (`grid`, then `dot`); layers are `(ctx, frame) => void` with no allocation per frame. `ui` owns the `<canvas>`; render owns sizing (CSS size × `devicePixelRatio`) and ring geometry, beat 1 at 12 o'clock, clockwise. The grid layer draws the 3px ink ring once to an offscreen cache, invalidated on size/DPR change. Dot: 18px ink disc with 2px surface halo; stopped (no timeline) it sits on beat 1. Colors come from the existing CSS tokens (`--ink`, `--surface`) read once, not hard-coded per layer. Canvas is a square of `min(100vw − 2×gutter, 480px)`, never below 260px, centered between title and button. Engine exposes the scheduler's current `Timeline` through `ClockReader.timeline()`. Only `main.ts` builds adapters.

**Never:** No spokes, beat labels, comet tail, glow, crossing, markers, `--pulse` or hit-testing (later stories); no `ClockReader` use in the scheduler (it keeps raw `currentTime`); no time source other than `ClockReader` for dot position; no changes to `src/core/timeline.ts`/`plan.ts` logic; no reduced-motion variant needed yet (dot has no tail); no audio lifecycle work (1.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| App opens | stopped, no timeline | Dot on ring at 12 o'clock, ring drawn, loop idle-draws at rest | N/A |
| Playing | timeline set, `now ≥ startTime` | Angle = `positionAt(tl, now) / (beats×PPQ) × 2π` from 12 o'clock; beat 1 click ⇒ dot at 12 within one frame | N/A |
| Before beat 1 | `now < startTime` (START_LEAD) | `positionAt` clamps to 0: dot on beat 1 | N/A |
| Stop | status → stopped | `timeline()` null; dot returns to 12 immediately | N/A |
| Output timestamp unavailable | `getOutputTimestamp` returns 0/missing | Fallback formula, still monotonic | N/A |
| Resize / DPR change | container or DPR differs | Canvas backing store resized, grid cache rebuilt | N/A |

</frozen-after-approval>

## Code Map

- `src/core/ports.ts` -- add `ClockReader`; `Timeline` type from `core/timeline.ts`.
- `src/core/timeline.ts` -- reuse `positionAt`; `core/constants.ts` `PPQ`. Do not change.
- `src/core/dot-angle.ts` (new) -- pure `dotAngle(timeline, now)`: radians clockwise from 12 o'clock; 0 when `timeline` is null.
- `src/engine/clock.ts` (new) -- `createClockReader(ctx, getTimeline)`; the one sanctioned `performance.now()` timing use.
- `src/engine/scheduler.ts` -- expose `timeline` getter (`state?.timeline ?? null`) on `Scheduler`.
- `src/render/loop.ts` (new) -- `mount(canvas, clock)`: sizing, rAF loop, builds `Frame` (`now`, `timeline`, `width`, `height`, `dpr`, `theme`), returns dispose.
- `src/render/geometry.ts` (new) -- center, ring radius, dot point from angle (pure, testable).
- `src/render/layers/grid.ts`, `dot.ts` (new) -- layers; grid owns offscreen cache.
- `src/ui/App.svelte` -- `<canvas>` + `mount` in `onMount`, `clock` prop; existing pill and tokens stay.
- `src/main.ts` -- build clock reader, pass to App. `scripts/check-boundaries.ts` must pass (render imports core only).
- Tests: `src/core/dot-angle.test.ts`, `src/engine/clock.test.ts` (fake ctx), `src/render/geometry.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/ports.ts`, `src/core/dot-angle.ts`, test -- `ClockReader` type and pure angle -- single contract for render
- [x] `src/engine/clock.ts`, test -- audible-time reader, monotonic, fallback -- AD-1
- [x] `src/engine/scheduler.ts` -- expose current timeline -- source for `ClockReader.timeline()`
- [x] `src/render/geometry.ts`, `layers/grid.ts`, `layers/dot.ts`, `loop.ts`, geometry test -- one rAF loop, cached grid, dot -- AD-9
- [x] `src/ui/App.svelte`, `src/main.ts` -- canvas element, wiring, layout -- UX-DR4/5

**Acceptance Criteria:**
- Given a timeline starting at T, when `now` equals T, T + one beat, T + half a bar, then `dotAngle` is 0, 2π/beats, π.
- Given `now()` is called repeatedly while the fake context time stalls or steps back, then returned values never decrease.
- Given the page loads stopped, then the ring is drawn and the dot sits at 12 o'clock with halo.
- Given `npm run check`, `npm test`, `npm run lint`, `npm run build`, then all pass including the boundary test.

## Implementation Notes

- Implemented directly (no subagent). `dotAngle` reads the bar length from the segment playing at `now`. `Scheduler.timeline` is the `ClockReader.timeline()` source; `main.ts` builds the reader. Canvas CSS size is `clamp(260px, min(100vw − 32px, 480px), 480px)`; the 16px gutter is hard-coded until the design tokens story. Theme colors are read once at mount from `--ink`/`--surface`.
- Not unit-tested: the canvas loop/layers (DOM); covered by the manual check.

## Spec Change Log

## Review Triage Log

Inline review (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Grid layer built a template-string cache key every frame, an allocation in a layer (AD-9) | low | patch: replaced with numeric/string field comparisons; checks re-run green |
| Theme colors are read once at mount, so a later token change is not picked up | false | tokens are static in this story (light only); nothing changes them at runtime |
| `dotAngle` repeats `positionAt`'s segment lookup | low | reject: fix would add a core API for a two-line duplicate |

## Design Notes

`getOutputTimestamp()` returns `contextTime` in audio seconds at `performanceTime`; adding elapsed performance time interpolates between coarse WebKit `currentTime` steps and shifts the dot to what is audible (AD-1). Layers receive a preallocated mutable `Frame` object that the loop fills each tick, so no per-frame allocation occurs.

## Verification

**Commands:**
- `npm run check && npm test && npm run lint && npm run build` -- expected: all exit 0

**Manual checks:**
- `npm run dev`: dot rests at 12 o'clock; Start sweeps clockwise one lap per 4 beats at 80 BPM, passing 12 as the accent sounds; Stop snaps it back to 12.
