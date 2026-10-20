---
title: 'Story 1.6: iPhone timing spike and platform gate'
type: 'feature'
created: '2026-10-20'
status: 'done'
route: 'dispatch'
baseline_commit: '42d6e0039b28d7b8b02fd49261e5e12f0b276b03'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** AD-13 says the whole web platform stands or falls on an iPhone timing run, but nothing can be measured yet: no way to set 30/120/250 BPM, no skipped-event or wake-up logging, and no script to check a recording against `t0 + n × period`.

**Approach:** Build the measurement tooling and ship it to `main` so the user can run the tests on a real iPhone against the live URL: a `?spike=1&bpm=` harness with an on-screen log, a `spike/` recording analyser, and `spike/RESULTS.md` holding the runbook and the pass/fail record. The user performs the device runs, tunes the constants and records the verdict.

## Boundaries & Constraints

**Always:** The harness activates only with `?spike=1`; `?bpm=` (clamped to `BPM_MIN..BPM_MAX`) is read only then. Normal URLs behave exactly as today. The log shows elapsed time, `skipped`, wake-up interval stats (count, mean, max, count over 2× `WAKEUP_INTERVAL`) and rAF stats (frames, median delta, count over 1.5× median), plus a Copy-JSON button. Wake-up and frame timing use `performance.now()` for diagnostics only, never for scheduling or the dot. `spike/analyze.ts` runs under `node` type stripping like `scripts/`, takes a WAV path, `--bpm` and an optional `--fit-period`, and exits non-zero when any onset deviates more than ±1 ms from `t0 + n × period` (t0 = first onset). `spike/RESULTS.md` starts with every result `PENDING`. Layer rules hold: probes live in `engine`/`render`, the panel in `ui`, wiring in `main.ts`.

**Never:** No change to `core/timeline.ts`, `plan.ts` or planner behavior; no tuning of `LOOKAHEAD`, `WAKEUP_INTERVAL` or `START_LEAD` before the user supplies results; no recorded pass/fail written by me; no new user-facing UI outside `?spike=1`; no audio or analytics libraries.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hook off | URL without `spike=1` | no panel, bpm stays 80 | `?bpm=` ignored |
| Hook on | `?spike=1&bpm=250` | panel shown, Start plays 250 BPM | bpm 999 → 250, NaN → 80 |
| Clean recording | click track on period, 30 min | all deviations within ±1 ms, PASS, exit 0 | N/A |
| Drift / jitter | an onset 1.5 ms off, or slow walk | FAIL names worst onset, exit 1 | N/A |
| Recorder clock skew | `--fit-period` | reports fitted period ratio (ppm) and deviations from the fit | nominal result still printed |
| Bad input | non-WAV, no onsets, missing `--bpm` | clear message, exit 2 | no stack trace |
| Log copy | tap Copy JSON | clipboard holds the stats JSON | clipboard denied → text selectable in panel |

</frozen-after-approval>

## Code Map

