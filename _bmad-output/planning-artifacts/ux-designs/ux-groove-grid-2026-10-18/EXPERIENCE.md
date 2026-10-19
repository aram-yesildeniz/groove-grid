---
name: groove-grid
status: final
created: 2026-10-18
updated: 2026-10-19
sources:
  - ../../../specs/spec-groove-grid/SPEC.md
  - ../../../specs/spec-groove-grid/ux-candidates.md
  - ../../../specs/spec-groove-grid/roadmap.md
  - ../../../brainstorming/brainstorm-groove-grid-app-2026-10-18/brainstorm-intent.md
---

# Groove Grid — Experience Spine

## Foundation

> Mockups illustrate; this document wins on conflict. Mockups: [`mockups/key-practice.html`](mockups/key-practice.html) · [`mockups/key-click-sheet.html`](mockups/key-click-sheet.html) · [`mockups/key-grid-sheet.html`](mockups/key-grid-sheet.html) · [`mockups/key-laptop.html`](mockups/key-laptop.html).

- Mobile-first installable web app (PWA), per SPEC. Phone is primary; laptop is a secondary surface with keyboard shortcuts.
- Portrait only. Light only. English only, no i18n.
- No UI framework is named in the sources; none is assumed. `DESIGN.md` is the visual reference; this document defines behavior and wins over `ux-candidates.md` where they differ.
- "Memlog" means the decision log of the UX sessions (`.memlog.md`); rules marked memlog are user decisions.
- Feel target: smooth, never flaky, instantly understandable. Every visual derives from the audio clock (SPEC Constraints).
- Scope: CAP-1..9 plus the logged v1 extras (comet tail, anticipation glow, beat-1 pulse). Controls stay visible during playback in v1.

## Information Architecture

One screen. Sheets open over it; the grid, dot and BPM stay visible behind the scrim, and playback continues while a sheet is open.

| Surface | Reached from | Purpose | CAPs | Flows |
|---|---|---|---|---|
| Practice screen ([mock](mockups/key-practice.html)) | App open | Grid, dot, markers, tempo, transport, mute | CAP-1..9 | 1, 2, 3, 4 |
| Meter sheet ([laptop mock](mockups/key-laptop.html)) | METER chip | Common meters (one tap) + beats per bar + denominator (beat unit, /4 or /8) | CAP-1 | 4 |
| Grid sheet ([mock](mockups/key-grid-sheet.html)) | GRID chip | Visible subdivision levels / triplets; Clear all markers | CAP-1, CAP-6 | 2 |
| Click sheet ([mock](mockups/key-click-sheet.html)) | CLICK chip | Click on beats + between beats; `Sounds ›` second level: click sound + marker sound | CAP-3, CAP-4, CAP-7 | 1, 2 |

Each chip carries a caption above it (`METER`, `GRID`, `CLICK`; memlog) because values like `16ths` or `Every beat` are ambiguous alone. The Click sheet also holds Marker sound [ASSUMPTION, memlog]. [ASSUMPTION] Three small sheets behind chips rather than one settings page: each chip shows its current value, so the screen stays self-explanatory without opening anything. No navigation, no menus, no about/settings page in v1 [ASSUMPTION: nothing in CAP-1..9 needs one].

## Voice and Tone

Plain, short, musician's words. No exclamation marks, no praise, no coaching.

| Do | Don't |
|---|---|
| `Start` / `Stop` | `Let's groove!` |
| `Tap` | `Tap tempo here` |
| `4/4`, `7/8`, `16ths`, `Triplets`, `Every beat`, `2 & 4`, `Beat 1 only`, `1 & 3`, `All`, `Between beats`, `None`, `Sounds`, `Beep · markers off` | `Subdivision mode: sixteenth` |
| `Tap the circle to place a marker.` | `Tip: markers help you practice!` |
| `No sound? Check the silent switch.` | `Audio error` |
| `Sound paused. Tap Start to play again.` | `AudioContext suspended` |
| `3 markers removed.` `Undo` | `Are you sure you want to delete all markers?` |

## Component Patterns

Behavioral. Visual specs in `DESIGN.md` Components (same names and groups).

