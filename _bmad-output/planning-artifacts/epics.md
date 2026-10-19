---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/specs/spec-groove-grid/SPEC.md
  - _bmad-output/specs/spec-groove-grid/roadmap.md
  - _bmad-output/specs/spec-groove-grid/ux-candidates.md
  - _bmad-output/planning-artifacts/architecture/architecture-groove-grid-2026-10-19/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-groove-grid-2026-10-18/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-groove-grid-2026-10-18/EXPERIENCE.md
---

# groove-grid - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for groove-grid, decomposing the requirements from the SPEC (used in place of a PRD), UX Design (DESIGN.md + EXPERIENCE.md) and Architecture (ARCHITECTURE-SPINE.md) into implementable stories.

Note: there is no PRD. `SPEC.md` (CAP-1..CAP-9, Constraints, Non-goals) is the canonical requirements source. SPEC capabilities are decomposed below into numbered FRs; each FR cites its CAP.

## Requirements Inventory

### Functional Requirements

FR1: Show one bar as a circular grid, beat 1 at 12 o'clock, clockwise; spoke width/length/tone encode the hierarchy quarters > 8ths > 16ths, with triplets as an alternative division (CAP-1).
FR2: Allow any time signature: 1–16 beats per bar over a /4 or /8 beat unit, not a fixed preset list; beats are equal with the accent on beat 1 only; BPM counts the beat unit (CAP-1).
FR3: Let the musician choose the finest visible subdivision level (`Beats`, `8ths`, `16ths`, `Triplets`); changing it or the meter redraws the correct number and weight of lines (CAP-1).
FR4: Meter sheet offers one-tap common meters (2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 12/8) plus a beats-per-bar stepper and `Beat unit` 4/8 control (CAP-1).
FR5: A smooth dot traverses the bar exactly in tempo and loops continuously; at rest (stopped) it sits on beat 1 (CAP-2).
FR6: A metronome click plays in sync with the dot; beat 1 is higher in pitch (CAP-3).
FR7: Musician selects the click sound from Beep, Woodblock, Stick, Hi-hat, each with a beat-1 variant; selecting while stopped previews both variants 300 ms apart (CAP-3).
FR8: Musician chooses which beats click via one toggle per beat (any combination) plus an `All` action; at least one beat must stay enabled (CAP-4).
FR9: Optional between-beats click (None, 8ths, 16ths, Triplets) sounds only within enabled beats, quieter than beat clicks (CAP-4).
FR10: Mute silences the click only, instantly; dot, glow, crossing, pulse and marker sounds continue; unmute resumes the click in phase (CAP-4).
FR11: Tempo is 30–250 BPM (integers), always visibly displayed in every state; changing it changes dot and click rate (CAP-5).
FR12: Tempo inputs: `−`/`+` steppers (tap ±1; hold auto-repeat with acceleration), vertical drag on the BPM numeral, `Tap` tempo (average of last 4 intervals, resets after 2 s), and keyboard (CAP-5).
FR13: While playing, tempo and click-pattern changes apply on the next beat and meter changes at the next downbeat; the BPM numeral shows a pending (grey) state until applied; rapid changes collapse to the latest; the dot never jumps (CAP-5, CAP-1).
FR14: Musician places (tap), moves (press + drag) and removes (tap) markers on the circle; markers snap to a visible subdivision, multiple allowed, one per position, editable while playing (CAP-6).
FR15: `Clear all markers` removes all markers; bulk removals (clear all, grid-family switch, coarser grid, meter shrink) show an `undo-notice` with Undo for 6 s that restores the exact previous markers and grid (CAP-6).
FR16: Grid/meter changes keep markers that still sit on a visible line and remove the rest (binary↔triplet keeps beat positions only); while a meter change is pending, markers cannot be placed in beats being removed (CAP-6).
FR17: When the dot crosses a marker, show an on-time visual indicator (anticipation glow one 16th before, crossing ring at the hit) derived from audio time (CAP-7).
FR18: Optional marker sound (Off, Clap, Cowbell, Conga) distinct from all click sounds, played at the crossing time and unaffected by mute (CAP-7).
FR19: A single Start/Stop action starts dot and click from beat 1 and stops both; first Start unlocks audio (CAP-8).
FR20: On open, restore last tempo, meter, grid, click sound, click beats, between beats, mute, markers and marker sound from device storage with no setup step; defaults when none (CAP-9).
FR21: Beat-1 pulse (page background flash) on every beat 1 while playing, including while muted (EXPERIENCE extras).
FR22: Comet tail trails the dot while playing (EXPERIENCE extras).
FR23: Laptop keyboard map: Space start/stop, ←/→ tempo ±1, Shift+←/→ ±5, T tap, M mute, Ctrl/Cmd+Z undo, grid marker cursor with Enter toggle, Esc behaviors.
FR24: Audio lifecycle: stop on hidden page, interruption or failed resume and show `Sound paused. Tap Start to play again.`; never auto-resume; request playback audio session; one-time silent-switch hint where unsupported; screen wake lock while playing.
FR25: Installable PWA, fully functional offline after first load; updates apply on next launch, never mid-session, with no prompt.
FR26: Notice line shows one message at a time with priority undo > audio notice > silent-switch hint > first-run marker hint (`Tap the circle to place a marker.`).
FR27: Responsive behavior: phone portrait primary; phone landscape in a tab shows `rotate-overlay`; viewport ≥ 768px uses popovers instead of sheets, centered column max 480px.

### NonFunctional Requirements

