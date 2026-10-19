---
type: review
lens: reconcile-spec
target: ../ARCHITECTURE-SPINE.md
against:
  - ../../../../specs/spec-groove-grid/SPEC.md
  - ../../../../specs/spec-groove-grid/roadmap.md
  - ../.memlog.md
  - ../../../ux-designs/ux-groove-grid-2026-10-18/EXPERIENCE.md (spot-checked where the spine cites it)
date: 2026-10-19
---

# Reconcile review: Architecture Spine vs SPEC / roadmap / memlog

## Verdict

**Mostly aligned; needs a targeted revision before it binds builds.** Every constraint and capability has a home, and no non-goal is built into the spine. One real contradiction remains, and it puts CAP-2 at risk. AD-1 bans every time source except `AudioContext.currentTime` for the dot. But `currentTime` (a) advances in coarse render-quantum or callback steps on iOS/Safari, which makes the dot stutter, and (b) runs ahead of what is heard by the output latency. So the dot as specified cannot meet "within one display frame of each line when its click sounds, with no visible stutter". The spike (AD-13) also never measures the dot. Several other SPEC criteria and memlog decisions are only implied, or are missing.

Severity: **H** = can make a success criterion fail as written. **M** = gap an implementer will likely fill differently in different stories. **L** = clarification.

## 1. Capability success criteria

| # | Sev | Source | Finding | Suggested fix |
|---|-----|--------|---------|---------------|
| 1.1 | H | CAP-2 "dot within one display frame … no visible stutter"; AD-1 | AD-1 forbids rAF timestamps and `performance.now()` from deciding where the dot is, and makes `ClockReader.now()` = `currentTime`. On WebKit, `currentTime` updates per audio callback (often 256–1024 frames ≈ 5–21 ms). A 60 Hz frame is 16.7 ms and a 120 Hz frame is 8.3 ms, so the dot gets quantized and jumps. The spine rule as written causes the stutter it is meant to prevent. | Amend AD-1. The render clock is `AudioContext.getOutputTimestamp()` (`contextTime` + `performanceTime` pair), extrapolated to the rAF timestamp. A fallback uses `currentTime` smoothed against `performance.now()`. The result is *expressed* in audio seconds and anchored to the audio clock. Only `src/engine/` implements this, behind `ClockReader.now()`. Scheduling (sound timing) still never uses `performance.now()`. |
| 1.2 | H | CAP-2 "when its click sounds"; Deferred "Audio output latency compensation — SPEC non-goal" | The click is *heard* about `baseLatency + outputLatency` after its context time. On iPhone speakers that is often 10–40 ms, i.e. 1–3 frames. A dot drawn at raw `currentTime` leads the sound and fails CAP-2. The spine's Deferred line over-applies the non-goal. The SPEC non-goal is *calibration/compensation for external devices (e.g. Bluetooth)*. It does not forbid aligning the visual with the platform's reported latency. | Make `ClockReader.now()` return the *audible* context time (`getOutputTimestamp().contextTime`, or `currentTime − outputLatency` where it is reported). Narrow the Deferred line to "user calibration / manual latency offset (SPEC non-goal)". Leave the audio schedule as it is. |
| 1.3 | H | CAP-2 / "Dropped frames are a defect"; AD-13 | The spike's pass criteria cover audio only. Nothing verifies dot-to-click alignment or dropped frames before UI work begins. The platform kill decision can therefore pass on a platform where CAP-2 fails. | Add to AD-13 Pass: a slow-motion (240 fps) video at 60/120/250 BPM shows the dot on the line within one frame of the audible click, and no long frames in a 30-minute run (rAF delta log). Add a minimal dot-on-circle render to the spike scope. |
| 1.4 | M | CAP-3 "each click lands within 1 ms of its ideal time"; AD-13 | The spike measures *click-to-click jitter* ≤ 1 ms. The SPEC criterion is *absolute deviation from the ideal time*. Small per-interval jitter can still allow a slow walk, and "no cumulative drift" has no number. | State one measurable criterion: every detected onset is within ±1 ms of `t0 + n × period`, fitted on the first click, across the whole 30 minutes. That covers jitter and drift in one test. |
| 1.5 | M | CAP-3 range 30–250 BPM; AD-13 vs Tests | The spike runs 60/120/250 and the core simulation runs 30/120/250. 30 BPM (the slowest edge, longest gaps, most lookahead wake-ups per click) is never tested on a device. | Spike at 30, 120 and 250 (60 optional). Use the same set in both places. |
| 1.6 | M | CAP-3 within 1 ms; AD-11 | Sample assets are not constrained. A WAV with leading silence, or a soft attack, shifts every click (and its alignment with the dot) by a constant offset that no scheduler can fix. | AD-11: each sample's transient starts at frame 0 (≤ 0.5 ms pre-roll), peak-normalized, with accent and normal pairs onset-aligned. Add a test that checks the first frame above threshold. |
| 1.7 | M | CAP-4 "between-beats click sounds only within the enabled beats"; UX "mute affects click only; marker sounds keep playing" (memlog constraint) | AD-7 puts markers on a separate bus but never says mute leaves the marker bus alone. The between-beats rule (only inside enabled beats) appears nowhere, so the core event plan has no stated rule. | AD-7: "Mute zeroes the click bus only; the marker bus is never muted (marker sound `null` = off)." AD-2/core: "`eventsBetween` emits between-beat clicks only for ticks whose beat is enabled; between-beats division is independent of the visible grid." |
| 1.8 | L | CAP-4 "unmute resumes in phase" | Covered well by AD-7 (gain 0, clicks stay scheduled). One edge: a gain change applied at `currentTime` can cut a click that is already sounding. | Apply mute/unmute with `setTargetAtTime` or a short ramp, outside the transient of a click. Optional. |
| 1.9 | L | CAP-8 "starts … from beat 1" | Not explicit. AD-6 says nothing about the first segment. | AD-6/core: `start()` builds a fresh timeline with tick 0 (beat 1) at `currentTime + startOffset` (constant). Stop cancels all scheduled nodes. |
| 1.10 | L | CAP-7 "every crossing triggers the indicator on time" | Covered by AD-9 (time-derived). One edge: a marker placed or removed inside the committed window shows or hides its crossing visually while its sound was already committed (or not). | Note: the render layer uses the same committed-marker view as the scheduler for `t < committedUntil`. Or accept this (≤ 100 ms) and say so. |
| 1.11 | L | CAP-1 "freely configure time signature"; CAP-9 restores "time signature"; UX beat unit /4 or /8 | The spine models beats per bar (1–16) only. The denominator (beat unit) is not named in `Settings`, the constant list or persistence. Per UX, BPM counts the beat unit. | Add `beatUnit: 4 \| 8` to the `Settings` description (AD-4/AD-3). Note that 960 ticks = one *beat unit* and that `beatUnit` affects the label only, never timing. |
| 1.12 | L | CAP-5 BPM visible in every state | UI-only. AD-5 `pending` covers the grey numeral. No gap. | — |
| 1.13 | L | CAP-6 "always lands on a subdivision line" | Covered: AD-3 ticks, AD-4 validation, bulk removal + Undo. The meter-shrink case is correctly listed as an open question. | — |
| 1.14 | L | CAP-9 | Covered by AD-10. The UX one-time silent-switch hint ("once ever") needs a flag that is not a user setting. AD-10 allows only one key. | Allow `groove-grid:hints` (or a `meta` field) in AD-10, so non-settings flags don't end up in `Settings`. |
| 1.15 | L | Engine status vs "instant start, no loading" (UX) | AD-11 decodes the sample bank "before the first Start can play", but `status` has no state for not-ready, and nothing says what Start does when tapped during decode. | Either add a `'loading'` status, or rule that decode completes before the UI enables Start (and say which). |