### Grid layer

| Component | Behavioral rules |
|---|---|
| `grid-circle` + `grid-spoke-*` | One bar, beat 1 at 12 o'clock, clockwise. Draws spokes for the visible levels only. Redraws immediately on grid change; on meter change, redraws at the next downbeat while playing [ASSUMPTION: a mid-bar meter change has no sane dot position], immediately when stopped. It is the only marker input surface. |
| `sweep-dot` | Position = (audio time − start time) mod bar length; never accumulated. Stopped: rests on beat 1. Start: leaves beat 1 exactly with the first click. |
| `comet-tail` | Trails the dot while playing. No tail when stopped. |
| `marker` | Snaps to the finest visible subdivision (16th, or triplet in triplet mode; 8th or beat if those are the finest visible). Multiple allowed, max one per position. Editable while playing or stopped. Persisted (CAP-9). Switching between a binary level (8ths/16ths) and `Triplets` keeps markers on positions shared by both grids (the beats) and removes the rest, then shows `undo-notice`. Switching to a coarser level of the same family keeps markers that still sit on a visible line and removes the rest, same Undo [ASSUMPTION: same rule as the 16th↔triplet decision, so markers never sit off a visible line]. |
| `marker-preview` | Appears while a finger/pointer is down in the marker zone, at the snap position; commits on release. On laptop it also follows pointer hover in the marker zone. |
| `anticipation-glow` | Starts one 16th note (a quarter of a beat) before the dot reaches a marker, peaks at the hit, then hands off to the crossing indicator. |
| `crossing-indicator` | Fires at the marker's scheduled audio time (from the audio clock, not from dot proximity). Plays the marker sound at the same audio time if one is selected (mute does not affect it). |
| `beat-one-pulse` | Fires on every beat 1 while playing, including while muted (visual reference for internal time). |

### Tempo & transport

| Component | Behavioral rules |
|---|---|
| `bpm-numeral` | Always visible in every state (CAP-5). Shows the target tempo immediately on change; pending behavior: see Tempo control. Vertical drag changes tempo (see Tempo control). |
| `tempo-stepper` | Tap = ±1. Press-and-hold auto-repeats with acceleration (see Tempo control). `−` disabled at 30 BPM; `+` disabled at 250 BPM. |
| `tap-tempo-button` | Averages the last 4 tap intervals (5 taps; 2 taps minimum), rounds to integer BPM, clamps to 30–250. Sequence resets after a 2 s pause. Does not start playback. |
| `start-stop-button` | One tap starts dot + click from beat 1; one tap stops both (CAP-8). Label shows the next action. The first Start also unlocks audio. |

### Top bar & pickers

| Component | Behavioral rules |
|---|---|
| `top-bar` | Always visible; never scrolls, fades or hides (v1). |
| `chip-caption` | Static label; not focusable, part of its chip's accessible name. |
| `picker-chip` | Shows the current value under its caption (`METER` / `GRID` / `CLICK`). Tap opens its sheet (phone) or popover (laptop). The caption is part of the accessible name, not a separate stop. |
| `mute-toggle` | Silences the click only, instantly; marker sounds keep playing; dot, glow, crossing and pulse keep running. Unmute resumes in phase on the next scheduled click (CAP-4). It is the "muted" option of CAP-4 [ASSUMPTION: one-tap mute beats a sheet selection mid-practice and keeps the chosen beats and between-beats setting for unmute]. |
| `picker-sheet` | Viewport width < 768px. Opens from the bottom, closes on scrim tap, swipe-down or Esc (see Keyboard map). The Grid sheet also closes when a level is selected; the Meter and Click sheets stay open until dismissed (they hold several settings) [ASSUMPTION]. Changes apply live. Focus is trapped inside while open and returns to the chip on close. Always reopens at its main view [ASSUMPTION]. |
| `picker-popover` | Viewport width ≥ 768px [ASSUMPTION, memlog]. Same content and live-apply as `picker-sheet`, anchored under its chip. Closes on click outside or on clicking the same chip; keyboard behavior in Keyboard map. Only one open at a time (opening another chip closes the first). Focus moves to the first control inside, is trapped, and returns to the chip on close. ([mock](mockups/key-laptop.html)) |

