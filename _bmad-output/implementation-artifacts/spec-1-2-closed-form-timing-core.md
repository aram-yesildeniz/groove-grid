---
title: 'Story 1.2: Closed-form timing core'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: 'c4b215c91d81600d7458bd69d9242c80468d085b'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The click and dot need one trusted answer to "what happens when", proven by tests before any audio exists, or drift and doubled clicks will surface only on a phone.

**Approach:** Add the pure `src/core` timing model: `Settings` + `normalize`, an immutable closed-form `Timeline`, `eventsBetween`, `positionAt` and the lookahead `plan`, with a simulated 30-minute run at 30/120/250 BPM.

## Boundaries & Constraints

**Always:** Event time is `segment.startTime + (tick − segment.startTick) × secondsPerTick`, `secondsPerTick = 60 / (bpm × 960)`, never a running sum. Segment membership of a boundary tick is decided in ticks. Windows are half-open `[t0, t1)`. Core functions return new values, never mutate inputs. Seconds fields end in `Time`; no `any`; no DOM, Web Audio, Svelte or storage imports. Constants only in `src/core/constants.ts`. Defaults: 80 BPM, 4/4, grid 4 (16ths), all beats on, betweenBeats 1, clickSound `beep`, markerSound null, no markers, unmuted.

**Never:** No `withSettings` (Epic 2), no `marker` events (Story 4.3), no `snap`/`tickLabel`, no engine, worker, render or UI code, no `ports.ts`. Tempo is fixed per timeline; the timeline is built with one segment.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Consecutive windows | `[a,b)`,`[b,c)` incl. across a segment boundary | Union equals one `[a,c)` call; no duplicate, no missing | N/A |
| Before start | `positionAt(t < startTime)` | Returns 0 | N/A |
| Disabled beat | `clickBeats[i] = false` | No click on beat i or its between-beat clicks; `downbeat` still emitted at bar start | N/A |
| Between beats | `betweenBeats = d > 1`, enabled beat | `sub` clicks at `beat + k×960/d`, k = 1..d−1 | N/A |
| Levels | enabled beats | Beat 1 `accent`, other enabled beats `beat`, between `sub` | N/A |
| Empty plan window | `now + LOOKAHEAD ≤ committedUntil` | No events; `committedUntil` unchanged, never decreases | N/A |
| Bad settings | non-object, wrong types, bpm 999, beats 0, `clickBeats` wrong length or all false, off-grid markers | Valid `Settings`: numbers rounded and clamped, `clickBeats` resized to `beats` (all false → beat 1 on), invalid ids/divisions → defaults, markers filtered to integer ticks in `[0, beats×960)` on a grid line, sorted, unique | Repair silently, never throw |

</frozen-after-approval>

## Code Map

- `src/core/constants.ts` -- has PPQ, BPM/beats ranges; add `LOOKAHEAD` (0.1 s) and the id sets `CLICK_SOUND_IDS`/`MARKER_SOUND_IDS` with `ClickSoundId`/`MarkerSoundId` (AD-11).
- `src/core/settings.ts` (new) -- `Division`, `Settings` (AD-4 shape), `DEFAULT_SETTINGS`, `normalize`.
- `src/core/timeline.ts` (new) -- `Metric`, `Segment {startTick, startTime, barOriginTick, metric}`, `Timeline {segments}`, `Live`, `CoreEvent` union (`click` {time, tick, level}, `downbeat` {time, tick}), `startTimeline`, `eventsBetween`, `positionAt`.
- `src/core/plan.ts` (new) -- `PlanState {timeline, live, committedUntil}`, `createPlanState`, `plan`.
- `src/core/*.test.ts` (new) -- next to each module.
- `scripts/check-boundaries.ts` -- must keep passing; core files import siblings with `./x.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/constants.ts` -- add `LOOKAHEAD` and sound id sets -- single home for constants
- [x] `src/core/settings.ts` + `settings.test.ts` -- `Settings`, defaults, `normalize` -- matrix "Bad settings" and a valid round-trip
- [x] `src/core/timeline.ts` + `timeline.test.ts` -- `startTimeline`, `eventsBetween` (candidate ticks are multiples of `960/betweenBeats`; locate the first tick at/after a time by estimate then correct against the closed-form time, so every window uses one monotone predicate), `positionAt` -- matrix rows; include a hand-built two-segment timeline for boundary no-dup/no-miss
- [x] `src/core/plan.ts` + `plan.test.ts` -- `plan(state, now)` returns events for `[committedUntil, now + LOOKAHEAD)` and sets `committedUntil` to the window end, not an event time -- empty-window row
- [x] `src/core/simulation.test.ts` -- 30-minute run at 30, 120, 250 BPM stepping `plan` with a ~25 ms clock; assert every event time equals its closed-form value, no duplicate or missing tick, ordering by time then tick (downbeat before click)

**Acceptance Criteria:**
- Given a timeline, when events are requested over any partition of a span, then the concatenation equals one call over the span.
- Given the simulated runs, then every event time equals `startTime + tick × secondsPerTick` exactly as computed by the closed form.
- Given `npm run check`, `npm test`, `npm run lint`, then all pass, including the boundary test over the real `src/`.

## Implementation Notes

- Implemented directly (no subagent). `scripts/check-boundaries.ts` now lets `*.test.ts` import bare specifiers (vitest); relative-layer rules still apply to tests.
- `eventsBetween` places downbeat before click at the same tick; `positionAt` picks the last segment with `startTime <= t`.

## Spec Change Log

## Review Triage Log

Inline review (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| `eventsBetween` loops forever for non-finite `t0`/`t1` | low | reject: callers pass audio-clock seconds; guarding adds branches for an unreachable input |
| Test-file exemption in boundary check lets tests import any bare specifier | low | reject: tests still obey relative-layer rules; core never ships tests |
| Segment `from` index assumes `startTick` is a multiple of the step | false | segments start on beat boundaries (AD-6); `withSettings` is Epic 2 |
| Float edges could drop or duplicate an event at a window boundary | false | one monotone `tickTime` predicate serves every window; covered by the partition, edge and 30-minute tests |

## Design Notes

Ticks are absolute since start; bar position is `(tick − barOriginTick) mod (beats × 960)`. Downbeat is a multiple of `barTicks`, always a multiple of the candidate step, so it needs no special enumeration. `eventsBetween` ignores `live` for now (kept for the AD-2 signature; markers arrive in 4.3).

## Verification

**Commands:**
- `npm run check && npm test && npm run lint && npm run build` -- expected: all exit 0