- `src/core/constants.ts` -- tunables the user adjusts after the runs; do not edit now.
- `src/core/settings.ts` -- `DEFAULT_SETTINGS`, `BPM_MIN/MAX`; harness spreads `bpm` over defaults.
- `src/engine/scheduler.ts` -- exposes `skipped`; probe reads it, no change.
- `src/engine/wakeup.ts` -- wrap with a probe in `main.ts` rather than editing the worker.
- `src/render/loop.ts` -- `mount(canvas, clock)`; add optional `onFrame(ts)` so the one rAF loop feeds frame stats (AD-9).
- `src/main.ts` -- composition root: parse spike params, wrap `wakeup`, pass `spike` prop to `App`.
- `src/ui/App.svelte` -- use spike bpm in `engine.start`; mount `SpikePanel` when enabled.
- `vitest`/`tsconfig.json`/`eslint` -- include `spike/**`.
- `README.md` -- short spike section.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/spike.ts`, `spike.test.ts` -- `parseSpike(search)` → `{enabled, bpm}` -- hook off/on/clamp rows
- [x] `src/engine/spike-probe.ts`, test -- interval and frame stat accumulators, `snapshot()` JSON -- logging
- [x] `src/render/loop.ts`, `src/main.ts` -- `onFrame` hook; wakeup wrapper; probe wiring -- feed stats
- [x] `src/ui/SpikePanel.svelte`, `App.svelte` -- panel, elapsed clock, skipped, Copy JSON, spike bpm -- on-device log
- [x] `spike/analyze.ts`, `spike/analyze.test.ts` -- WAV parse (16/24/32-bit PCM, float32, mono mix), onset detection, ±1 ms verdict, `--fit-period` -- synthetic-click tests for each matrix row
- [x] `spike/RESULTS.md`, `README.md`, config includes -- runbook (30/120/250 × 30 min, Low Power Mode, 240 fps video, silent switch, lock/call, home-screen install non-gating), blank result table, fail → RN decision note -- user fills in
- [x] Commit and push to `main` so deploy publishes the harness -- user asked to test online

**Acceptance Criteria:**
- Given `/?spike=1&bpm=120` on the live site, when the user taps Start, then it clicks at 120 BPM with the dot sweeping and the panel updating.
- Given a synthetic recording with an onset shifted 1.5 ms, when `spike/analyze.ts` runs, then it reports FAIL and exits 1; unshifted, PASS and exit 0.
- Given `npm run check`, `npm test`, `npm run lint`, `npm run build`, then all pass including the boundary test.
- Given `spike/RESULTS.md`, then every gate row reads `PENDING` and the runbook is executable without other documents.

## Implementation Notes

- Implemented directly (no subagent). `?spike=1` hook in `src/ui/spike.ts`; probes in `src/engine/spike-probe.ts` wrap the wake-up only when the hook is on; `mount()` gained an optional `onFrame`. `main.ts` hands `App` a `spike` prop. Analyser onset = 10% of each click's own peak, interpolated. Copy JSON and `SpikePanel` are DOM-bound and untested (manual check). Push to `main` is done after review at the user's request.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|
| SpikePanel reads `status` non-reactively; elapsed resets | false | Svelte 5 props are getters; `elapsed` keeps its last value after Stop |
| Frame median from first 5000 deltas only | low | patch: median now from buckets (fixed) |
| Rejoin gap across stop/start inflates wake-up `late` | medium | patch: recorder `reset()` on stop (fixed, tested) |
| Hidden/locked page inflates `frames.long` | medium | patch: gaps over 1 s counted as `pauses` (fixed, tested) |
| Holdoff of 0.4 period hides doubled click | medium | patch: holdoff capped at 30 ms; extra onset shifts indices and fails the ±1 ms check |
| `import.meta.main` absent on Node 24.0/24.1 | low | patch: fall back to argv[1] comparison |
| CLI accepts bpm outside 30-250 | low | patch: exits 2 |
| WAV 24-bit, extensible, stereo and CLI exit codes untested | medium | patch: tests added |
| Wiring (`main.ts`, `App`, `loop`, panel) untested | low | defer: throwaway harness, covered by the on-phone run |
| t0 anchored on first onset | low | false: AD-13 and the spec define t0 as the first onset; `--fit-period` covers skew |
| Copy JSON before first tick/after stop is stale | low | reject: fix adds complexity; text refreshes every 500 ms |
| Spike code ships in production | low | false: intended per user answer; only active with `?spike=1` |
| Runbook gaps (device model, video procedure, thresholds) | low | reject: user-run procedure, notes column covers it |
| Recorders allocated when spike off | low | false: trivial allocation, no behavior change |

## Verification

**Commands:**
- `npm run check && npm test && npm run lint && npm run build` -- expected: all pass
- `node spike/analyze.ts --help` -- expected: usage text, exit 0

**Manual checks (user, on iPhone after deploy):**
- Follow `spike/RESULTS.md`; record each result and tune constants.
