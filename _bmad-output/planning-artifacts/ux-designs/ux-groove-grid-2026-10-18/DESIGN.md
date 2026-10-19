---
name: groove-grid
description: Groove Grid v1 visual system. One cream page, one black circle, one brick-red accent for markers. Light only.
status: final
created: 2026-10-18
updated: 2026-10-19
sources:
  - ../../../specs/spec-groove-grid/SPEC.md
  - ../../../specs/spec-groove-grid/ux-candidates.md
  - ../../../specs/spec-groove-grid/roadmap.md
  - ../../../brainstorming/brainstorm-groove-grid-app-2026-10-18/brainstorm-intent.md
colors:
  surface: '#F7F3EA'
  surface-raised: '#FFFDF8'
  surface-pressed: '#E8E1D2'
  surface-pulse: '#F0EADD'
  ink: '#1C1B19'
  ink-secondary: '#5C5850'
  ink-disabled: '#9C968B'
  grid-quarter: '#1C1B19'
  grid-eighth: '#4A463F'
  grid-sixteenth: '#7A746A'
  accent: '#B4361C'
  border-hairline: '#D9D2C3'
  scrim: '#1C1B19'
typography:
  bpm-numeral:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 72px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: -0.02em
  bpm-unit:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
  beat-label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1'
  chip-caption:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
  label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.2'
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.4'
  caption:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.35'
rounded:
  md: 12px
  lg: 20px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  gutter: 16px
  target-min: 48px
  control-lg: 56px
  column-max: 480px
  chip-padding-x: 12px
  top-bar-height: 66px