NFR1: Click timing: each click within 1 ms of its ideal time across 30–250 BPM; zero cumulative drift over 30 min; no audible jitter, dropouts or glitches (CAP-3).
NFR2: Dot within one display frame of each grid line when its click sounds, no visible stutter, across 30–250 BPM; dropped frames are defects (CAP-2).
NFR3: The audio clock is the master; visuals derive from it and never drive timing; event times derive from start time, never accumulated intervals (AD-1).
NFR4: Phone is the primary device; primary target is a plain Safari tab on iPhone (iOS/Safari 17+), plus current Chrome and Firefox; layout, touch targets and audio work there first.
NFR5: Audio engine isolated from UI; `src/core/` pure TypeScript reusable for a React Native port (AD-2, AD-13).
NFR6: No instrument input, microphone, account, analytics or network calls after load; state is device-local only.
NFR7: Minimal UI, no gimmicks (no extra lights/sounds/features); grid, dot and markers legible in peripheral vision.
NFR8: Grid rendering is a stack of layers so roadmap features are added as layers (AD-9); grid model allows finer divisions later (960 ticks per beat).
NFR9: Accessibility: reduced-motion mode, 48px touch targets (beat toggles 44px), screen-reader roles/names per EXPERIENCE, visible focus ring, color independence, flash safety (pulse luminance ≥ 0.80), 200% zoom survives.
NFR10: Instant, Casio-like start: no loading, setup or splash; sounds pre-decoded at boot; app shell and sounds precached.
NFR11: Quality gates: TypeScript strict, `svelte-check` and Vitest in CI blocking deploy; simulated 30-min run tests at 30/120/250 BPM asserting closed-form event times and no duplicate/missing events.
NFR12: Rock-solid persistence: storage failure never blocks launch; unvalidated saved data never enters the app (normalize).

### Additional Requirements

- **No starter template** is named. Epic 1 Story 1 scaffolds a Vite 8 + Svelte 5 + TypeScript 6 project (no SvelteKit, no UI kit, no Tone.js) using the Structural Seed directory layout and picks lint/format tooling.
- **AD-13 iPhone timing spike is the first real story and gates the platform:** ship `core`, `engine` and the dot layer first; test 30 min each at 30/120/250 BPM plus a Low Power Mode run; pass/fail criteria per AD-13; failure means a React Native port reusing `src/core/`. Spike tunes `LOOKAHEAD`, `WAKEUP_INTERVAL`, `START_LEAD`. Includes `spike/` output-recording analysis script.
- **AD-1** audio clock timebase; `ClockReader.now()` returns audible time (output timestamp + latency fallback), monotonic, only in `src/engine/clock.ts`.
- **AD-2** immutable `Timeline` of metric segments keyed by absolute tick; `Live` fields separate; core API `startTimeline`, `withSettings`, `eventsBetween`, `positionAt`, `plan`.
- **AD-3** 960 ticks per beat; `snap`, `tickLabel` in core; only `src/render/` converts ticks to geometry.
- **AD-4** fixed `Settings` shape; `normalize` is the only validator; `src/ui/settings.svelte.ts` is the sole writer via named actions; store-owned non-persisted `undo` slot (6 s).
- **AD-5** `EnginePort` (`start`, `stop`, `apply`, `preview`; `status`, `pausedReason`, `pending`, `audioSessionSupported`); only `main.ts` calls `apply`.
- **AD-6** changes apply at first beat boundary after `committedUntil`; meter/beat-unit changes (with tempo) wait for downbeat; at most one future segment.
- **AD-7** Web Worker wake-up (~25 ms) + lookahead (~100 ms) pure planner; `AudioOut` port; click/marker/preview buses; late events skipped and counted; `downbeat` events for visuals.
- **AD-8** single audio-context owner created at boot (suspended), `audioSession.type='playback'`, bank decoded at boot, `resume()` inside gestures, lifecycle/recreate on `paused-by-system`, wake-lock module in `ui`.
- **AD-9** single rAF loop in `src/render/`; layer stack grid → anticipation-glow → markers → marker-preview → marker-cursor → comet-tail → dot → crossing; `--pulse` CSS var; render port (`mount`, `hitTest`, `setOverlay`).
- **AD-10** persistence: `groove-grid:settings` and `groove-grid:flags` versioned keys, debounced ≤500 ms writes, flush on `pagehide`, try/catch, pure migrations.
- **AD-11** pre-decoded mono WAV samples with fixed ids (4 click sounds × accent/normal + 3 marker sounds = 11 files), transient at sample 0; one URL builder from `BASE_URL`; precached by service worker. Sample assets must be sourced/created and tested for distinctness.
- **AD-12** static Vite build on GitHub Pages (`groove-grid/groove-grid.github.io`), base path in one place; GitHub Actions: svelte-check + vitest then deploy; `vite-plugin-pwa` `registerType: 'prompt'`, worker activated only when not playing; CSP meta tag; rollback = revert.
- Constants (PPQ, ranges, LOOKAHEAD, WAKEUP_INTERVAL, START_LEAD, effect windows, undo lifetime, debounce) live only in `src/core/constants.ts`.
- Component naming per EXPERIENCE; naming conventions, notice priority derivation in the store, error handling via ports (no error dialogs).
- PWA manifest: name `Groove Grid`, `display: standalone`, `orientation: portrait`, theme/background `surface`; no custom install prompt.

### UX Design Requirements