## 2. Constraints

| # | Sev | Constraint | Status in spine | Suggested fix |
|---|-----|-----------|-----------------|---------------|
| 2.1 | — | Audio clock is master; derived from start time, never accumulated | AD-1 covers it; the closed-form rule is good. Wording is ambiguous: `tick − segment.startTick` must use an **absolute** (monotonic, not bar-relative) tick. | Say "absolute tick since timeline start" in AD-1. |
| 2.2 | H | (see 1.1) Visual derivation | Contradiction: the ban on all non-audio time sources breaks smoothness. | Fix as in 1.1/1.2. |
| 2.3 | M | Engine isolated from UI so an RN port stays cheap | UI isolation is satisfied (port types only). But the lookahead **scheduling algorithm** (committed horizon, change boundary, dedupe) lives in `src/engine/` next to Web Audio and the Web Worker. AD-13 promises an RN port that "reuses `src/core/` unchanged", which would force a rewrite of the logic that was hardest to get right. | Split the engine: a platform-neutral `scheduler` (pure function or small class over an `AudioOut` port: `now()`, `play(sampleId, time, bus, gain)`) and a thin Web Audio adapter. Put the scheduler in `core/` or `engine/` with no Web Audio imports. RN then swaps only the adapter and the wake-up source. |
| 2.4 | — | Layer stack | AD-9 covers it with a fixed order, and roadmap items become layers. | — |
| 2.5 | L | Subdivision depth not hard-coded to 16ths | 960 PPQ supports 2,3,4,5,6,8,10,12,16,32,64 but not 7 (septuplets), 9, 14 or 128. This is acceptable for the roadmap (none needs those), but "only divisions that divide 960" is now a hidden cap. | State the cap explicitly in AD-3 ("supports up to 64ths and quintuplets/sextuplets; septuplets would need a PPQ change and a persistence migration"). Or pick 6720 (= 960 × 7) now at no cost. |
| 2.6 | M | Peripheral vision legibility; phone first | Not mentioned. Architectural hooks: canvas sized with `devicePixelRatio`, a stroke-weight hierarchy sourced from DESIGN.md tokens (not ad hoc in each layer), resize/orientation redraw of the grid cache. | Add one render convention: "layers read sizes/colors from DESIGN.md tokens via `Frame.theme`; canvas backing store = CSS size × DPR; grid cache invalidates on DPR/size change". |
| 2.7 | — | Meters equal beats, accent on beat 1 only | Implied by AD-7 gain order. | Optional: state that there is no per-beat accent field in `Settings` (non-goal guard). |
| 2.8 | L | Animation smooth; dropped frames are a defect | AD-9's single loop and cached grid are good. No frame budget and no detection. | Add a dev-only long-frame counter (no telemetry) and a per-frame budget note (for example, no allocation in layers). |
| 2.9 | — | Minimal UI / no gimmicks | The extra layers (comet tail, anticipation glow, beat-1 pulse, marker preview) are logged v1 extras in EXPERIENCE.md and respect reduced motion. Not a violation. | — |
| 2.10 | — | No mic / account / instrument input | Satisfied: no network after load, no analytics, no mic API. | Optional guard: "no `getUserMedia`" in conventions. |
| 2.11 | — | Mobile-first PWA | Satisfied (AD-12, SW, Safari-tab-first spike). | — |