### Sheet controls

| Component | Behavioral rules |
|---|---|
| `sheet-nav-row` | `Sounds ›` in the Click sheet/popover. Shows a live summary (`Beep · markers off`, `Woodblock · Cowbell markers`). Tap opens the second level in the same sheet; focus moves to `sheet-back`. |
| `sheet-back` | Returns to the main view; focus goes back to the `Sounds` row. `Esc` does the same. |
| `text-action` | `All` next to `Click on beats`: turns every beat on (applies on the next beat while playing). Disabled when all are on. |
| `meter-preset` | Meter sheet: one tap sets beats per bar and denominator together (`6/8` → 6, `/8`). Editing the stepper or denominator highlights the matching preset, or none. Meter change while playing applies at the next downbeat (see `grid-circle`). |
| `number-stepper` | Meter sheet: beats per bar, 1–16 [ASSUMPTION: 16 caps "any meter" at a range a circle can still show legibly]. Hold auto-repeats like the tempo stepper. |
| `segmented-control` | Single choice, applies live. As the meter denominator (`4` / `8`, visible label `Beat unit`): changes the meter label (`7/8`); beats stay equal, accent on beat 1, no compound grouping (SPEC). BPM counts the beat unit (the denominator note) [ASSUMPTION: keeps one tempo model]. Also used for `Between beats`, `Click sound`, `Marker sound`. |
| `beat-toggle` | Click sheet main view ([mock](mockups/key-click-sheet.html)), one per beat of the current meter. Tap toggles click on that beat; applies on the next beat while playing. Last enabled beat cannot be turned off. See Click on beats. |

### Notices & system

| Component | Behavioral rules |
|---|---|
| `hint-text` | Shows one message at a time. First-run marker hint until the first marker is placed; audio notices (see State Patterns) replace the first-run marker hint while shown. |
| `undo-notice` | ([mock](mockups/key-grid-sheet.html)) Appears after markers are removed in bulk (grid family switch, Clear all markers). Text `1 marker removed.` / `n markers removed.` + `Undo`. Visible 6 s, or until the next marker edit or grid/meter change, whichever comes first [ASSUMPTION: long enough to react, short enough not to linger]. Undo restores the exact previous marker set and grid level. Replaces any `hint-text` while visible. Not shown when 0 markers were removed. |
| `rotate-overlay` | Shown in phone landscape (see Responsive & Platform). Covers the page; playback unaffected; disappears on return to portrait. |
| `focus-ring` | Keyboard focus only (`:focus-visible`), never on touch. |

### Sheet contents

| Sheet | Rows |
|---|---|
| Meter | `meter-preset` `2/4` · `3/4` · `4/4` · `5/4` · `6/8` · `7/8` · `12/8` [ASSUMPTION set, memlog] · section `Other`: `number-stepper` beats per bar (1–16) + `segmented-control` `Beat unit` `4` / `8`; chip shows `n/d` |
| Grid | `Beats` · `8ths` · `16ths` · `Triplets` (single choice = finest visible level; `8ths` shows beats + 8ths, `Triplets` shows beats + triplets) · divider · `Clear all markers` (action row, disabled with no markers; removes all, closes sheet, shows `undo-notice`). [ASSUMPTION] Single choice "finest level" instead of per-level toggles: covers every useful configuration of CAP-1 with one tap and no invalid combos. [ASSUMPTION] Level names are relative to the beat (`8ths` = beat ÷ 2, `16ths` = beat ÷ 4) in /8 meters too, so one naming works for both denominators (same for `Between beats`). [ASSUMPTION] `Clear all markers` uses Undo rather than a confirmation dialog, consistent with the grid-switch Undo. |
| Click | **Main view (Beats first, memlog):** `Click on beats` header + `All` action, `beat-toggle` row (one per beat; this row is the pattern, no preset segments); `Between beats` `segmented-control` `None` · `8ths` · `16ths` · `Triplets` (independent of the visible grid); `Sounds ›` row with summary. **Sounds level:** `Click sound` `Beep` · `Woodblock` · `Stick` · `Hi-hat` (each with a brighter/higher beat-1 variant, SPEC accent on beat 1) [ASSUMPTION names, memlog; final samples chosen at build]; `Marker sound` `Off` · `Clap` · `Cowbell` · `Conga`. Mute stays the separate toggle. |