components:
  grid-circle:
    background: '{colors.surface}'
    ring-color: '{colors.grid-quarter}'
    ring-width: 3px
    diameter: 'min(100vw - 2 * {spacing.gutter}, available height)'
    beat-label-typography: '{typography.beat-label}'
    beat-label-color: '{colors.ink-secondary}'
  grid-spoke-quarter:
    color: '{colors.grid-quarter}'
    width: 3px
    length: 18% of radius
  grid-spoke-eighth:
    color: '{colors.grid-eighth}'
    width: 2px
    length: 11% of radius
  grid-spoke-sixteenth:
    color: '{colors.grid-sixteenth}'
    width: 1.5px
    length: 6% of radius
  grid-spoke-triplet:
    color: '{colors.grid-sixteenth}'
    width: 1.5px
    length: 8% of radius
  sweep-dot:
    color: '{colors.ink}'
    diameter: 18px
    halo: '2px {colors.surface}'
  comet-tail:
    color: '{colors.ink}'
    opacity-start: '0.45'
    opacity-end: '0'
    arc-length: 30deg
    width: 'tapers from 18px to 2px'
  marker:
    color: '{colors.accent}'
    diameter: 14px
    outline: '2px {colors.surface}'
    hit-radius: 24px
  marker-preview:
    color: '{colors.accent}'
    opacity: '0.4'
    diameter: 14px
  anticipation-glow:
    color: '{colors.accent}'
    opacity-peak: '0.35'
    radius-peak: 28px
    lead-time: one 16th note (a quarter of a beat) before the marker
  crossing-indicator:
    color: '{colors.accent}'
    ring-start: 14px
    ring-end: 40px
    ring-width: 3px
    duration: 220ms
  beat-one-pulse:
    from: '{colors.surface-pulse}'
    to: '{colors.surface}'
    attack: 0ms
    decay: 180ms ease-out
  bpm-numeral:
    typography: '{typography.bpm-numeral}'
    color: '{colors.ink}'
    color-pending: '{colors.ink-secondary}'
    unit-typography: '{typography.bpm-unit}'
    unit-color: '{colors.ink-secondary}'
  tempo-stepper:
    size: '{spacing.control-lg}'
    background: '{colors.surface-raised}'
    background-pressed: '{colors.surface-pressed}'
    border: '1.5px {colors.ink}'
    glyph-color: '{colors.ink}'
    glyph-color-disabled: '{colors.ink-disabled}'
    radius: '{rounded.full}'
  tap-tempo-button:
    height: '{spacing.control-lg}'
    min-width: 88px
    background: '{colors.surface-raised}'
    background-pressed: '{colors.surface-pressed}'
    border: '1.5px {colors.ink}'
    foreground: '{colors.ink}'
    typography: '{typography.label}'
    radius: '{rounded.full}'
  start-stop-button:
    height: '{spacing.control-lg}'
    background: '{colors.ink}'
    foreground: '{colors.surface-raised}'
    typography: '{typography.label}'
    radius: '{rounded.full}'
  top-bar:
    height: '{spacing.top-bar-height}'
    gap: '{spacing.2}'
    margin-bottom: '{spacing.2}'
    align: 'bottom (chips and mute toggle share the bottom edge)'
  chip-caption:
    typography: '{typography.chip-caption}'
    color: '{colors.ink-secondary}'
    text-transform: uppercase
    gap-to-chip: '{spacing.1}'
  picker-chip:
    height: '{spacing.target-min}'
    padding-x: '{spacing.chip-padding-x}'
    background: '{colors.surface-raised}'
    background-pressed: '{colors.surface-pressed}'
    border: '1px {colors.border-hairline}'
    foreground: '{colors.ink}'
    typography: '{typography.label}'
    radius: '{rounded.full}'
  picker-sheet:
    background: '{colors.surface-raised}'
    radius-top: '{rounded.lg}'
    scrim: '{colors.scrim} at 0.32 opacity'
    row-height: '{spacing.target-min}'
    row-typography: '{typography.body}'
    row-selected-indicator: '{colors.ink}'
    section-header-typography: '{typography.caption}'
    section-header-color: '{colors.ink-secondary}'
    padding: '{spacing.gutter}'
  sheet-nav-row:
    height: '{spacing.target-min}'
    label-typography: '{typography.body}'
    label-color: '{colors.ink}'
    summary-typography: '{typography.caption}'
    summary-color: '{colors.ink-secondary}'
    chevron-color: '{colors.ink}'
    divider: '1px {colors.border-hairline}'
  sheet-back:
    size: '{spacing.target-min}'
    glyph-color: '{colors.ink}'
    title-typography: '{typography.label}'
  text-action:
    min-height: '{spacing.target-min}'
    min-width: '{spacing.target-min}'
    typography: '{typography.label}'
    color: '{colors.ink}'
    color-disabled: '{colors.ink-disabled}'
  meter-preset:
    height: '{spacing.target-min}'
    min-width: 64px
    gap: '{spacing.2}'
    max-per-row: '4'
    background: '{colors.surface-raised}'
    border: '1.5px {colors.ink}'
    foreground: '{colors.ink}'
    background-selected: '{colors.ink}'
    foreground-selected: '{colors.surface-raised}'
    typography: '{typography.label}'
    radius: '{rounded.full}'
  picker-popover:
    background: '{colors.surface-raised}'
    width: 360px
    radius: '{rounded.md}'
    border: '1px {colors.border-hairline}'
    shadow: '0 8px 24px rgba(28, 27, 25, 0.16)'
    offset-from-chip: '{spacing.2}'
    padding: '{spacing.gutter}'
    min-viewport-width: 768px
  number-stepper:
    size: '{spacing.target-min}'
    border: '1.5px {colors.ink}'
    radius: '{rounded.full}'
    value-typography: '{typography.label}'
  mute-toggle:
    size: '{spacing.target-min}'
    background-on: '{colors.surface-raised}'
    foreground-on: '{colors.ink}'
    background-muted: '{colors.ink}'
    foreground-muted: '{colors.surface-raised}'
    border: '1.5px {colors.ink}'
    radius: '{rounded.full}'
  segmented-control:
    height: '{spacing.target-min}'
    background: '{colors.surface-raised}'
    border: '1.5px {colors.ink}'
    segment-selected-background: '{colors.ink}'
    segment-selected-foreground: '{colors.surface-raised}'
    segment-foreground: '{colors.ink}'
    typography: '{typography.label}'
    radius: '{rounded.full}'
  beat-toggle:
    size: 44px
    gap: '{spacing.1}'
    max-per-row: '7'
    background-off: '{colors.surface-raised}'
    foreground-off: '{colors.ink}'
    background-on: '{colors.ink}'
    foreground-on: '{colors.surface-raised}'
    border: '1.5px {colors.ink}'
    typography: '{typography.beat-label}'
    radius: '{rounded.full}'
  undo-notice:
    height: '{spacing.target-min}'
    text-typography: '{typography.caption}'
    text-color: '{colors.ink-secondary}'
    action-typography: '{typography.label}'
    action-color: '{colors.ink}'
    action-min-width: '{spacing.target-min}'
    duration: 6s
  rotate-overlay:
    background: '{colors.surface}'
    foreground: '{colors.ink}'
    typography: '{typography.body}'
  hint-text:
    typography: '{typography.caption}'
    color: '{colors.ink-secondary}'
  focus-ring:
    outline: '2px {colors.ink}'
    offset: 2px