UX-DR1: Implement the DESIGN color tokens as CSS variables (surface, surface-raised, surface-pressed, surface-pulse, ink, ink-secondary, ink-disabled, grid-quarter/eighth/sixteenth, accent, border-hairline, scrim); light only; accent used only for markers, preview, glow, crossing.
UX-DR2: Implement typography tokens (system-ui stack; bpm-numeral 72/600 tabular, bpm-unit, beat-label, chip-caption, label, body, caption), spacing scale (4–48, gutter 16, target-min 48, control-lg 56, column-max 480, top-bar-height 66) and radii (md 12, lg 20, full).
UX-DR3: Build the portrait single-column layout: top bar, grid (≥260px circle, ~325px on 375×667), 48px reserved notice line, tempo row 88px, transport row 56px, safe-area insets; column centered and capped at 480px on wide viewports.
UX-DR4: `grid-circle` + `grid-spoke-*`: 3px ink ring; spokes quarter 3px/18%/ink, eighth 2px/11%/grid-eighth, sixteenth 1.5px/6%/grid-sixteenth, triplet 1.5px/8%; hidden levels not drawn; beat numbers outside the ring; redraw immediately on grid change (meter change at next downbeat while playing).
UX-DR5: `sweep-dot` 18px ink disc with 2px surface halo; `comet-tail` 30° arc, opacity 0.45→0, width 18→2px, hidden when stopped or reduced motion.
UX-DR6: `marker` 14px accent disc with 2px surface outline, 24px hit radius; `marker-preview` at 0.4 opacity at snap position while pointer is down (and on hover on laptop); marker zone annulus 40px inside to 24px outside the ring.
UX-DR7: Marker gestures: tap empty = place, tap marker = remove, press+drag (>8 px) = move with preview, drop on occupied position leaves one marker; tap outside zone does nothing.
UX-DR8: `anticipation-glow` (0→0.35 opacity, up to 28px radius, one 16th lead) and `crossing-indicator` (ring 14→40px, 3px, 220 ms) derived from audio time; reduced motion: glow off, static 3px ring for 150 ms.
UX-DR9: `beat-one-pulse`: page background to surface-pulse at beat 1, 180 ms ease-out decay; off when stopped or reduced motion; luminance stays ≥ 0.80.
UX-DR10: `bpm-numeral` with tabular figures in a 3-digit fixed-width box; full tempo-row vertical drag area (1 BPM per 6 px, 8 px threshold); pending color ink-secondary while playing; `spinbutton` semantics.
UX-DR11: `tempo-stepper` 56px outlined circles with hold-repeat (400 ms delay, 8/s accelerating to 20/s after 1.5 s), disabled at 30/250; `tap-tempo-button` 56px pill min 88px wide; `start-stop-button` 56px ink pill whose label shows the next action.
UX-DR12: `top-bar` with `chip-caption` + `picker-chip` for METER / GRID / CLICK and the `mute-toggle` (48px, inverted ink fill with crossed-speaker glyph when muted), always visible, bottom-aligned; chip labels per rules (e.g. `Every beat`, `1 & 3`, `Beat 3 only`, `5 of 7 beats`).
UX-DR13: `picker-sheet` (<768px): bottom sheet, scrim 0.32, close on scrim tap/swipe-down/Esc, focus trap and focus return, live-apply, reopens at main view; Grid sheet also closes on selection. `picker-popover` (≥768px): 360px, shadow, anchored under chip, one open at a time.
UX-DR14: Meter sheet: `meter-preset` pills (max 4 per row, highlight matches current meter or none), `Other` section with `number-stepper` (1–16) and `segmented-control` Beat unit 4/8.
UX-DR15: Grid sheet: single-choice finest level (`Beats`, `8ths`, `16ths`, `Triplets`) + divider + `Clear all markers` action row (disabled when no markers; closes sheet; shows undo-notice).
UX-DR16: Click sheet main view: `Click on beats` header with `text-action` `All`, `beat-toggle` row (44px, max 7 per row, balanced wrapping up to 3 rows, last-on toggle aria-disabled with `Use Mute for silence.` caption), `Between beats` segmented control, `Sounds ›` `sheet-nav-row` with live summary; Sounds second level with `sheet-back`, Click sound and Marker sound segmented controls.
UX-DR17: Click-on-beats meter-change carry-over rule (kept toggles; new beats on iff all previous were on) and accent rule (beat-1 variant only when beat 1 is enabled).
UX-DR18: `undo-notice` (`n markers removed.` + 48px `Undo`) and `hint-text` rendered in the reserved notice line under the circle in caption style; derived single `notice` with fixed priority.
UX-DR19: `rotate-overlay` (`Turn your phone upright.`) for landscape viewport under 560px tall; playback unaffected.
UX-DR20: Accessibility semantics per EXPERIENCE table: canvas `img` label from `tickLabel` (`Grid: 4/4, 16ths, 3 markers: 1, and of 2, a of 3`), chip accessible names, radiogroups, toggle `aria-pressed`, polite live regions, `:focus-visible` ring (2px ink, 2px offset).
UX-DR21: Keyboard marker cursor: with the grid focused ←/→ move the cursor between snap positions (replacing tempo keys), Enter toggles a marker, Esc moves focus to Start; global shortcuts suspended inside sheets/popovers.
UX-DR22: Voice and tone: use the exact copy from EXPERIENCE Voice and Tone (`Start`/`Stop`, `Sound paused. Tap Start to play again.`, `No sound? Check the silent switch.`, etc.); no exclamation marks, praise or coaching.
UX-DR23: Defaults on first launch: 80 BPM, 4/4, 16ths, every beat on, between beats None, Beep, marker sound Off, no markers, unmuted.
UX-DR24: Sound design: preview rules (stopped only, both click variants 300 ms apart, previews play while muted), loudness order beat 1 > beats > between-beat clicks, marker sounds audibly distinct from all click sounds.
UX-DR25: PWA/offline presentation: manifest, icons, theme color `surface`, portrait lock when installed, no offline banner, no install nag; private-mode storage failure is silent.

### FR Coverage Map

FR1: Epic 2 - Circular grid, beat 1 at 12 o'clock, spoke hierarchy
FR2: Epic 2 - Any meter, 1–16 beats over /4 or /8
FR3: Epic 2 - Finest visible subdivision level, correct redraw
FR4: Epic 2 - Meter sheet: presets, stepper, beat unit
FR5: Epic 1 - Sweeping dot driven by the audio clock
FR6: Epic 1 - Synced click, higher beat 1
FR7: Epic 3 - Click sound choice and preview
FR8: Epic 3 - Per-beat click toggles and All
FR9: Epic 3 - Between-beats click
FR10: Epic 3 - Mute, unmute in phase
FR11: Epic 1 (fixed tempo for the spike) + Epic 2 (30–250 BPM, always visible)
FR12: Epic 2 - Steppers, drag, tap tempo
FR13: Epic 2 - Next-beat / next-downbeat apply, pending state
FR14: Epic 4 - Place, move, remove markers with snap
FR15: Epic 4 - Clear all, undo for bulk removals
FR16: Epic 4 - Marker keep/remove rules on grid and meter change
FR17: Epic 4 - Anticipation glow and crossing indicator
FR18: Epic 4 - Marker sound
FR19: Epic 1 - Start/Stop from beat 1
FR20: Epic 5 - Restore last settings
FR21: Epic 2 - Beat-1 pulse
FR22: Epic 2 - Comet tail
FR23: Epic 5 - Laptop keyboard map
FR24: Epic 1 - Audio lifecycle, silent switch, wake lock
FR25: Epic 5 - Installable PWA, offline, silent updates
FR26: Epic 4 - Notice priority (Epic 1 ships a minimal audio notice)
FR27: Epic 5 - Responsive: landscape overlay, popovers, column

## Epic List

