---
id: SPEC-groove-grid
companions:
  - roadmap.md
  - ../../planning-artifacts/ux-designs/ux-groove-grid-2026-10-18/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-groove-grid-2026-10-18/EXPERIENCE.md
  - ../../planning-artifacts/architecture/architecture-groove-grid-2026-10-19/ARCHITECTURE-SPINE.md
sources:
  - ../../brainstorming/brainstorm-groove-grid-app-2026-10-18/brainstorm-intent.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Groove Grid v1

## Why

Vision plus pain. Musicians practicing timing (especially bassists, but also other instrumentalists, drummers, and people with no instrument who clap, tap or count) rush, drag, miss the beat, or slowly lose time. Groove Grid turns Scott Devine's Groove Grid concept into an animated practice tool: one bar drawn as a grid of subdivisions (`1 e & a 2 e & a …`) with a dot sweeping through it in exact tempo. The goal is playing in the pocket. The North Star is that the musician *becomes the metronome* (Scott's "internal time") instead of leaning on it. The musician judges their own timing. Trust in the clock is the product.

## Capabilities

- **CAP-1**
  - **intent:** Musician sees one bar as a circular grid whose line weight shows the subdivision hierarchy: quarters biggest, 8ths smaller, 16ths smallest, with triplets as an alternative division. They can freely configure the time signature (3/4, 4/4, any meter they like, not a fixed preset list) and which subdivision levels are visible.
  - **success:** Changing the time signature or the visible levels redraws the grid with the correct number and weight of lines, including the triplet division.
- **CAP-2**
  - **intent:** A smooth, stable dot traverses the bar exactly in tempo and loops back to 1 (continuously around the circle).
  - **success:** Across 30–250 BPM, the dot is within one display frame of each grid line when its click sounds, with no visible stutter.
- **CAP-3**
  - **intent:** A classic metronome click plays in sync with the dot, with beat 1 pitched higher. The musician chooses the click sound from a small preset set (Beep, Woodblock, Stick, Hi-hat), each with a beat-1 variant.
  - **success:** Across 30–250 BPM, each click lands within 1 ms of its ideal time, with zero cumulative drift over a 30-minute run. Beat 1 is distinguishable by pitch alone, for every click sound.
- **CAP-4**
  - **intent:** Musician chooses where the click sounds to train internal time with less support: any combination of beats in the bar (e.g. every beat, 2 & 4, 1 & 3, beat 1 only, only 4), plus an optional between-beats click (none, 8ths, 16ths or triplets) that sounds only within the enabled beats. A separate mute silences the click.
  - **success:** The click sounds on exactly the enabled positions. At least one beat stays enabled; silence is mute. When muted, the dot keeps sweeping silently. Unmuting resumes the click in phase.
- **CAP-5**
  - **intent:** Musician sets the tempo in BPM and always sees the current BPM prominently.
  - **success:** The BPM stays visible in every state, and changing it changes the dot and click rate to match.
- **CAP-6**
  - **intent:** Musician places, moves and removes markers on grid positions. Multiple markers are allowed, and they always snap to a visible subdivision, 16th or triplet (no off-grid placement).
  - **success:** A marker can be placed, moved and removed with one obvious gesture each, and it always lands on a subdivision line. All markers can be cleared at once. Bulk removals (clear all, or a grid change that leaves markers off-grid) can be undone.
- **CAP-7**
  - **intent:** When the dot crosses a marker, the musician gets a visual indicator and, optionally, a marker sound distinct from the click, chosen from presets.
  - **success:** Every crossing triggers the indicator on time. With the marker sound enabled, it is audibly different from both click pitches.
- **CAP-8**
  - **intent:** Musician starts and stops playback with a single obvious action.
  - **success:** One action starts the dot and click from beat 1, and one action stops both.
- **CAP-9**
  - **intent:** The app opens with the musician's last settings: tempo, time signature, visible subdivisions, click sound, enabled click beats, between-beats click, mute state, markers and marker sound.
  - **success:** After closing and reopening the app on the same device, every one of those settings is restored with no setup step.

## Constraints

- The audio clock is the master. Visuals derive their position from it and never drive timing.
- The click must be Casio-level stable: no audible jitter, drift, dropouts or glitches. Any flakiness breaks the product. Each click time is derived from the start time, never by accumulating intervals.
- The phone is the primary device. Layout, touch targets and audio must work there first.
- Platform: a mobile-first installable web app (PWA) using browser audio. The primary target is a plain Safari tab on iPhone; home-screen install is secondary. The audio engine stays isolated from the UI, so a React Native port remains cheap if phone testing exposes audio limits.
- Implementation follows architecture decisions AD-1–AD-13 in `ARCHITECTURE-SPINE.md` (timebase, tick model, settings shape, engine port, scheduling, rendering, persistence, sounds, hosting, and the iPhone timing spike that gates the platform). Cite them by those numbers; the spine also holds the stack.
- Meters are equal beats with the accent on beat 1 only. There is no compound grouping in v1.
- Subdivision depth is not hard-coded to 16ths. The grid model must allow finer divisions later; v1 exposes quarters, 8ths, 16ths and triplets.
- Animation is smooth and high-performance. Dropped frames are a defect.
- The UI is minimal: only necessary controls, each self-explanatory, with good proportions and contrast.
- No gimmicks: no unnecessary lights, sounds or features. The practice screen stays pure, and any future progress or gamification lives elsewhere.
- The grid, dot and markers must be legible in peripheral vision, because the musician's eyes are on their instrument or bandmates.
- Grid rendering is a stack of layers, so deferred features (tap input, recording waveform, ghosts) are added as layers, not rewrites. See `roadmap.md`.
- v1 needs no instrument input, microphone or account, so it works for clapping, tapping or counting.

## Non-goals

- Any automatic timing measurement or scoring: tap mode, recording/playback, auto-correction. v1 is self-assessment only.
- Automated click variation: click ladder, gap click, tempo ramp, call-and-response.
- Settings in URL and shareable patterns.
- Per-marker sounds and backing tracks.
- Progress tracking, personal bests, streaks, daily groove, ghosts (including live ghost), and any gamification.
- Teacher features.
- Haptic or smartwatch beat output (latency and jitter risk).
- User-facing audio latency calibration or manual compensation (e.g. Bluetooth headphones). The dot aligning automatically to the browser-reported output time is in scope (architecture AD-1).
- Swing ratio and off-grid markers.
- Line layout.
- Compound-meter grouping (6/8 felt as 2×3) and custom accents.
- Sharing settings via URL (persistence is device-local only).
- Ordered deferral list and rationale: `roadmap.md`.

## Success signal

- A musician opens the app, sets a BPM, places markers on a 16th-note grid, and practices with the click, then with it muted. Over a long session the click never audibly wavers, and the dot visibly lands on each line as its click sounds. Muting and unmuting shows the musician whether they held time.

## Assumptions

- CAP-8 (start/stop) was added: it is implied but never stated in the input.
- The "beat 1 only" click pattern comes from the session synthesis. The intent doc lists only every beat, every 16th, 2 & 4, and muted.
- In v1, self-assessment "when the click returns" means the musician mutes and unmutes manually. The automatic gap click is deferred.
- The peripheral-vision constraint was adopted from a coach insight the user did not reject.
- "Any meter" (CAP-1) means 1–16 beats per bar over a /4 or /8 beat unit (UX assumption, fixed in AD-4).
- The BPM range (30–250) and tolerances (≤1 ms jitter, zero drift, dot within one frame) are drawn from common metronome standards, as the user asked.