## 3. Non-goals: accidental-violation check

- **Latency compensation:** the spine is *too strict* here, not in violation. See 1.2. Narrow the wording so the visual audible-time alignment is allowed.
- **Tap mode / scoring:** UX includes *tap tempo* for BPM entry. AD-1 could be read as forbidding the `performance.now()` deltas that tap tempo needs. Clarify that tap tempo only produces a BPM value, never a sound time, so it is allowed. This does not reintroduce tap-mode scoring.
- **URL settings / sharing:** no violation. AD-10 is device-local.
- **Haptics, per-marker sounds, swing, line layout, compound meters, progress/ghosts:** none are present. The Deferred section routes them correctly to layers + migrations.
- **Background playback:** correctly excluded (AD-8 stops on hidden).

## 4. Spine vs memlog: lost or drifted decisions

| # | Sev | Memlog entry | Spine | Fix |
|---|-----|-------------|-------|-----|
| 4.1 | M | Spike scope includes **silent switch** (and home-screen install, lock/unlock, call) | AD-13 drops the silent-switch check. AD-8 sets `audioSession` but nothing tests it. | Add "silent switch on → clicks audible (iOS 17+)" to the spike checklist (non-gating, like install, or gating: decide). |
| 4.2 | M | **No metronome/audio library**; plain **SPA, no SvelteKit, no UI kit**; TanStack Start rejected | Only "Web Audio API (browser, no library)" in Stack. No SvelteKit / UI kit / router exclusion. | Add a "Not used" row to Stack: Tone.js and other audio libs, SvelteKit, router, UI component kits. |
| 4.3 | M | Mute affects click only; marker sounds keep playing | Implied only (see 1.7). | As 1.7. |
| 4.4 | L | Primary target is the **plain Safari tab**; call interruption stopping playback is acceptable | AD-13 tests in a Safari tab ✓. "Acceptable to stop" is reflected in AD-8 ✓. The rationale is lost. | Optional single line in AD-13. |
| 4.5 | L | iOS 26 Home Screen audio-loss reports (unverified) | Not carried. | Add to the AD-13 notes as a known risk for the non-gating install check. |
| 4.6 | L | Round 4 H: simulated 30-min drift test | BPM set mismatch with the spike (see 1.5). | Align. |
| 4.7 | — | Hosting supersession (`/groove-grid/` → org root `/`) | Correctly applied in AD-12 ✓. | — |
| 4.8 | — | TS 7.0.2 vs 6.0.3 pin | Correctly resolved to 6.0.3 ✓. | — |
| 4.9 | — | Change boundary, closed-form segment time, WAV mono, sample bank rebuild, namespaced keys, 960 PPQ, single store, full snapshots, single rAF, single AudioContext, versioned key, browser floor | All present ✓. | — |

## 5. Quiet requirements

- **Tone / voice:** AD conventions route user text to EXPERIENCE.md Voice and Tone, with no error dialogs ✓.
- **"Instant start, no loading" (UX "Casio")** conflicts in a small way with decode-before-Start (see 1.15). Decide what the UI shows.
- **Self-explanatory controls:** UX-owned. No spine conflict.

## Priority order for the revision

1. 1.1 + 1.2 (render clock = audible, smoothed audio time). Rewrite AD-1 and narrow the Deferred latency line.
2. 1.3 + 1.4 + 1.5 + 4.1 (spike measures dot alignment, absolute ±1 ms, 30 BPM, silent switch).
3. 2.3 (platform-neutral scheduler so the RN fallback really reuses the hard part).
4. 1.7 / 4.3 (mute = click bus only; between-beats inside enabled beats).
5. 1.6 (sample onset at frame 0).
6. 4.2, 1.11, 2.5, 2.6, then the rest.