### Epic 1: A steady click and sweeping dot on the iPhone
A musician opens the live URL on a phone, taps Start and gets a rock-solid click with a dot sweeping the bar in sync; Stop stops both. Includes project scaffold, CI and GitHub Pages deploy, the pure core, the engine, the dot layer, the audio lifecycle and the AD-13 iPhone timing spike with its pass/fail gate.
**FRs covered:** FR5, FR6, FR19, FR24 (FR11 at a fixed tempo)

### Epic 2: Set up the grid and tempo
A musician sets any tempo and meter, chooses visible subdivisions and sees the grid redraw correctly; changes land on the next beat or downbeat without a glitch.
**FRs covered:** FR1, FR2, FR3, FR4, FR11, FR12, FR13, FR21, FR22

### Epic 3: Train internal time with the click
A musician picks the click sound, chooses which beats click, adds a between-beats click, and mutes and unmutes in phase.
**FRs covered:** FR7, FR8, FR9, FR10

### Epic 4: Mark and hit target positions
A musician places, moves and removes markers, gets glow and crossing feedback and an optional marker sound, and can undo bulk removals.
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR26

### Epic 5: Always ready, anywhere
The app opens with the last settings, works offline as an installable PWA, adapts to phone, landscape and laptop, and meets the accessibility floor.
**FRs covered:** FR20, FR23, FR25, FR27

## Epic 1: A steady click and sweeping dot on the iPhone

A musician opens the live URL on a phone, taps Start and gets a rock-solid click with a dot sweeping the bar in sync; Stop stops both. The AD-13 iPhone timing spike gates the platform.

### Story 1.1: Scaffold, CI and live deploy

As a developer,
I want a Vite + Svelte 5 + TypeScript project with the layered directory layout and an automated deploy,
So that every later story ships to a real URL I can open on a phone.

**Acceptance Criteria:**

**Given** a fresh clone
**When** I run `npm ci && npm run build`
**Then** the build succeeds with TypeScript `strict`, and `tsconfig` lists the `vite/client`, `vite-plugin-pwa/client` and worker types explicitly
**And** the `src/core`, `engine`, `render`, `persist`, `ui` layout and `main.ts` match the Structural Seed
**And** an import-boundary check fails if `core` imports anything outside `core`, or if `render`, `engine` or `persist` import `ui`

**Given** a push to `main`
**When** the GitHub Actions workflow runs
**Then** it executes `svelte-check` and `vitest`, then builds and deploys to GitHub Pages only if both pass
**And** the base path is set in one place in `vite.config.ts`
**And** a `<meta>` CSP allows only same-origin scripts, workers and media
**And** the deployed page shows a placeholder at the live URL (a cream `surface` page with the app name)
**And** `src/core/constants.ts` exists with PPQ = 960, BPM range 30–250 and beats range 1–16, and lint and format tooling is chosen and configured
**And** this story enables FR25 and satisfies NFR11 and the AD-12 deploy rules

### Story 1.2: Closed-form timing core

As a musician who needs to trust the clock,
I want the timing model to be proven correct by tests before any sound exists,
So that the click can never drift or double.

**Acceptance Criteria:**

**Given** `core`
**When** I call `startTimeline(settings, startTime)`
**Then** an event's time is `segment.startTime + (tick − segment.startTick) × secondsPerTick`, never a running sum (AD-1, AD-2)

**Given** a timeline
**When** `eventsBetween(timeline, live, t0, t1)` is called over consecutive half-open windows
**Then** there are no duplicate and no missing events across window and segment boundaries
**And** `positionAt` returns a fractional tick in the bar and clamps to 0 before `startTime`
**And** `plan(state, now)` returns events for `[committedUntil, now + LOOKAHEAD)` and sets `committedUntil` to the window end
**And** events carry levels `accent`, `beat`, `sub` plus `downbeat`, and click events exist only for enabled beats
**And** a simulated 30-minute run at 30, 120 and 250 BPM asserts every event time equals its closed-form value
**And** `Settings` and `normalize` exist with the AD-4 shape and defaults, and `normalize` rejects or repairs invalid input
**And** `core` has no DOM, Web Audio, Svelte or storage imports, and no `any`
**And** this story is the foundation for FR5, FR6 and FR13 and satisfies NFR1, NFR3, NFR5 and NFR11

### Story 1.3: Hear a steady click — Start and Stop

As a musician,
I want to tap Start and hear a steady click with a higher beat 1, and tap Stop to end it,
So that I have a metronome I can rely on.

**Acceptance Criteria:**

**Given** the app is open and stopped
**When** I tap `Start`
**Then** the click begins from beat 1 at `currentTime + START_LEAD`, with a higher-pitched beat 1 (CAP-3, CAP-8)
**And** the audio context was created suspended at boot, the sample bank was decoded at boot, and `resume()` is called synchronously inside the tap (AD-8)
**And** a Web Worker wakes the scheduler every `WAKEUP_INTERVAL` and the engine plays events through the `AudioOut` port with `AudioBufferSourceNode.start(time)` (AD-7)
**And** an event whose time is already past is skipped and counted, never played late

**Given** playing
**When** I tap `Stop`
**Then** all scheduled nodes are cancelled and the click stops
**And** the button label shows the next action (`Start` or `Stop`) as a 56px ink pill with `surface-raised` text (UX-DR11)
**And** `EnginePort` exposes `start`, `stop`, `apply`, `status` and `pending`, `main.ts` is the only place that constructs adapters, and `AudioOut` has a fake for tests
**And** the engine is tested against a fake `AudioOut`, fake clock and fake worker
**And** this story implements FR6, FR19 and the fixed-tempo part of FR11, and satisfies NFR1
**And** the tempo is fixed at 80 BPM in 4/4 and click sounds are placeholder accent and normal WAVs with transients at sample 0 (AD-11)

### Story 1.4: The dot sweeps in sync

As a musician,
I want a dot that sweeps the circle exactly with the click,
So that I can see time as well as hear it.

**Acceptance Criteria:**

**Given** playing
**When** the click for beat 1 sounds
**Then** the dot is at 12 o'clock within one display frame (CAP-2)
**And** the dot position comes from `positionAt` at `ClockReader.now()`, which is the audible context time (AD-1), is monotonic, and lives only in `src/engine/clock.ts`
**And** one `requestAnimationFrame` loop in `src/render/` builds one `Frame` per frame and calls layers bottom to top, with no allocations in layers (AD-9)