### Defaults

| Setting | Default |
|---|---|
| Tempo | 80 BPM [ASSUMPTION: a common practice start point] |
| Meter | 4/4 [ASSUMPTION] |
| Grid | `16ths` [ASSUMPTION] |
| Click on beats | All beats on (`Every beat`) (memlog) |
| Between beats | `None` (memlog) |
| Click sound | `Beep` (memlog) |
| Marker sound | `Off` [ASSUMPTION] |
| Markers | None [ASSUMPTION] |
| Mute | Sound on [ASSUMPTION] |

### Click on beats

| Rule | Behavior |
|---|---|
| Toggles | One `beat-toggle` per beat (1…n), any combination. `All` turns every beat on. No preset segments (memlog). |
| Last beat | The last enabled beat cannot be turned off: its toggle is `aria-disabled` and a caption under the row reads `Use Mute for silence.` (memlog). |
| Between beats | Between-beat clicks sound only inside enabled beats (memlog). |
| Accent | Beat-1 variant only when beat 1 is on (memlog); otherwise all enabled beats use the normal variant. |
| Meter change | Toggles for beats that still exist are kept. When the meter gains beats, new beats are on if every previous beat was on; otherwise off [ASSUMPTION: replaces the old "named preset re-applies" rule now that presets are gone; keeps `Every beat` intact across meters]. |
| While playing | Changes apply on the next beat (memlog). |
| Chip label | All on → `Every beat`; only beat 1 → `Beat 1 only`; a single other beat → `Beat n only` (`Beat 3 only`); two or three beats on → the list (`2 & 4`, `1 & 3`, `1, 2 & 4`); more than three but not all → `n of m beats` (`5 of 7 beats`) [ASSUMPTION: replaces `Custom`, which no longer exists in the UI]. Between beats is not shown on the chip, only in its accessible name. |

### Sound rules

| Rule | Behavior |
|---|---|
| Accent levels | Beat 1 uses the beat-1 variant (brighter/higher); other beats use the normal variant; between-beat clicks (`8ths` / `16ths` / `Triplets`) play the normal variant, softer. Loudness order: beat 1 > other beats > between-beat clicks [ASSUMPTION, memlog]. |
| Preview | Selecting a click sound while stopped plays the beat-1 variant then the normal variant once, 300 ms apart [ASSUMPTION: both variants are what the user is choosing]. Selecting a marker sound while stopped plays it once [ASSUMPTION: same convention]. Previews play even when muted (explicit action). While playing: no preview; the new sound takes over on the next beat (click) or next marker (marker sound). |
| Distinctness | Marker sounds must stay audibly distinct from every click sound, both variants. Marker list renamed from `Wood · Rim · Bell` to `Clap · Cowbell · Conga` because `Wood` collided with `Woodblock` and `Rim` with `Stick` [ASSUMPTION names; final samples chosen at build, tested against all four clicks]. |
| Not in v1 | Per-beat accent editor; in-app volume slider (device volume only). |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| First launch | Practice ([mock](mockups/key-practice.html), right) | Defaults loaded, stopped, dot on beat 1. `hint-text`: `Tap the circle to place a marker.` until the first marker exists. No onboarding, no splash, no account. |
| Restored settings | Practice | Tempo, meter, grid, click sound, click-on-beats toggles, between beats, mute state, markers and marker sound restored from device storage (CAP-9), stopped. No "restored" message. Every change is saved immediately. |
| Stopped | Practice | Dot on beat 1, no tail, no pulse. All controls enabled. `Start` label. |
| Playing | Practice | Dot sweeps, tail, glow, crossings, beat-1 pulse. All controls stay visible and usable. `Stop` label. |
| Tempo pending | Practice (playing) | See Tempo control, "While playing". |
| Markers removed | Practice ([mock](mockups/key-grid-sheet.html), right) | `undo-notice` in the notice line for 6 s; Undo restores. |
| Muted | Practice | `mute-toggle` inverted (ink fill). Visuals unchanged. If launched muted (restored), the toggle shows it; nothing else warns. |
| Audio locked (needs unlock) | Practice | Browsers need a gesture; the Start tap is that gesture. If the audio context fails to resume, stay stopped and show `hint-text`: `Sound paused. Tap Start to play again.` |
| Interrupted (call, other app took audio) | Practice | Stop playback, show the same `Sound paused…` hint. Never auto-resume. |
| App backgrounded / screen locked | Practice | Stop playback when the page becomes hidden (memlog: no background or screen-off playback in v1). Return shows stopped state with the dot on beat 1. |
| iOS silent switch | Practice | Request playback audio session (`navigator.audioSession.type = 'playback'`) where supported so the switch does not mute clicks. Where unsupported, on iOS show `No sound? Check the silent switch.` on the first Start after install, once ever [ASSUMPTION: the switch cannot be detected, so a one-time hint is the least noisy option]. |
| Screen wake lock | Practice | Request a screen wake lock on Start, release on Stop; re-request when the page becomes visible again while playing. If unsupported or denied, do nothing visible [ASSUMPTION: a warning would be noise; most sessions keep touching the screen]. |
| Sheet open | Any sheet | Playback continues; scrim over controls, grid visible above sheet. |
| Offline | Practice | Fully functional after first load; no offline banner. |
| Update available | Practice | New version applies on next launch, never mid-session; no prompt [ASSUMPTION: avoids interrupting practice]. |
| Landscape (phone) | Practice | See Responsive & Platform. |
| Storage unavailable (private mode) | Practice | Works with defaults; settings just don't persist. No message. |

