# Source Extract — Groove Grid (UX-oriented)

Source keys: **[SPEC]** `_bmad-output/specs/spec-groove-grid/SPEC.md` · **[UXC]** `.../ux-candidates.md` · **[RM]** `.../roadmap.md` · **[BI]** `_bmad-output/brainstorming/brainstorm-groove-grid-app-2026-10-18/brainstorm-intent.md`

## 1. Product one-liner & target users
- Turns Scott Devine's **"Groove Grid"** concept into an animated practice tool: one bar drawn as a grid of subdivisions (`1 e & a 2 e & a …`) with a dot sweeping through it in exact tempo. [SPEC, BI]
- Goal: "playing in the pocket"; North Star: the musician *becomes the metronome* (Scott's "internal time"). "Trust in the clock is the product." [SPEC]
- Users: musicians practicing timing — "especially bassists", also other instrumentalists, drummers, and people with no instrument who "clap, tap or count". [SPEC, BI]
- Problems: rushing, dragging, missing the beat, slowly losing time. [SPEC, BI]
- No named personas in any source. Only named people: Scott Devine (concept origin). [SPEC, BI]

## 2. Platform / form-factor signals
- "The phone is the primary device. Layout, touch targets and audio must work there first." [SPEC]
- "mobile-first installable web app (PWA) using browser audio"; audio engine isolated from UI so a "React Native port remains cheap". [SPEC]
- BI listed platform as open ("web first? (implied, not decided)") — resolved in SPEC as PWA. [BI, SPEC]
- Keyboard inputs mentioned as candidates: spacebar to start, arrow/+− keys, Shift = ±5. [UXC]
- Eyes are on instrument/bandmates → grid, dot, markers must be "legible in peripheral vision". [SPEC]
- No mic, instrument input or account in v1. [SPEC]
- Haptic/smartwatch output excluded (latency/jitter). Bluetooth headphone latency compensation is a non-goal. [SPEC, RM]

## 3. Features & surfaces: v1 vs later
**v1 (CAP-1..9)** [SPEC]
- CAP-1 Circular grid; line weight = hierarchy (quarters biggest, 8ths smaller, 16ths smallest; triplets alternative). Free time signature ("any meter", not presets); configurable visible levels.
- CAP-2 Smooth dot sweeping continuously around the circle, loops to 1.
- CAP-3 Classic metronome click; beat 1 pitched higher.
- CAP-4 Click patterns: every beat, every 16th, every triplet, only 2 & 4, beat 1 only, muted (dot keeps sweeping; unmute resumes in phase).
- CAP-5 Tempo in BPM, "always" prominently visible in every state.
- CAP-6 Markers: place/move/remove, multiple, snap to visible subdivision (16th or triplet), "one obvious gesture each".
- CAP-7 Visual indicator on marker crossing; optional marker sound from presets, distinct from both click pitches.
- CAP-8 Start/stop with "a single obvious action"; start from beat 1.
- CAP-9 Restore last settings on reopen (tempo, meter, subdivisions, click pattern, markers, marker sound), device-local.
- Surfaces implied: one "practice screen" ("stays pure"); settings/controls for the above. No other screens named. [SPEC]
- BI v1 scope phrase: "Grid + moving dot + rock-solid click + markers. Nothing else." [BI]

**Later** [RM, priority order]
1. Tap mode (early/late feedback) · 2. Recording + playback, waveform around grid, "tree rings" loops · 3. Click ladder / gap click ("moment of truth" cue) · 4. Settings in URL / shareable patterns · 5. Swing ratio; **Line layout** (straight grid, dot jumps to 1); compound meters & custom accents · 6. Tempo ramp, call-and-response, per-marker sounds, backing tracks · 7. Progress (PB graph, daily groove, streaks, ghosts) · 8. Auto-correction.
- "Too big for now": live ghost (Trackmania-style), teacher features, tempo ramp, gamification. [RM]
- Future progress/gamification "lives elsewhere", not on practice screen. [SPEC]
- Each later item arrives "as a new layer or mode on the v1 grid, not a rewrite". [RM, SPEC]

## 4. Stated UX / visual / feel decisions
- Circle chosen for v1 ("circular grid"); line layout deferred. [SPEC, RM]
- Line weight encodes subdivision hierarchy. [SPEC]
- "minimal: only necessary controls, each self-explanatory, with good proportions and contrast." [SPEC, BI]
- "No gimmicks: no unnecessary lights, sounds or features." [SPEC, BI]
- Feel: "Focus/flow like a meditation app." [BI]
- Reliability reference: stable "like a good old Casio" / "Casio-level stable". [BI, SPEC]
- Animation "smooth and high-performance. Dropped frames are a defect." [SPEC]
- Sound: "classic metronome click"; beat 1 higher pitch; marker sound distinct. [SPEC]
- Not stated: colors, typography, theme (dark/light), brand, iconography, visual references.

## 5. UX candidates [UXC] (all "unconfirmed"; must pass no-gimmicks/minimal-UI)
Tempo control (CAP-5) — status: open (SPEC Open Question)
- Slider or +/− buttons (user: "all possible") — open
- Jog-wheel drag around the circle — open
- Tap tempo, only for initial value (user: "never very precise") — open
- Arrow/+− keys, Shift = ±5 — open
- Tempo change takes effect on next downbeat — open
Transport & session (CAP-8)
- "Zero to groove in 2s": opens with last settings, one tap or spacebar starts, no loading/setup/account — open (CAP-9 covers settings restore)
- Controls fade on play, leaving grid, dot, BPM; touch brings them back — open
- One intention per session (e.g. "hit the 'a' of 2 at 85 BPM") — open
Markers (CAP-6, CAP-7)
- Tap to place, drag to move, tap to remove — open
- ~~Long-press off-grid nudge~~ — **rejected** (markers stay on grid; swing on roadmap)
- Anticipation glow: marker brightens as dot approaches, peaks on hit — open
Peripheral readability (CAP-2)
- Comet tail: fading trail behind dot — open
- Subtle whole-screen pulse on beat 1 — open

## 6. Constraints
- Audio clock is master; visuals derive from it. Click times derived from start time, not accumulated. [SPEC]
- Timing: 30–250 BPM; click ≤1 ms of ideal; zero drift over 30 min; dot within one display frame of each line at click. [SPEC]
- Meters: equal beats, accent on beat 1 only; no compound grouping v1. [SPEC]
- Subdivision depth not hard-coded; v1 exposes quarters, 8ths, 16ths (+ triplets per CAP-1). [SPEC]
- Layered grid rendering for future features. [SPEC, BI]
- Persistence device-local only; no URL settings. [SPEC]
- Offline: PWA "installable" stated; offline behaviour not explicitly stated. [SPEC]
- Accessibility: only "good proportions and contrast", "touch targets" must work on phone; no other a11y requirements. [SPEC]
- Stakes: not explicitly stated (no business model, monetisation, or audience size). Quality bar "non-negotiable". [BI]

## 7. Journeys / scenarios
- Success signal: open app → set BPM → place markers on 16th grid → practice with click → then muted; click never wavers; muting/unmuting shows whether time was held. [SPEC]
- Self-assessment: musician judges visually or "when the click returns after silence" (manual mute/unmute in v1). [BI, SPEC]
- Practicing without instrument (clap/tap/count). [SPEC, BI]
- Candidate: "Zero to groove in 2s" launch flow. [UXC]
- Future: teacher → student, band "challenge of the week" via shared patterns. [RM]

## 8. Open questions touching UX
- Tempo control interaction (slider, +/−, tap tempo, jog wheel) — pending UX assessment. [SPEC, BI]
- Circle vs. line as default (or both)? [BI] — SPEC resolves v1 as circle; line deferred. [SPEC, RM]
- Platform: web first? [BI] — resolved as PWA. [SPEC]

## 9. Gaps (sources silent)
- Visual identity: color palette, dark/light mode, typography, iconography, brand name treatment.
- Screen layout: where controls live (settings panel/sheet vs inline), portrait vs landscape, tablet/desktop layouts.
- How time signature and subdivision visibility are edited (input UI for "any meter").
- How triplets vs 16ths are switched/displayed together; marker behaviour when switching division.
- Visual design of marker crossing indicator (beyond candidate glow); marker sound preset list/selection UI.
- Beat/subdivision labels (`1 e & a`) shown on grid or not.
- Onboarding / first-run state (default tempo, meter, markers) and explaining the Groove Grid concept.
- Accessibility beyond contrast: screen readers, reduced motion, color-blindness, hearing-impaired users.
- Audio edge cases UX: iOS silent switch, audio unlock on first tap, backgrounding/screen lock, interruptions (calls).
- Wake lock / screen sleep during practice.
- Offline/install prompt UX; error/empty states; volume controls.
- Clearing/resetting markers and settings.
