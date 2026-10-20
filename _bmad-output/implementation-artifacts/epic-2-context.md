# Epic 2 Context: Set up the grid and tempo

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A musician sets any tempo (30-250 BPM) and meter, chooses the finest visible subdivision, and sees the grid redraw correctly; changes land on the next beat or downbeat without a glitch. Epic 2 turns the Epic 1 spike screen into the real practice screen (tokens, layout, settings store, tempo controls, grid spokes, pickers, pulse and comet tail).

## Stories

- Story 2.1: Design tokens and the practice-screen layout
- Story 2.2: Settings store and tempo steppers
- Story 2.3: Tempo changes land on the beat
- Story 2.4: Drag and tap tempo
- Story 2.5: The beat grid with spokes and labels
- Story 2.6: Choose visible subdivisions
- Story 2.7: Any meter
- Story 2.8: Pulse, tail and reduced motion

## Requirements & Constraints

- Phone-first (iPhone Safari 17+, also Chrome/Firefox); light theme only; no loading/splash; no network after load; system fonts only.
- Minimal UI: no shadows (except the laptop popover), idle animation, gradients or decoration. Controls always visible, even while playing.
- Defaults: 80 BPM, 4/4, 16ths, every beat on, no markers. BPM counts the beat unit; accent on beat 1 only.
- Pulse color must stay at luminance >= 0.80; touch targets 48px (beat toggles 44px); accent color only for markers/preview/glow/crossing.
- Exact copy, no exclamation marks or coaching.

**Color tokens (CSS variables):** surface #F7F3EA; surface-raised #FFFDF8; surface-pressed #E8E1D2; surface-pulse #F0EADD; ink #1C1B19; ink-secondary #5C5850; ink-disabled #9C968B; grid-quarter #1C1B19; grid-eighth #4A463F; grid-sixteenth #7A746A; accent #B4361C; border-hairline #D9D2C3; scrim #1C1B19 (used at 0.32 opacity).

**Type** (stack `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; size/weight/line-height/letter-spacing):
- bpm-numeral 72/600/1/-0.02em, tabular-nums, 3-digit fixed width
- bpm-unit 13/600/1.2/0.08em, uppercase
- beat-label 15/600/1 (tabular)
- chip-caption 11/600/1.2/0.08em, uppercase
- label 15/600/1.2
- body 16/400/1.4
- caption 13/400/1.35

**Spacing:** 4, 8, 12, 16, 24, 32, 48 (scale 1-7); gutter 16; target-min 48; control-lg 56; column-max 480; chip-padding-x 12; top-bar-height 66. **Radii:** md 12, lg 20, full 9999.

## Technical Decisions

- `src/ui/settings.svelte.ts` is the only settings writer, via named actions (`setTempo`, `setMeter`, ...), each passing through core `normalize`. `main.ts` subscribes and is the only caller of `engine.apply(snapshot)`.
- Changes apply at the first beat boundary at or after `committedUntil`; meter/beat-unit changes (with any tempo change) wait for the downbeat; at most one future segment (rapid changes collapse to latest). Stopped: apply immediately. `pending.changed` drives the pending numeral color.
- Core owns `snap` and `tickLabel` (960 ticks/beat); only `src/render/` converts ticks to geometry. Constants live only in `src/core/constants.ts`.
- One rAF loop in `src/render/`; layers grid -> glow -> markers -> preview -> cursor -> comet-tail -> dot -> crossing. Grid layer is cached offscreen per meter/grid level of the segment playing now. Only the loop writes `--pulse`; pulse and tail derive from audio time against timeline events, never engine callbacks. Reduced motion read in render.
- UI owns the canvas, its ARIA label (from `tickLabel`) and pointer/keyboard events. Naming: `PascalCase.svelte` per EXPERIENCE names, `kebab-case.ts`, `*.svelte.ts`.
- Remove the spike `?bpm=` hook in 2.2.
- clickBeats follows beats by carry-over: kept toggles stay; new beats on only if all previous were on.

## UX & Interaction Patterns

**Practice-screen layout (portrait, one column, centered, max 480px; page background edge to edge; respect safe-area insets):**
- Top bar: 66px (11px caption + 4px gap + 48px chip) plus 8px below; METER/GRID/CLICK caption+chip pairs, mute toggle (48px, no caption) at right, bottom-aligned, 8px gaps.
- Grid circle: square, centered, diameter min(100vw - 32, available height), never under 260px; about 325px on 375x667. Shorter viewports count as landscape (under 560px tall).
- Notice line: reserved 48px, caption style, ink-secondary, centered.
- Tempo row: 88px; `-` stepper, numeral + unit, `+` stepper.
- Transport row: 56px; Tap pill (min 88px wide) left, Start/Stop fills the rest.
- Bottom: safe-area inset + 16px.

**Grid visuals:** ring 3px ink, beat 1 at 12 o'clock, clockwise; beat numbers outside ring in beat-label, ink-secondary. Spokes (inward from ring; width/length as % of radius/color): quarter 3px/18%/ink; eighth 2px/11%/grid-eighth; sixteenth 1.5px/6%/grid-sixteenth; triplet 1.5px/8%/grid-sixteenth. Levels relative to beat (8ths = beat/2, 16ths = beat/4); hidden levels not drawn. Dot: 18px ink with 2px surface halo. Comet tail: 30 degree arc, opacity 0.45 to 0, width 18 to 2px. Pulse: page jumps to surface-pulse at beat 1, decays to surface over 180ms ease-out; off when stopped.

**Controls:** steppers 56px circles, 1.5px ink border, surface-raised fill, pressed surface-pressed, disabled glyph ink-disabled (border at 0.4 opacity) at 30/250; hold-repeat after 400ms at 8/s, 20/s after 1.5s. Tap and Start/Stop are 56px pills; Start/Stop is ink fill with surface-raised label (pressed 0.85 opacity), label shows next action. Chips: 48px pill, surface-raised, 1px hairline border, label shows current value, open = 1.5px ink outline. Numeral drag: full row height hit area, 8px threshold, 1 BPM per 6px. Tap tempo: average last 4 intervals, min 2 taps, reset after 2s, never starts playback.

**Sheets:** under 768px bottom sheet (surface-raised, 20px top radius, 16px padding, 48px rows, scrim 0.32, close on scrim/swipe-down/Esc, focus trap and return, live apply). Grid sheet: Beats/8ths/16ths/Triplets, closes on select, disabled `Clear all markers` below divider until Epic 4. Meter sheet: presets 2/4 3/4 4/4 5/4 6/8 7/8 12/8 (max 4/row, 48px pills, selected = ink fill), `Other` with beats stepper 1-16 and Beat unit 4/8. Focus ring: 2px ink, 2px offset, `:focus-visible`. Reduced motion: tail and pulse off, dot still sweeps.

## Cross-Story Dependencies

- 2.1 first: layout/tokens host everything else and absorb Epic 1's Start/Stop, notice line and canvas unchanged.
- 2.2 (store, `main.ts` subscription) precedes 2.3, 2.4, 2.6, 2.7; 2.3 supplies the pending behavior used by 2.4 and 2.7.
- 2.5 (`snap`, `tickLabel`, cached grid layer) precedes 2.6 and 2.7 redraws.
- 2.6 METER and CLICK chips are placeholders until 2.7 and Epic 3; Clear-all row is a placeholder until Epic 4.
- Builds on Epic 1 engine, timeline and dot layer.