## Interaction Primitives

### Tempo control

| Input | Effect |
|---|---|
| Tap `−` / `+` | ±1 BPM |
| Hold `−` / `+` | After 400 ms, repeat ±1 at 8/s, accelerating to 20/s once held for 1.5 s (measured from press) [ASSUMPTION: values tuned for 30→250 in under ~12 s] |
| Vertical drag on BPM numeral | Up = faster, 1 BPM per 6 px of travel [ASSUMPTION], live numeral update, clamps at limits. 8 px threshold before drag starts |
| `Tap` button | See `tap-tempo-button` |
| Range | 30–250 BPM, integers only. `−` disabled at 30 BPM; `+` disabled at 250 BPM |
| While playing | Any tempo change (stepper, drag, tap, keys) applies on the next beat (memlog override; was next downbeat). Until then (at most one beat, 2 s at 30 BPM) the numeral shows the new value in `{colors.ink-secondary}`, then `{colors.ink}`; dragging while playing shows the same pending color. Rapid changes within one beat collapse to the latest value. Dot position stays continuous across the switch. Stopped: changes apply immediately and the numeral stays ink. |

Rejected (memlog): slider, jog-wheel on the circle.

### Marker placement (CAP-6)

Marker zone = annulus around the ring, from 40px inside to 24px outside the ring [ASSUMPTION: big enough for a thumb, keeps the circle center free].

| Gesture | Result |
|---|---|
| Tap empty position in zone | Place marker at nearest snap position (preview while finger is down, commit on release) |
| Tap existing marker | Remove it |
| Press marker + drag (> 8 px) | Move; preview snaps along the ring; release commits. Dropping onto an occupied position clears the dragged marker's original position; one marker remains at the target |
| Tap outside zone | Nothing |

Snap uses the nearest angular subdivision, so even at 16 beats × 16ths (64 positions) placement is deterministic and the preview shows exactly where it lands. [ASSUMPTION] Gesture set taken from the unconfirmed `ux-candidates.md` entry ("tap to place, drag to move, tap to remove"), adopted because it gives one obvious gesture each.

### Keyboard map (laptop)