---

## Brand & Style

> Mockups illustrate; this document wins on conflict. Mockups: [`mockups/key-practice.html`](mockups/key-practice.html) · [`mockups/key-click-sheet.html`](mockups/key-click-sheet.html) · [`mockups/key-grid-sheet.html`](mockups/key-grid-sheet.html) · [`mockups/key-laptop.html`](mockups/key-laptop.html).

Groove Grid is a practice instrument, not an app that wants attention. The posture is a meditation app built on a Casio: a quiet page, one black circle, one moving dot, and a number you can read from the music stand. Everything else is there to set the circle up and then get out of the way. Trust in the clock is the product, so nothing on screen may wobble, shimmer or decorate.

The look is ink on paper. A warm cream page, near-black ink for the circle, grid, dot and type, and a single brick-red accent reserved for the musician's own marks (markers and their glow). Light only, as the user decided. [ASSUMPTION] All hex values, sizes and timings in this file were chosen by UX within the user's "white or cream background, black circle" direction.

"Memlog" below means the decision log of the UX sessions (`.memlog.md`); entries marked memlog are user decisions.

## Colors

| Token | Hex | Role | Not used for |
|---|---|---|---|
| `{colors.surface}` | `#F7F3EA` | Page background (warm cream). | Controls. |
| `{colors.surface-raised}` | `#FFFDF8` | Button fills, sheet and popover background, text on ink fills. | The page. |
| `{colors.surface-pressed}` | `#E8E1D2` | Pressed state of outlined controls. | Resting states. |
| `{colors.surface-pulse}` | `#F0EADD` | Beat-1 pulse peak color of the page. | Anything static. |
| `{colors.ink}` | `#1C1B19` | Circle ring, quarter spokes, dot, comet tail, BPM numeral, labels, start/stop fill, focus ring. | — |
| `{colors.ink-secondary}` | `#5C5850` | Beat labels, BPM unit, pending BPM, chip captions, section headers, hints. | Primary values. |
| `{colors.ink-disabled}` | `#9C968B` | Disabled glyphs and labels: `−` at 30 BPM, `+` at 250 BPM, `All` when all beats are on, `Clear all markers` with no markers. | Any enabled state. |
| `{colors.grid-quarter}` | `#1C1B19` | Quarter spokes (same as ink). | — |
| `{colors.grid-eighth}` | `#4A463F` | 8th spokes. | — |
| `{colors.grid-sixteenth}` | `#7A746A` | 16th and triplet spokes. | Text. |
| `{colors.accent}` | `#B4361C` | Markers, marker preview, anticipation glow, crossing indicator. Only these. | Buttons, state, errors, decoration. |
| `{colors.border-hairline}` | `#D9D2C3` | Picker chip outline, sheet row dividers, popover border (decorative). | Anything that must be seen. |
| `{colors.scrim}` | `#1C1B19` | Sheet scrim at 0.32 opacity. | — |

[ASSUMPTION] One chromatic accent instead of pure monochrome: markers must separate from the ink spokes in peripheral vision; an ink marker would merge with the lines it sits on. The accent is never the only cue: markers also differ by shape (filled disc on the ring vs. lines).

