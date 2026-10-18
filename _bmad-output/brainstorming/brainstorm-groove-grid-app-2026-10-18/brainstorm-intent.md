# Groove Grid — Brainstorm Intent

Source: brainstorming session 2026-10-18 (Creative Partner; techniques: Job to Be Done, Sensory Exploration, Cross-Pollination, One Feature Only). Full log: `.memlog.md`.

## Concept

A web app (or similar) that turns Scott Devine's **Groove Grid** concept into an animated practice tool: one bar drawn as a grid of subdivisions (`1 e & a 2 e & a …`), a dot that sweeps through it in exact tempo and loops back to 1, a metronome click, and markers the musician places on grid positions and tries to hit.

## Goal & North Star

- **Goal:** better timing — playing in the pocket and feeling the beat.
- **North Star:** *the musician becomes the metronome* instead of listening to it (Scott's "internal time").
- **Audience:** any musician practicing timing — especially bassists, also other instruments and drummers; works even without an instrument (clapping, tapping, counting).
- **Problems addressed:** rushing, dragging, missing the beat, losing time gradually.

## v1 Scope (the one feature)

**Grid + moving dot + rock-solid click + markers.** Nothing else.

- **Grid:** circle (clock-like, fits the loop) or straight line (dot jumps back to 1). Quarter notes = big lines, 8ths smaller, 16ths smallest. Time signature and visible subdivision levels configurable.
- **Dot:** very smooth, stable pointer traversing the grid exactly in tempo.
- **Click:** classic metronome sound, beat 1 pitched higher. Configurable pattern — every beat, every 16th, only 2 & 4, muted. *This is the internal-time trainer and part of v1.*
- **Markers:** easy to set, move and remove; multiple allowed; snap to subdivisions. Visual indicator when the dot crosses a marker; optional marker sound, distinct from the click, from presets.
- **Tempo:** BPM always prominently visible. Control method (slider, +/−, tap tempo for an initial value) deferred to UX assessment.
- **Self-assessment:** the musician judges themselves — visually, or when the click returns after silence.

## Quality Bar (non-negotiable)

- **Trust is the product.** The click must be stable and smooth "like a good old Casio" — never flaky. Technical implication: the audio clock is the master; visuals follow it, never the reverse.
- Minimal, obvious UI: only necessary controls, every button self-explanatory, good proportions and contrast.
- No gimmicks: no unnecessary lights, sounds or features. Focus/flow like a meditation app.
- High performance and smooth animation.

## Deferred (later, in rough order)

1. Tap mode — tap screen/keyboard on markers; timestamped input shows early/late.
2. Recording + playback against the click; waveform drawn around the grid so hits are visible against lines.
3. Click ladder / gap click (click drops out for N bars, then returns).
4. Settings in URL (restores last state; shareable patterns, e.g. teacher → student).
5. Tempo ramp (gradual speed-up/slow-down); call-and-response; per-marker sounds; backing tracks.
6. Progress tracking (BPM personal bests), daily groove/streaks, ghosts of best takes.
7. Auto-correction (app listens and scores timing).

Explicitly judged **too big for now:** live ghost, teacher features, tempo ramp, gamification. Haptic/smartwatch beat output: risky due to latency/jitter.

## Open Questions

- Circle vs. line as default (or both)?
- Tempo control interaction — needs UX assessment.
- Platform: web first? (implied, not decided)
- Grid architecture should be a reusable render layer so deferred features are additional layers, not rewrites.