| Key | Action |
|---|---|
| `Space` | Start / stop, except when focus is on a chip or button, or inside a sheet or popover |
| `←` / `→` | Tempo −1 / +1 |
| `Shift+←` / `Shift+→` | Tempo −5 / +5 |
| `T` | Tap tempo |
| `M` | Toggle click mute [ASSUMPTION] |
| `Ctrl/Cmd+Z` | Undo while `undo-notice` is visible [ASSUMPTION] |
| `Tab` / `Shift+Tab` | Move focus: chips → mute → grid → `−` → BPM → `+` → Tap → Start |
| Grid focused: `←` / `→` | Move a marker cursor between snap positions (replaces tempo keys while grid has focus) |
| Grid focused: `Enter` | Toggle marker at cursor (place or remove). To move a marker, remove it, then place it at the new position |
| Chip focused: `Enter` / `Space` | Open its sheet (phone) or popover (laptop) |
| Sheet/popover open: `Tab` / `Shift+Tab`, arrows, `Space`/`Enter` | Move between sections; arrows move within a segmented or preset group; `Space`/`Enter` toggles a focused `beat-toggle`, activates `All`, or opens `Sounds`. Global shortcuts (`Space`, arrows, `T`, `M`) are suspended while focus is inside; playback continues |
| `Esc` | On a second level (Sounds): back to the main view. In a sheet or popover main view: close it, focus returns to the chip. With the grid focused: focus moves to Start |

Banned: long-press menus, double-tap actions, swipe gestures on the practice screen, pinch-zoom, haptics (SPEC non-goal), auto-hiding controls (v1).

## Accessibility Floor

Behavioral. Contrast values live in `DESIGN.md` Colors.

- **Reduced motion** (`prefers-reduced-motion: reduce`), the single source for motion behavior: the dot still sweeps (it is the product). Comet tail off. Anticipation glow off. Beat-1 pulse off. Crossing indicator: no expanding ring; instead a static 3px accent ring for 150 ms.
- **Touch targets:** ≥ `{spacing.target-min}` (48px) for every control; tempo steppers, Tap and Start at `{spacing.control-lg}` (56px); beat toggles 44px (see `DESIGN.md`). Markers use a 24px hit radius plus nearest-snap.
- **Screen readers:**

| Element | Role | Accessible name / value | Announcement |
|---|---|---|---|
| Grid canvas | `img` | `Grid: 4/4, 16ths, 3 markers: 1, and of 2, a of 3`, updated on change | Beats are never announced |
| BPM numeral | `spinbutton` | `Tempo`, value `120 BPM`, min 30, max 250; arrow keys adjust | Value change, politely, after 500 ms of no change |
| Start/stop | `button` | The action (`Start` / `Stop`) | — |
| Mute | toggle `button`, `aria-pressed` | `Mute click` (marker sounds unaffected) | State |
| Chips | `button` | `Meter: 4/4`, `Grid: 16ths`, `Click: Beep, 1 & 3, between beats none` | — |
| Sheets / popovers | `dialog` (phone sheets `aria-modal`) | Popovers labeled by their chip caption | — |
| Segmented controls | `radiogroup` | `Between beats`, `Click sound`, `Marker sound`, `Beat unit` (visible label matches); options by name | Name + checked state (`Woodblock, selected`); previews are not announced |
| Meter presets | `radiogroup` | `Common meters`; none checked when the meter is not listed | Name + checked state |
| `All` | `button` | `Click on all beats` | — |
| Beat toggles | toggle `button`, `aria-pressed` | `Click on beat 3`; the last enabled one is `aria-disabled` with description `Use Mute for silence.` | State |
| Sounds row | `button` | `Sounds: Woodblock, Cowbell markers` | When activated, it announces the `Sounds` level |
| `sheet-back` | `button` | `Back to Click` | — |
| Hints, `undo-notice` | polite live region | `3 markers removed. Undo available.`; Undo is a real button, reachable by Tab | Focus is not moved to Undo automatically |
| `rotate-overlay` | `status` (polite) | Its text | On show |

- **Keyboard:** everything reachable and operable; visible `{components.focus-ring}`; sheets and popovers trap focus and restore it on close; grid markers editable via the cursor described in Keyboard map.
- **Color independence:** markers differ from lines by shape; mute state differs by fill inversion and glyph, not color.
- **Flash safety:** beat-1 pulse stays within `DESIGN.md` luminance rule.
- **Text zoom:** layout survives 200% browser zoom on laptop; on phone the BPM numeral is already large, other text must wrap rather than truncate.