**Contrast (WCAG 2.x, computed).** Text needs 4.5:1 (AA; the BPM numeral is large text and needs 3:1 but clears 4.5:1). Non-text UI and graphics (grid lines, dot, markers, control outlines) need 3:1 so they read in peripheral vision. The beat-1 pulse color is included because everything is drawn on it for 180 ms.

| Foreground | on `surface` | on `surface-raised` | on `surface-pulse` | on `surface-pressed` | on `ink` | Requirement |
|---|---|---|---|---|---|---|
| `ink` | 15.54 | 16.93 | 14.36 | 13.22 | — | 4.5 text / 3 graphic — pass |
| `ink-secondary` (incl. 11px chip captions) | 6.39 | 6.96 | 5.90 | 5.44 | — | 4.5 text — pass |
| `grid-eighth` | 8.47 | — | 7.82 | — | — | 3 graphic — pass |
| `grid-sixteenth` | 4.18 | — | 3.86 | — | — | 3 graphic — pass; not for text |
| `accent` | 5.44 | 5.93 | 5.03 | — | 2.86 | 3 graphic on page — pass; vs ink see below |
| `surface-raised` (start/stop label, muted toggle, selected segments) | — | — | — | — | 16.93 | 4.5 text — pass |
| `ink-disabled` | 2.65 | 2.89 | — | — | — | exempt (disabled), intentionally faint |
| `border-hairline` | 1.36 | — | — | — | — | decorative; chips are also identified by their ink label |

Accent vs ink is only 2.86:1, so the dot passing over a marker relies on size and the surface-colored halo/outline, not color, to stay distinguishable.

**Flash safety.** `{colors.surface-pulse}` has relative luminance 0.826 (surface 0.898). Because the darker state stays above 0.80, the pulse is not a "general flash" under WCAG 2.3.1 even at 250 BPM in a 1-beat bar (4.2 pulses/s). [ASSUMPTION] Pulse color chosen to stay above that threshold; do not darken it.

## Typography

[ASSUMPTION] System UI stack (SF Pro on iOS/macOS, Roboto on Android, Segoe UI on Windows) for everything: zero font download keeps cold start instant and offline-safe, and all three ship tabular figures.

| Role | Token | Use |
|---|---|---|
| BPM numeral | `{typography.bpm-numeral}` | The current tempo. Always `font-variant-numeric: tabular-nums` so digits do not shift while stepping or dragging. Width reserved for 3 digits. |
| BPM unit | `{typography.bpm-unit}` | "BPM" under the numeral, uppercase via CSS. |
| Beat label | `{typography.beat-label}` | "1 2 3 4" outside the ring at each beat, tabular; also the `beat-toggle` numerals. |
| Chip caption | `{typography.chip-caption}` | `METER` / `GRID` / `CLICK` above the chips, uppercase via CSS. |
| Label | `{typography.label}` | Button and chip text ("Start", "Tap", "4/4"), sheet titles, `All`, `Undo`. |
| Body | `{typography.body}` | Sheet rows, `Sounds` row label, rotate overlay text. |
| Caption | `{typography.caption}` | Hints, one-line notices, sheet section headers, `Sounds` summary. |

[ASSUMPTION] 72px / 600 for the BPM numeral: readable at roughly 1.5 m on a music stand while leaving room for the circle on a 375px-wide phone. No other display sizes. No italics.

## Layout & Spacing

Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 px (`{spacing.1}`–`{spacing.7}`). Side gutter `{spacing.gutter}` (16px). Minimum touch target `{spacing.target-min}` (48px); primary controls `{spacing.control-lg}` (56px).

Portrait single column, top to bottom [ASSUMPTION — order chosen so setup sits above the circle and the hands-on tempo/transport controls sit in thumb reach]:

| Zone | Contents | Height |
|---|---|---|
| Top bar | `chip-caption` + chip for METER · GRID · CLICK, then mute toggle (right, no caption) | `{spacing.top-bar-height}` (14px caption + 4px gap + 48px chip) + `{spacing.2}` |
| Grid | `grid-circle`, centered, square | fills remaining space, max = width − 2 × gutter |
| Notice line | `hint-text` or `undo-notice` (only when present) | 48px, reserved so nothing jumps [ASSUMPTION: tall enough for the Undo target] |
| Tempo row | `−` stepper · BPM numeral + unit · `+` stepper | 88px |
| Transport row | tap-tempo button (left) · start-stop button (fills rest) | 56px |
| Bottom | safe-area inset + `{spacing.4}` | — |