**Given** stopped
**When** the app opens
**Then** the dot rests on beat 1 with no tail
**And** the grid layer draws the 3px ink ring, beat 1 at 12 o'clock, clockwise, cached offscreen
**And** the dot is an 18px ink disc with a 2px surface halo (UX-DR4, UX-DR5)
**And** this story implements FR5 and satisfies NFR2
**And** `ui` owns the `<canvas>` element, and `render` owns sizing for the screen's pixel density and geometry

### Story 1.5: Audio that behaves on phones

As a musician,
I want sound to stop cleanly when the phone interrupts it and recover on my tap,
So that a call or a locked screen never leaves me with a broken or silent click.

**Acceptance Criteria:**

**Given** playing
**When** the page becomes hidden, the context is `interrupted` or `suspended`, or `resume()` does not settle within about 1 s
**Then** playback stops, status becomes `paused-by-system` with the right `pausedReason`, and nothing resumes automatically (FR24, AD-8)
**And** `Sound paused. Tap Start to play again.` shows in the reserved 48px notice line for `interrupted` and `resume-failed`, and not for `hidden`

**Given** `paused-by-system`
**When** I tap `Start`
**Then** the context is closed and recreated, the sample bank and timeline are rebuilt, and playback starts from beat 1
**And** `navigator.audioSession.type = 'playback'` is set before the context is created where it exists
**And** where `audioSession` is unsupported on iOS, `No sound? Check the silent switch.` shows once, on the first Start, and never again (the flag is kept in memory until persistence arrives in Epic 5)
**And** a screen wake lock is requested on Start and released whenever playback stops, with nothing visible if it is unsupported or denied
**And** the engine never throws into the UI

### Story 1.6: iPhone timing spike and platform gate

As the product owner,
I want the AD-13 pass/fail run recorded on a real iPhone,
So that we only build the full app on a platform that can hold time.

**Acceptance Criteria:**

**Given** a spike harness that sets 30, 120 and 250 BPM (a spike-only dev hook such as `?bpm=`, not a user-facing feature)
**When** each tempo runs for 30 minutes in an iPhone Safari tab
**Then** there are no audible glitches, dropouts or doubled clicks and the skipped-event count is 0
**And** one Low Power Mode run logs actual wake-up intervals
**And** the `spike/` script analyses a recording of the phone's output and shows every onset within ±1 ms of `t0 + n × period` with no cumulative drift
**And** 240 fps video shows the dot on the line at each click, within one display frame, with no visible stutter
**And** clicks sound with the silent switch on where `audioSession` exists
**And** after lock/unlock or a phone call, tapping Start plays correctly
**And** `LOOKAHEAD`, `WAKEUP_INTERVAL` and `START_LEAD` are tuned in `src/core/constants.ts` from the results
**And** this story verifies NFR1, NFR2 and NFR4 against FR5 and FR6
**And** the pass or fail result is recorded in the repo, and a fail triggers the React Native port decision (AD-13)
**And** home-screen install is checked and recorded but does not gate

## Epic 2: Set up the grid and tempo

A musician sets any tempo and meter, chooses the visible subdivisions and sees the grid redraw correctly; changes land on the next beat or downbeat without a glitch.

### Story 2.1: Design tokens and the practice-screen layout

As a musician,
I want the practice screen laid out with the cream page, black circle and notice line,
So that everything is readable from a music stand.

**Acceptance Criteria:**

**Given** the app on a 375×667 phone
**When** it loads
**Then** the DESIGN color, typography, spacing and radius tokens exist as CSS variables, light only (UX-DR1, UX-DR2)
**And** the portrait column follows UX-DR3: top bar (66px plus 8px), circle (at least 260px, about 325px here), a reserved 48px notice line, the 88px tempo row and the 56px transport row, with safe-area insets respected
**And** on wide viewports the column is centered at 480px max, with the page background edge to edge
**And** the Epic 1 Start/Stop, notice line and canvas move into this layout without changing behavior
**And** this story supports FR11 and FR27 and satisfies NFR7 and NFR10

### Story 2.2: Settings store and tempo steppers

As a musician,
I want to change tempo with `−` and `+` and always see the BPM,
So that I can set the speed I practice at.

**Acceptance Criteria:**

**Given** `src/ui/settings.svelte.ts` is the only settings writer
**When** I tap `+` or `−`
**Then** the `setTempo` action calls core `normalize` and tempo changes by ±1 within 30–250
**And** `main.ts` subscribes to the store and calls `engine.apply(snapshot)` (AD-4, AD-5)
**And** the numeral shows the tempo in 72px tabular figures in a fixed 3-digit box with a `BPM` unit, visible in every state (UX-DR10, FR11)
**And** holding a stepper repeats after 400 ms at 8/s, accelerating to 20/s once held for 1.5 s, and `−` disables at 30 and `+` at 250, as 56px outlined circles (UX-DR11)
**And** the spike `?bpm=` hook is removed
**And** the default tempo is 80 BPM (UX-DR23)

### Story 2.3: Tempo changes land on the beat

As a musician,
I want tempo changes while playing to switch cleanly on the next beat,
So that the groove never breaks.

**Acceptance Criteria:**

**Given** playing
**When** I change tempo
**Then** the new tempo applies at the first beat boundary at or after `committedUntil`, the dot position stays continuous, and no click is skipped or doubled (AD-6, FR13)
**And** the timeline holds at most one future segment, so rapid changes collapse to the latest value
**And** the numeral is `ink-secondary` while `pending.changed` includes `bpm`, then `ink` after the switch

**Given** stopped
**When** I change tempo
**Then** it applies immediately and the numeral stays ink
**And** `withSettings` and the `pending` observable are unit-tested across segment boundaries

### Story 2.4: Drag and tap tempo

As a musician,
I want to drag the numeral or tap along with a song,
So that I can make big jumps or match a record quickly.

**Acceptance Criteria:**

**Given** the tempo row
**When** I drag vertically on the numeral (hit area is the full row height)
**Then** after an 8 px threshold, tempo changes 1 BPM per 6 px, clamps at the limits, and the numeral updates live (UX-DR10)
**And** each new value follows the same next-beat rule as the steppers, and while playing the numeral shows the pending color during the drag
**And** `Tap` averages the last 4 intervals (5 taps; 2 taps minimum), rounds to an integer, clamps to 30–250, resets after a 2 s pause, and does not start playback (FR12)
**And** one tap alone changes nothing
**And** the `Tap` button is a 56px pill, at least 88px wide (UX-DR11)