## Key Flows

Protagonist: **Aram**, bassist, wants to play in the pocket and strengthen his feel for time. Uses Groove Grid every practice session, 10–45 min, phone on the music stand.

### Flow 1 — First session

1. Aram opens the link on his phone. The practice screen appears at once ([mock](mockups/key-practice.html), right): cream page, black circle, `80 BPM`, METER `4/4` · GRID `16ths` · CLICK `Every beat`, `Start`. Hint: `Tap the circle to place a marker.`
2. He taps `+` and holds; the numeral climbs and he lets go at 92.
3. He taps `Start`. Audio unlocks on that tap; on iOS without audio-session support he sees `No sound? Check the silent switch.` once.
4. The click lands; beat 1 is higher; the dot leaves 12 o'clock with the first click and sweeps the circle.
5. The beep feels thin, so he opens the CLICK chip, taps `Sounds ›` and taps `Woodblock`; no preview while playing, it takes over on the next beat with beat 1 still brighter. He closes the sheet, plays a root-note line and watches the dot in the corner of his eye.
6. **Climax:** after a few bars the dot crosses 12 o'clock exactly as the high click sounds and his note lands with it — he sees and hears the bar close as one.
7. He taps `Stop`. Dot returns to beat 1. Next launch restores 92 BPM.

Failure: audio fails to resume → stays stopped, `Sound paused. Tap Start to play again.`

### Flow 2 — Daily practice: markers on the 16th grid, then muted

1. Aram opens the app; his last settings (92 BPM, 4/4, 16ths, Every beat) are restored, stopped.
2. He taps the circle on beat 1, the `a` of 2 and the `e` of 4; a preview disc follows his thumb and each marker snaps onto a 16th spoke.
3. He opens the CLICK chip, taps `Sounds ›` and chooses Marker sound `Cowbell`; it previews once, clearly apart from the Beep click. He closes the sheet.
4. `Start`. Glow builds before each marker; the cowbell and crossing ring fire on the hit. He plays the syncopation against them.
5. After a few minutes he opens the CLICK chip and turns beats 2 and 4 off ([mock](mockups/key-click-sheet.html)); the chip reads `1 & 3`. Half-time feel from the click, from the next beat. He closes the sheet. Later he taps the mute toggle. The click goes silent; the cowbell on his markers keeps sounding; dot, glow, crossings and beat-1 pulse keep going. The toggle is inverted (ink).
6. He keeps playing for eight bars with only his marker cowbells, counting the beat internally.
7. **Climax:** he taps mute again; the click returns in phase on the next scheduled click and his note is right on it — he held time.
8. He drags the `e` of 4 marker to the `&` of 4 while playing; it snaps and keeps firing.
9. He switches the grid to `Triplets` to try a shuffle feel; the beat-1 marker stays, the two off-beat markers are removed and `2 markers removed.` `Undo` appears ([mock](mockups/key-grid-sheet.html)). He taps `Undo`; the 16th grid and both markers return.
10. `Stop`. Markers persist for tomorrow.

Failure: phone locks or he switches apps → playback stops; returning shows stopped state with everything intact. Wake lock normally prevents the lock while playing.

### Flow 3 — Changing tempo mid-session

1. Aram is playing at 92 and feels ready for faster.
2. He taps `+` three times. The numeral shows `95`, grey for at most one beat.
3. On the next beat the click and dot switch to 95; the numeral turns ink.
4. Later he wants to match a song: he taps `Tap` five times along with the record; the numeral shows `104`, applied on the next beat.
5. For a big jump he drags the numeral down to 70 to work slowly; while he drags, each new value takes over on the next beat.
6. **Climax:** each change lands on a beat — no stutter, no skipped or doubled click, the dot never jumps, the groove never breaks.
7. On his laptop the same flow is `→` ×3 (95), `T` ×5 (104), then `Shift+←` ×6 and `←` ×4 (70).

Failure: tap sequence with one tap only → no change; pause > 2 s resets the sequence. `−` disables at 30 BPM; `+` disables at 250 BPM.