On a 375 × 667 phone this gives a circle of about 325px. Composition: [`mockups/key-practice.html`](mockups/key-practice.html). On wider viewports the column is centered and capped at `{spacing.column-max}` (480px); the page background continues edge to edge. The circle never shrinks below 260px. Any viewport short enough to need a smaller circle counts as landscape (EXPERIENCE.md Responsive & Platform: under 560px tall).

## Elevation & Depth

Flat. No shadows on the practice screen. The one shadow in the system is the laptop `picker-popover` (`0 8px 24px` at 0.16 ink), because without a scrim it needs to lift off the page [ASSUMPTION]. On the phone the only layering is the picker sheet over a `{colors.scrim}` at 0.32 opacity; the sheet is distinguished by `{colors.surface-raised}` and its top corners, not by a shadow.

Draw order inside the grid, bottom to top:

1. Beat-1 pulse (page background)
2. Spokes
3. Ring
4. Beat labels
5. Anticipation glow
6. Markers
7. Comet tail
8. Dot
9. Crossing indicator

The grid is a stack of layers so future roadmap layers (tap input, waveform) slot in between.

## Shapes

The circle is the only big shape and it is perfect. Everything interactive echoes it: steppers, toggles, chips, segmented controls, meter presets and buttons are `{rounded.full}`. Sheets use `{rounded.lg}` on top corners only. `{rounded.md}` is used only by `picker-popover`. No square buttons, no cards.

## Components

### Grid layer

| Component | Anatomy & visual spec | States |
|---|---|---|
| `grid-circle` | See [`mockups/key-practice.html`](mockups/key-practice.html). One ring (`{colors.grid-quarter}`, 3px) for one bar. Beat 1 at 12 o'clock, clockwise. Beat numbers in `{typography.beat-label}` / `{colors.ink-secondary}` just outside the ring at each beat [ASSUMPTION: beat numbers only; `e & a` syllables would clutter at 16ths]. | Static; redraws on meter / subdivision change. |
| `grid-spoke-*` | Inward ticks from the ring at each subdivision. Hierarchy by width + length + tone: quarter 3px / 18% radius / ink; 8th 2px / 11% / `grid-eighth`; 16th 1.5px / 6% / `grid-sixteenth`; triplet 1.5px / 8% / `grid-sixteenth` (longer than 16ths so the two divisions read differently). Triplet mode shows beats + triplets only. Hidden levels are not drawn. Levels are relative to the beat (`8ths` = beat ÷ 2, `16ths` = beat ÷ 4) in both /4 and /8 meters. | — |
| `sweep-dot` | 18px ink disc centered on the ring with a 2px surface halo so it stays separate from spokes and markers. | At rest: sits on beat 1. Playing: moves continuously. |
| `comet-tail` | Arc on the ring trailing the dot, 30°, opacity 0.45 → 0, width tapering 18px → 2px. Constant angle at every tempo. | Hidden when stopped or under reduced motion. |
| `marker` | 14px `{colors.accent}` disc centered on the ring at its grid position, 2px surface outline. | Resting; dragging (follows finger, `marker-preview` at snap target). |
| `marker-preview` | Same disc at 0.4 opacity at the snap position under the finger or pointer. | While a finger or pointer is down; on laptop also on pointer hover in the marker zone. |
| `anticipation-glow` | Soft accent radial glow behind a marker, ramping 0 → 0.35 opacity and up to 28px radius, starting one 16th note (a quarter of a beat) before the dot reaches the marker; peaks at the hit. | Off under reduced motion. |
| `crossing-indicator` | Accent ring expanding 14 → 40px, 3px wide, fading to 0 in 220ms from the hit time. | Reduced motion: no expanding ring; instead a static 3px accent ring around the marker for 150ms. |
| `beat-one-pulse` | Whole page background jumps to `{colors.surface-pulse}` at beat 1 and decays to `{colors.surface}` over 180ms ease-out. | Off under reduced motion; off when stopped. |