### Story 2.5: The beat grid with spokes and labels

As a musician,
I want to see subdivision spokes with a clear hierarchy,
So that I can find any position in the bar.

**Acceptance Criteria:**

**Given** 4/4 at 16ths
**When** the grid draws
**Then** quarter spokes are 3px, 18% of radius and ink, 8ths are 2px, 11% and `grid-eighth`, and 16ths are 1.5px, 6% and `grid-sixteenth` (UX-DR4, FR1)
**And** beat numbers appear outside the ring at each beat in `beat-label` style
**And** hidden levels are not drawn
**And** the grid layer is cached offscreen per meter and grid level of the segment playing now, and invalidates only on change (AD-9)
**And** the default grid is `16ths`, and the canvas ARIA label comes from core `tickLabel`
**And** core `snap` and `tickLabel` exist with unit tests for 3/4, 4/4, 7/8 and 16 beats

### Story 2.6: Choose visible subdivisions

As a musician,
I want to choose the finest visible level, including triplets,
So that the grid shows only what I'm practicing.

**Acceptance Criteria:**

**Given** the top bar
**When** it renders
**Then** it shows a `chip-caption` and `picker-chip` pair for METER, GRID and CLICK, bottom-aligned with `{spacing.2}` gaps, never scrolling or hiding, and the chips are 48px tall with the current value as the label (UX-DR12)
**And** the METER and CLICK chips are placeholders that open nothing until their epics' stories land

**Given** the GRID chip
**When** I tap it
**Then** the Grid sheet opens with `Beats`, `8ths`, `16ths`, `Triplets` as a single choice and closes when I select one (UX-DR13, UX-DR15)
**And** `8ths` shows beats plus 8ths, and `Triplets` shows beats plus triplets with spokes 1.5px wide at 8% of radius
**And** the grid redraws immediately, even while playing, with the correct line count for the meter (FR3)
**And** the sheet opens from the bottom below 768px with scrim 0.32, closes on scrim tap, swipe-down or Esc, traps focus and returns it to the chip, and applies changes live
**And** the `Clear all markers` row is shown disabled below a divider until Epic 4

### Story 2.7: Any meter

As a musician,
I want to set the time signature, including odd meters,
So that I can practice 3/4, 6/8 or 7/8.

**Acceptance Criteria:**

**Given** the METER chip
**When** I open the Meter sheet
**Then** presets `2/4 3/4 4/4 5/4 6/8 7/8 12/8` appear (max 4 per row) with the current meter highlighted, and an `Other` section holds a beats stepper (1–16) and a `Beat unit` 4/8 segmented control (UX-DR14, FR4)
**And** one preset tap sets beats and denominator together, and editing the stepper or denominator highlights the matching preset or none
**And** the chip reads `n/d`
**And** while stopped the circle redraws immediately; while playing the meter switches at the next downbeat, together with any pending tempo change (AD-6, FR13)
**And** `clickBeats` length follows `beats` by the carry-over rule: kept toggles stay, and new beats are on only if every previous beat was on (UX-DR17)
**And** BPM counts the beat unit and the accent is on beat 1 only (FR2)

### Story 2.8: Pulse, tail and reduced motion

As a musician,
I want beat 1 to be visible in my peripheral vision,
So that I feel the bar start without staring.

**Acceptance Criteria:**

**Given** playing
**When** beat 1 sounds
**Then** the page background jumps to `surface-pulse` and decays to `surface` over 180 ms ease-out, also while muted, and never while stopped (UX-DR9, FR21)
**And** the `--pulse` variable is written only by the render loop, and the pulse color never goes below luminance 0.80
**And** a 30° comet tail trails the dot, opacity 0.45 to 0 and width tapering 18px to 2px, hidden when stopped (FR22, UX-DR5)
**And** under `prefers-reduced-motion`, the tail and pulse are off while the dot keeps sweeping
**And** both effects derive from `now` against timeline events, never from engine callbacks

## Epic 3: Train internal time with the click

A musician picks the click sound, chooses which beats click, adds a between-beats click, and mutes and unmutes in phase.

### Story 3.1: Choose which beats click

As a musician,
I want to turn clicks on or off per beat,
So that I can train with less support, like 2 & 4 or beat 1 only.

**Acceptance Criteria:**

**Given** the CLICK chip
**When** I tap it
**Then** the Click sheet main view opens with a `Click on beats` header, an `All` text action and one 44px `beat-toggle` per beat of the current meter, wrapping at 7 per row (balanced, up to 3 rows) (UX-DR16, FR8)
**And** tapping a toggle enables or disables clicks on that beat, and while playing it applies on the next beat
**And** the last enabled beat cannot be turned off: it is `aria-disabled` with the caption `Use Mute for silence.`
**And** `All` turns every beat on and is disabled when all are on
**And** the chip label follows the rule: `Every beat`, `Beat 1 only`, `Beat n only`, a list like `2 & 4` for two or three beats, `n of m beats` otherwise (UX-DR12)
**And** the beat-1 variant sounds only when beat 1 is enabled, and otherwise all enabled beats use the normal variant (UX-DR17)
**And** click events exist only for enabled beats, and a click sheet change never cancels already-scheduled nodes (AD-6, AD-7)

### Story 3.2: Between-beats click

As a musician,
I want an optional quieter click between the beats,
So that I can hear subdivisions while I keep fewer beats.

**Acceptance Criteria:**

**Given** the Click sheet main view
**When** I choose `Between beats` `None`, `8ths`, `16ths` or `Triplets`
**Then** quieter clicks sound at those positions only inside enabled beats, using the normal variant (FR9)
**And** the choice is independent of the visible grid, relative to the beat in /4 and /8 meters
**And** loudness order is beat 1 > other beats > between-beat clicks (UX-DR24)
**And** while playing, the change applies on the next beat
**And** the default is `None`, and the event plan is unit-tested for each division and for disabled beats

### Story 3.3: Mute and unmute in phase

As a musician,
I want to silence the click with one tap and bring it back in time,
So that I can find out whether I held the tempo myself.

**Acceptance Criteria:**