### Flow 4 — Aram learns a song in 6/8

Context [ASSUMPTION]: his band is adding a slow 6/8 ballad; he wants the six-beat feel before rehearsal.

1. Aram opens the app; last settings (92 BPM, 4/4, 16ths, Every beat) restored, stopped.
2. He taps the METER chip. The Meter sheet ([laptop mock](mockups/key-laptop.html)) shows the common meters with `4/4` highlighted.
3. He taps `6/8`. The pill fills; under `Other` the stepper shows `6` and `8` is selected. The chip reads `6/8`; the circle redraws with six beat spokes. The CLICK chip still reads `Every beat` (all six on, carry-over rule).
4. He closes the sheet and taps `Tap` along with the recording; the numeral settles at `66`.
5. `Start`. The high click on 1 and five normal clicks go round the six-beat circle.
6. He opens CLICK and turns beats 2, 3, 5, 6 off; the chip reads `1 & 4` — the two big pulses of the ballad.
7. **Climax:** the dot crosses 12 o'clock with the high click and his low note lands with it; the 6/8 sway is now something he feels, not counts.

Failure: he changes meter while playing → the grid and click switch at the next downbeat, never mid-bar. Meters outside the list (e.g. 9/8) use the stepper + `8`; no preset is highlighted.

## Inspiration & Anti-patterns

- **Lifted — meditation apps:** one focus object on a calm page, nothing competing (brainstorm: "focus/flow like a meditation app").
- **Lifted — "a good old Casio":** stability is the feature. Instant start, no loading, no surprises, same behavior every time.
- **Lifted — common metronome pattern (memlog research):** coarse + fine + tap tempo with the numeric BPM always visible.
- **Rejected — gimmicks:** no extra lights, sounds, animations or features beyond CAP-1..9 and the three logged extras.
- **Rejected — ads, accounts, upsells, streaks, gamification on the practice screen:** free, open source, no ads (memlog); progress features live elsewhere later (SPEC).
- **Rejected — slider and jog wheel for tempo** (memlog).
- **Rejected — fading controls in v1** (memlog; possible later).
- **Later, not v1:** exercises / saved presets (e.g. one intention per session) belong to the roadmap; v1 has no exercise-setup journey.

## Responsive & Platform

| Context | Behavior |
|---|---|
| Phone portrait (primary) | Layout per `DESIGN.md` Layout & Spacing; safe-area insets respected. |
| Phone landscape | PWA manifest locks portrait when installed. In a browser tab, if the viewport is landscape and under 560px tall (too short for the 260px minimum circle), show `rotate-overlay` with `Turn your phone upright.`; playback is unaffected [ASSUMPTION: browsers cannot lock orientation in a tab and the circle cannot fit]. |
| Laptop / desktop (viewport width ≥ 768px) | Same column centered, max `{spacing.column-max}`; sheets become `{components.picker-popover}` under their chip; keyboard map active; `{components.marker-preview}` follows pointer hover (see `marker-preview`). ([mock](mockups/key-laptop.html)) |
| Tablet | Follows the 768px rule: tablets with viewport width ≥ 768px get popovers; no dedicated layout. |
| PWA install | Manifest: name `Groove Grid`, `display: standalone`, `orientation: portrait`, theme/background `{colors.surface}`. No custom install prompt; browser default only [ASSUMPTION: an install nag is a gimmick]. |
| Offline | Service worker precaches the app shell and click/marker sounds; after first visit the app works fully offline. |
| Audio output | Device volume only; no in-app volume [ASSUMPTION: one less control]. No latency compensation (SPEC non-goal). |

## Upstream follow-ups

No open UX questions remain. These SPEC updates were applied on 2026-10-19:

- **CAP-4:** the per-beat click model (click on any combination of beats + a separate between-beats click incl. `8ths`) replaces and extends CAP-4's fixed list (every beat, every 16th, every triplet, 2 & 4, beat 1 only, muted — all still reachable).
- **CAP-3:** a selectable click sound (4 sounds, beat-1 variant each) extends "a classic metronome click".
- **CAP-6/CAP-7:** need notes on marker clearing and Undo.