### Tempo & transport

| Component | Anatomy & visual spec | States |
|---|---|---|
| `bpm-numeral` | `{typography.bpm-numeral}` in ink, "BPM" below in `{typography.bpm-unit}`. Hit area extends to the full height of the tempo row (vertical drag). | Pending (playing; see EXPERIENCE.md Tempo control): `{colors.ink-secondary}`. Dragging while playing: pending color; dragging while stopped: ink (applies immediately). |
| `tempo-stepper` | 56px outlined circle, 1.5px ink outline, ink "−" / "+" glyph (2px stroke). | Pressed: `surface-pressed`. Disabled (`−` at 30 BPM; `+` at 250 BPM): `ink-disabled` glyph, outline stays ink at 0.4 opacity. |
| `tap-tempo-button` | 56px-high pill, min 88px wide, 1.5px ink outline, label "Tap". | Pressed: `surface-pressed` for 80ms per tap. |
| `start-stop-button` | 56px-high ink pill, label "Start" / "Stop" in `surface-raised`. The only filled-ink button besides the muted toggle. | Pressed: ink at 0.85 opacity. No color change between Start and Stop; the label changes. |

### Top bar & pickers

| Component | Anatomy & visual spec | States |
|---|---|---|
| `top-bar` | Row of three caption + chip pairs and the mute toggle, `{spacing.2}` gap, bottom-aligned, `{spacing.top-bar-height}` tall plus `{spacing.2}` below. | Static; never scrolls or hides. |
| `chip-caption` | `METER` / `GRID` / `CLICK` above each chip, `{typography.chip-caption}`, uppercase, `ink-secondary` (6.39:1 on surface, 5.90:1 during the pulse), left-aligned to the chip, `{spacing.1}` above it. The mute toggle has none (memlog). | Static. |
| `picker-chip` | 48px pill, `{spacing.chip-padding-x}` side padding, `surface-raised` with 1px hairline outline, label shows current value ("4/4", "16ths", "Every beat"). [ASSUMPTION] 12px side padding so the longest row (`12/8` · `Triplets` · `11 of 12 beats` + mute) still fits a 343px column, verified at 375px with almost no slack; the chip label rule produces nothing longer (`15 of 16 beats` is the same width); targets stay 48px tall. See [`mockups/key-practice.html`](mockups/key-practice.html). | Pressed: `surface-pressed`. Open: outline becomes 1.5px ink. |
| `mute-toggle` | 48px round toggle, 1.5px ink outline, speaker glyph. | Sound on: outlined, speaker glyph. Muted: ink fill, `surface-raised` crossed-speaker glyph — visibly inverted so the state reads at a glance. |
| `picker-sheet` | Bottom sheet (viewport width < 768px), `surface-raised`, `{rounded.lg}` top corners, 16px padding, title in `{typography.label}`, 48px rows in `{typography.body}`, selected row marked by an ink check glyph left of the label. Section headers in `{typography.caption}` / `ink-secondary` with `{spacing.5}` above. Second levels replace the title with `sheet-back`. Action rows (`Clear all markers`) are plain ink text below a `border-hairline` divider; no red. Scrolls if taller than 70% of the viewport. Contents per sheet: EXPERIENCE.md Sheet contents. | Opens over scrim; grid stays visible above it. Level change: content swaps in place, no slide animation [ASSUMPTION: no decorative motion]. Action row disabled (`ink-disabled`) when there is nothing to clear. |
| `picker-popover` | Laptop (viewport width ≥ 768px [ASSUMPTION, memlog]) variant of `picker-sheet`: same content, 360px wide, `{rounded.md}` all corners, 1px hairline border, one soft shadow, 16px padding, anchored `{spacing.2}` below its chip and left-aligned to it, shifted to stay inside the viewport. No arrow, no scrim [ASSUMPTION: the chip's open outline already shows the anchor]. See [`mockups/key-laptop.html`](mockups/key-laptop.html). | Open / closed; open chip shows 1.5px ink outline. |

### Sheet controls

| Component | Anatomy & visual spec | States |
|---|---|---|
| `sheet-nav-row` | 48px row: label `Sounds` left in `{typography.body}`, summary right in `{typography.caption}` / `ink-secondary` (`Beep · markers off`, `Woodblock · Cowbell markers`), then a `›` chevron in ink. 1px hairline divider above. | Pressed: `surface-pressed`. Focus ring. |
| `sheet-back` | 48px `‹` glyph button left of the level title (`Sounds`, `{typography.label}`). | Pressed: `surface-pressed` circle. Focus ring. |
| `text-action` | Borderless text button in `{typography.label}` ink, 48 × 48 min target (`All`). | Disabled (`ink-disabled`) when all beats are already on. |
| `meter-preset` | 48px pill, min 64px wide, 1.5px ink outline, label in `{typography.label}`; wraps max 4 per row, `{spacing.2}` gap. Preset list: EXPERIENCE.md Sheet contents. | Selected (matches current meter): ink fill, `surface-raised` label. None selected when the meter is not in the list. |
| `number-stepper` | 48px outlined round −/+ (1.5px ink) with the value between in `{typography.label}`. | Same as `tempo-stepper`. |
| `segmented-control` | 48px pill split into equal segments, 1.5px ink outline; selected segment ink fill with `surface-raised` label in `{typography.label}`. If any label would overflow, all labels in that control drop to `{typography.caption}` size. | Selected / unselected; focus ring on the group. |
| `beat-toggle` | See [`mockups/key-click-sheet.html`](mockups/key-click-sheet.html). 44px round toggles numbered `1`…`n` in `{typography.beat-label}`, `{spacing.1}` gap, 1.5px ink outline. On: ink fill, `surface-raised` numeral. Off: `surface-raised` fill, ink numeral. Wrap rule: max 7 per row (7 × 44 + 6 × 4 = 332px fits the 343px sheet width on a 375px phone); 8–14 beats → two rows, 15–16 → three, rows balanced with the extra toggle in the top row, left-aligned [ASSUMPTION]. 44px instead of 48px so 7 fit per row [ASSUMPTION; still meets the 44pt platform minimum]. Caption `Use Mute for silence.` below the row when only one beat is on. | On / off / last-on (ink fill at 0.6 opacity, not operable) / focus ring. |

### Notices & system

| Component | Anatomy & visual spec | States |
|---|---|---|
| `hint-text` | One line, `{typography.caption}`, `{colors.ink-secondary}`, centered under the circle. | Present / absent (space reserved). |
| `undo-notice` | See [`mockups/key-grid-sheet.html`](mockups/key-grid-sheet.html). One line in the notice line: caption text in `ink-secondary` (`1 marker removed.` / `3 markers removed.`) + `Undo` text button in `{typography.label}` ink, 48px target, no box. | Visible 6s [ASSUMPTION], then removed without animation. |
| `rotate-overlay` | Full-viewport surface layer with one centered line of text in `{typography.body}`, ink. No illustration. | Shown only in phone landscape (see EXPERIENCE.md Responsive & Platform). |
| `focus-ring` | 2px ink outline, 2px offset, on every focusable control (keyboard focus only, `:focus-visible`). | — |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Keep `{colors.accent}` for markers, glow and crossing only. | Use the accent for buttons, mute state, errors or decoration. |
| Encode subdivision level by line width and length first, tone second. | Encode levels by color hue. |
| Render the BPM numeral with tabular figures in a fixed-width box. | Let digits or layout shift while the tempo changes. |
| Keep every control visible during playback (v1). | Fade, hide or animate controls in or out. |
| Keep animation tied to the audio clock: dot, tail, glow, crossing, pulse. | Add idle animations, spinners, confetti, gradients, or shadows beyond the laptop popover's. |
| Keep the pulse color at or above luminance 0.80. | Darken the pulse or flash the whole screen in ink. |
| Use a surface halo/outline wherever ink meets accent. | Rely on color alone to tell the dot from a marker. |