**Given** the top bar
**When** I tap the 48px `mute-toggle`
**Then** the click goes silent at once by setting the click-bus gain to 0, while clicks keep being scheduled (AD-7, FR10)
**And** dot, tail, pulse, glow and crossings keep running, and the toggle shows ink fill with a crossed-speaker glyph, not color alone
**Given** muted and playing
**When** I unmute
**Then** the click resumes on the next scheduled click, in phase
**And** the muted state is kept across Stop and Start and applies to every click level, including between-beat clicks
**And** previews are never muted

### Story 3.4: Choose the click sound

As a musician,
I want to choose a click sound I like,
So that the click is easy to hear against my instrument.

**Acceptance Criteria:**

**Given** the Click sheet
**When** I tap the `Sounds ›` row (it shows a live summary such as `Beep · markers off`)
**Then** the second level opens in the same sheet with a `sheet-back` button, focus moves to the back button, and `Esc` returns to the main view with focus on the `Sounds` row (UX-DR16)
**And** `Click sound` offers `Beep`, `Woodblock`, `Stick` and `Hi-hat`, each with an accent and a normal WAV
**And** while stopped, selecting a sound previews the accent then the normal variant 300 ms apart, even when muted
**And** while playing there is no preview and the sound takes over on the next beat
**And** beat 1 is distinguishable by pitch alone for every sound
**And** the files `sounds/click-<id>-accent.wav` and `-normal.wav` are short mono WAVs with the transient at sample 0, precached, and loaded through one URL builder (AD-11)
**And** the placeholder samples from Epic 1 are replaced and the default is `Beep`
**And** this story implements FR7

## Epic 4: Mark and hit target positions

A musician places, moves and removes markers, gets glow and crossing feedback and an optional marker sound, and can undo bulk removals.

### Story 4.1: Place and remove markers

As a musician,
I want to tap the circle to place a marker and tap it again to remove it,
So that I can mark the positions I'm practicing.

**Acceptance Criteria:**

**Given** the marker zone (the annulus from 40px inside to 24px outside the ring)
**When** I tap an empty position
**Then** a marker snaps to the nearest line of the finest visible level, with a `marker-preview` disc at 0.4 opacity while my finger is down, committed on release (UX-DR6, FR14)
**And** I can place multiple markers, with at most one per position, while playing or stopped
**Given** an existing marker
**When** I tap it
**Then** it is removed, and a tap outside the zone does nothing (UX-DR7)
**And** markers are 14px accent discs with a 2px surface outline, a 24px hit radius and the accent used only for markers
**And** `placeMarker` and `removeMarker` store actions keep `markers` sorted, unique and on visible ticks via `normalize`
**And** `hitTest` returns `{ inZone, barFraction }` and `snap` wraps at 12 o'clock
**And** the hint `Tap the circle to place a marker.` shows in the notice line until the first marker exists

### Story 4.2: Move markers by dragging

As a musician,
I want to drag a marker to a new position,
So that I can adjust my target without removing and replacing it.

**Acceptance Criteria:**

**Given** a marker
**When** I press it and drag more than 8 px
**Then** the preview snaps along the ring and nothing changes in the store until release, which commits one `moveMarker` (AD-4, UX-DR7)
**And** the marker keeps firing while I drag it during playback
**Given** I drop onto an occupied position
**When** I release
**Then** the dragged marker's original position is cleared and one marker remains at the target
**And** the interaction is deterministic at 16 beats × 16ths (64 positions)
**And** this story implements the move gesture of FR14

### Story 4.3: See each marker crossing

As a musician,
I want to see a glow build and a ring fire when the dot reaches a marker,
So that I can judge my timing by eye in peripheral vision.

**Acceptance Criteria:**

**Given** playing with markers
**When** the dot approaches a marker
**Then** the `anticipation-glow` ramps from 0 to 0.35 opacity and up to 28px radius starting one 16th note before the hit and peaks at the hit (UX-DR8, FR17)
**And** at the marker's scheduled audio time the `crossing-indicator` ring expands from 14px to 40px, 3px wide, fading over 220 ms
**And** core `plan` gains `marker` events for this story (a change to the event union from Story 1.2), emitted whether or not a marker sound is set, and glow and crossing derive from `now` against those events, never from dot proximity (AD-7, AD-9)
**And** under `prefers-reduced-motion`, the glow is off and the crossing is a static 3px accent ring for 150 ms
**And** the dot stays distinguishable from a marker through size and the surface halo, since accent versus ink contrast is only 2.86:1

### Story 4.4: Marker sound

As a musician,
I want a sound when the dot hits a marker,
So that I can hear my target position even when the click is muted.

**Acceptance Criteria:**

**Given** the Click sheet `Sounds` level
**When** I choose `Marker sound` `Off`, `Clap`, `Cowbell` or `Conga`
**Then** while stopped it previews once, and while playing the sound takes over at the next marker (FR18, UX-DR24)
**And** with a marker sound set, it plays at the crossing's audio time on the marker bus, which is never muted, and it is audibly distinct from both variants of all four click sounds (tested by listening against each)
**And** the `Sounds` summary reads like `Woodblock · Cowbell markers`
**And** `sounds/marker-<id>.wav` files are short mono WAVs with the transient at sample 0, precached via the shared URL builder (AD-11)
**And** the default is `Off`

### Story 4.5: Clear all, grid changes and Undo

As a musician,
I want bulk marker removals to be undoable,
So that changing the grid or clearing never costs me my setup.

**Acceptance Criteria:**

**Given** markers exist
**When** I tap `Clear all markers` in the Grid sheet
**Then** all are removed, the sheet closes and an `undo-notice` shows `n markers removed.` with a 48px `Undo` button (`1 marker removed.` for one) (UX-DR15, UX-DR18, FR15)
**And** the row is disabled when there are no markers
**Given** I switch the grid between binary (8ths/16ths) and `Triplets`
**When** markers sit off the shared positions
**Then** markers on beats are kept and the rest are removed, with the same `undo-notice` (FR16)
**And** switching to a coarser level of the same family removes markers that no longer sit on a visible line, with the same Undo
**And** no notice shows when 0 markers were removed
**Given** the `undo-notice` is visible
**When** I tap `Undo`
**Then** the exact previous markers and grid level return
**And** the notice disappears after 6 s, on the next marker edit and on any grid or meter change, and is never persisted (AD-4)
**And** the store derives one `notice` with the priority undo > audio notice > silent-switch hint > first-run marker hint (FR26)
**And** the notice is a polite live region reading `3 markers removed. Undo available.`

### Story 4.6: Markers survive meter changes safely

As a musician,
I want a meter change to handle my markers predictably,
So that I never end up with a marker off the grid.

**Acceptance Criteria:**

**Given** a meter change that removes beats
**When** it is applied
**Then** markers in the removed beats are removed with the same `undo-notice`, and Undo restores markers, grid, beats, beat unit and `clickBeats` together (AD-4, FR16)
**Given** a meter change is pending while playing
**When** I try to place a marker in a beat that will be removed
**Then** the placement is refused, because edits are validated against the target meter
**And** a meter change that keeps all beats removes no markers and shows no notice
**And** core `normalize` guarantees that every marker is on a visible line after any combined change

## Epic 5: Always ready, anywhere

The app opens with the last settings, works offline as an installable PWA, adapts to phone, landscape and laptop, and meets the accessibility floor.

### Story 5.1: Restore my last session

As a musician,
I want the app to open exactly as I left it,
So that practice starts with one tap.

**Acceptance Criteria:**

**Given** I change settings and close the app
**When** I reopen it on the same device
**Then** tempo, meter, grid, click sound, click beats, between beats, mute, markers and marker sound are restored, stopped, with no message and no setup step (FR20, CAP-9)
**And** only `src/persist/` touches storage: settings go to `groove-grid:settings` as `{ "v": 1, "settings": … }` and flags to `groove-grid:flags`
**And** writes are debounced to 500 ms or less and flushed on `pagehide`, and all access is in try/catch
**And** a missing, unparsable or unknown-version value loads defaults silently, and loaded data passes through core `normalize` (AD-10)
**And** in private mode the app works with defaults and shows no message
**And** the silent-switch hint flag moves from memory to `groove-grid:flags`
**And** first-launch defaults match UX-DR23, and a pure `v1 → v2` migration test fixture exists

### Story 5.2: Install it and use it offline

As a musician,
I want to add the app to my home screen and use it with no signal,
So that it works in the rehearsal room.

**Acceptance Criteria:**

**Given** the first visit completes
**When** I go offline and reload
**Then** the app shell and all sounds load from the service-worker precache and everything works, with no offline banner (FR25, UX-DR25)
**And** the manifest has name `Groove Grid`, `display: standalone`, `orientation: portrait`, `surface` theme and background colors, correct icons, and `start_url` and `scope` derived from the base path
**And** there is no custom install prompt
**Given** a new version is deployed
**When** it is waiting
**Then** it activates only while the engine status is not `playing`, on app load or when the page becomes visible again, with no prompt (AD-12)
**And** `vite-plugin-pwa` uses `registerType: 'prompt'`, never `autoUpdate`

### Story 5.3: Laptop popovers and phone landscape

As a musician,
I want the app to fit my laptop and handle landscape,
So that I can use it on any screen I have.

**Acceptance Criteria:**

**Given** a viewport of 768px or wider
**When** I tap a chip
**Then** a 360px `picker-popover` with `rounded.md`, a hairline border and one soft shadow opens anchored 8px under the chip with no scrim, shifted to stay in the viewport (UX-DR13, FR27)
**And** it has the same content and live-apply as the sheet, only one is open at a time, focus moves to the first control, is trapped and returns to the chip, and it closes on outside click or on clicking the same chip
**And** the open chip shows a 1.5px ink outline and `marker-preview` follows pointer hover in the marker zone
**Given** a phone in landscape with a viewport under 560px tall
**When** it renders
**Then** `rotate-overlay` covers the page with `Turn your phone upright.` as a polite status, and playback is unaffected (UX-DR19)
**And** tablets follow the 768px rule with no dedicated layout

### Story 5.4: Keyboard control

As a musician at a laptop,
I want keyboard shortcuts for the common actions,
So that my hands can stay on the instrument.

**Acceptance Criteria:**

**Given** focus is not on a chip, button, sheet or popover
**When** I press `Space`
**Then** playback starts or stops (FR23)
**And** `←` and `→` change tempo by 1, `Shift+←` and `Shift+→` by 5, `T` taps tempo, `M` toggles mute, and `Ctrl/Cmd+Z` undoes while `undo-notice` is visible
**And** `Tab` order is chips → mute → grid → `−` → BPM → `+` → Tap → Start
**Given** the grid is focused
**When** I press `←` or `→`
**Then** a marker cursor moves between snap positions (replacing tempo keys) and `Enter` toggles a marker at the cursor, and `Esc` moves focus to Start (UX-DR21)
**And** inside a sheet or popover, global shortcuts are suspended, arrows move within segmented and preset groups, `Space` or `Enter` toggles a beat toggle, activates `All` or opens `Sounds`, and playback continues
**And** `Esc` goes back from a second level, closes a main view and returns focus to the chip

### Story 5.5: Accessibility pass

As a musician who uses assistive technology or reduced motion,
I want every control to be named, operable and safe,
So that I can use the practice screen with confidence.

**Acceptance Criteria:**

**Given** a screen reader
**When** I traverse the screen
**Then** roles and names match the EXPERIENCE table: the canvas is an `img` labeled like `Grid: 4/4, 16ths, 3 markers: 1, and of 2, a of 3`, the BPM numeral is a `spinbutton` (min 30, max 250) announced politely after 500 ms of no change, chips read like `Click: Beep, 1 & 3, between beats none`, and segmented controls and presets are `radiogroup`s (UX-DR20, NFR9)
**And** beat toggles have `aria-pressed` and `Click on beat 3`, with the last one `aria-disabled` and described by `Use Mute for silence.`
**And** beats are never announced
**And** every control meets the 48px target (beat toggles 44px) and shows the 2px ink `:focus-visible` ring only for keyboard focus
**And** markers differ from lines by shape, and mute differs by fill and glyph, not color
**And** the layout survives 200% browser zoom on a laptop and wraps text rather than truncating on a phone
**And** the contrast table values in DESIGN are verified with a check against the CSS tokens
**And** reduced motion behavior is verified end to end: tail, glow and pulse off, crossing as a static ring, dot still sweeping
