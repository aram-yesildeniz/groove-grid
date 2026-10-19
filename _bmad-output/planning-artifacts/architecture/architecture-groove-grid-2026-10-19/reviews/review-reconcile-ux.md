---
type: review
lens: reconcile-ux
target: ../ARCHITECTURE-SPINE.md
against:
  - ../../../ux-designs/ux-groove-grid-2026-10-18/EXPERIENCE.md
  - ../../../ux-designs/ux-groove-grid-2026-10-18/DESIGN.md
created: '2026-10-19'
---

# Reconcile review: Architecture Spine vs UX (EXPERIENCE.md, DESIGN.md)

## Verdict

**Revise before stories.** The spine's paradigm (pure timing core, single rAF, audio clock as timebase, snapshot port) fits the UX well, and most platform states (offline, storage unavailable, stop on hidden, SW update on next launch, wake lock owner, mute as click-bus gain) are covered correctly. But there are **3 direct contradictions** with UX (preview before first Start, render layer order / page-wide pulse, hidden-vs-interrupted notice) and **several seams two builders would fill incompatibly** (pending semantics, stopped-vs-playing apply, UI-to-render input state and hit-testing, notice-line ownership, undo lifecycle, non-settings persisted flags).

Severity: **High** = contradicts UX or will produce visibly different behavior between stories; **Medium** = underspecified seam likely to diverge; **Low** = clarification.

---

## High

### H1 — Previews before the first Start are impossible under AD-8
- **UX:** Sound rules: selecting a click/marker sound *while stopped* previews it (click: beat-1 variant then normal, 300 ms apart); previews play even when muted. Flow 2 step 3: user picks `Cowbell` while stopped on a fresh launch and hears it.
- **Spine:** AD-8 "`resume()` happens only inside the Start gesture"; AD-11 sample bank decoded "before the first Start can play". On a fresh launch with no Start yet, there is no running context, so `preview()` is silent (or a builder creates a second context, violating AD-8).
- **Fix:** AD-8: "The context is created/resumed inside any user gesture that requests sound: Start **or** a preview selection." Keep the single owner. Define `preview()` as no-op if decode not yet complete (or queue until decoded).

### H2 — Preview routing vs mute, and who blocks previews while playing
- **UX:** Previews play even when muted; no preview while playing; click preview = accent then normal 300 ms apart.
- **Spine:** AD-7 mute = click-bus gain 0; AD-5 `preview(soundId)` with no bus or gating rule. A builder routing preview through the click bus makes it silent when muted; another gates "not while playing" in the UI, another in the engine.
- **Fix:** AD-7/AD-5: "Previews go through a third **preview bus** (or directly to destination), never through the click bus. The engine ignores `preview()` while `status === 'playing'`. A click-sound preview schedules accent at `now + ε` and normal at `+0.300 s` in audio time." Also clarify `preview(soundId)` disambiguates click vs marker ids (ids are disjoint today; state it).

### H3 — Render layer order contradicts DESIGN, and the beat-1 pulse is a page-wide background, not a canvas layer
- **DESIGN** (Elevation & Depth) draw order bottom to top: 1 beat-1 pulse (**page background**), 2 spokes, 3 ring, 4 beat labels, 5 anticipation glow, 6 markers, 7 comet tail, 8 dot, 9 crossing. `beat-one-pulse`: "Whole page background jumps to surface-pulse"; the contrast table checks chip captions etc. "during the pulse", i.e. the whole page including top bar and controls.
- **Spine AD-9:** `grid → markers → marker-preview → anticipation-glow → comet-tail → dot → crossing → beat-one-pulse` — glow drawn **over** markers and pulse drawn **last** (would wash over everything) and, as a canvas layer, it can only tint the canvas rectangle, not the page.
- **Fix:** Reorder AD-9 to DESIGN: `grid (spokes, ring, beat labels; cached) → anticipation-glow → markers → marker-preview → comet-tail → dot → crossing` (+ keyboard cursor, see M4). Move the pulse out of the canvas: "The render loop, from the same `Frame`, sets one CSS custom property (e.g. `--surface-now`) on the document root; `body` background uses it. Render is the only writer of that property. It interpolates only between `surface-pulse` and `surface` (luminance ≥ 0.80, DESIGN flash rule) and writes only when the value changes." This keeps AD-1 (clock-derived) while honoring page-wide scope.

### H4 — "Page hidden" and "interrupted" collapse into one status, but UX treats them differently
- **UX:** Interrupted (call/other app) → stop + `Sound paused. Tap Start to play again.` App backgrounded/screen locked → stop; "return shows stopped state with the dot on beat 1" (no hint; Flow 2 failure: "everything intact"). Audio fails to resume → stay stopped + same hint.
- **Spine AD-8:** hidden, `interrupted`, `suspended` all → `paused-by-system`. The UI will show the `Sound paused…` hint after every app switch (or a builder special-cases it ad hoc).
- **Fix:** Either map page-hidden to plain `stopped`, or make status carry a reason: `{ status: 'paused-by-system', reason: 'hidden' | 'interrupted' | 'resume-failed' | 'clock-frozen' }` and state the hint mapping in the spine: hint for all reasons except `hidden`. Hint clears on next successful Start.

### H5 — Pending semantics are a single snapshot, but UX has per-setting boundaries and a tempo-only grey numeral
- **UX:** Numeral shows the target tempo immediately, grey (`ink-secondary`) until it applies on the next beat, then ink; rapid changes within one beat collapse to the latest; dragging while playing shows the same pending color. Stopped: applies immediately, numeral stays ink. Meter applies at the next **downbeat**; beat toggles/between-beats next beat; mute instant.
- **Spine AD-5/AD-6:** `pending: { settings, atTime } | null` — one atTime for the whole snapshot. If tempo (next beat) and meter (next downbeat) are both pending, one `atTime` cannot describe both; whether the numeral greys depends on how a builder compares `pending.settings.bpm` against what. `withSettings` doesn't say a new call **replaces** a not-yet-active pending segment (collapse) instead of appending another. Nothing says stopped = immediate.
- **Fix:** In AD-5/AD-6:
  1. `withSettings` drops any timeline segments starting after `committedUntil` before inserting the new one(s) — rapid changes collapse.
  2. `pending` becomes per-concern: `pending: { bpm?: {value, atTime}, meter?: {value, atTime}, clickPlan?: {atTime} } | null`, or define "the numeral is grey iff `pending?.bpm` exists". Name the exact rule.
  3. "While `status !== 'playing'`, `apply()` rebuilds the timeline immediately and `pending` is `null`."
  4. Note the honest bound: with ~100 ms lookahead the change lands at the first beat after `now + lookahead`, which at 250 BPM can be > one beat away; UX says "at most one beat". Either accept and tell UX, or keep lookahead below the shortest beat at 250 BPM minus margin (constant check in `constants.ts`).

---

## Medium

### M1 — Grid drawing source: store settings vs active timeline segment
- **UX:** grid level change redraws immediately; meter change redraws at the next downbeat while playing, immediately when stopped. Markers editable live.
- **Spine AD-9:** grid layer "redrawn only on settings or size change" — if keyed on the **store**, a pending meter change redraws the circle mid-bar while the dot is still in the old bar (contradicts UX and AD-6).
- **Fix:** "Grid layer cache key = meter of the timeline segment active at frame `t` + current grid level + size + devicePixelRatio." Say whether markers render from store (immediate) or timeline — recommend store for markers/grid level (UX says immediate), timeline for meter and dot.

### M2 — Marker events and the beat-1 pulse must be independent of sound and click plan
- **UX:** crossing fires at the marker's scheduled time regardless of marker sound (marker sound may be `Off`); beat-1 pulse fires on every beat 1 while playing, including muted — and, by implication, even when beat 1's click toggle is off.
- **Spine:** `eventsBetween` returns "clicks, marker hits, beat-1s" but doesn't say marker hits exist when `markerSound === null`, nor that beat-1 events exist when beat 1 isn't clicked. A core author optimizing the click plan would drop them.
- **Fix:** AD-2: "`eventsBetween` always emits a `bar-start` event per downbeat and a `marker` event per marker per bar, independent of click toggles, mute and marker sound; the engine filters what it schedules (no node for `markerSound === null`)."

### M3 — Visual effect windows (glow lead, crossing/pulse tails) not defined in time
- **UX/DESIGN:** glow starts one 16th (quarter beat) before the hit and peaks at it; crossing lasts 220 ms (150 ms static under reduced motion); pulse decays 180 ms ease-out from beat 1.
- **Spine AD-9** says derived from `t` but not how far back/forward the renderer queries. Glow lead "one 16th" across a tempo change is ambiguous (ticks vs seconds).
- **Fix:** AD-9: "Each frame queries `eventsBetween(t − maxDecay, t + maxLead)`. Glow lead is **240 ticks** converted through the timeline (so it follows the tempo in force at the marker); decays are fixed audio-seconds constants (0.220, 0.150, 0.180) in render constants." Also: "For `t < startTime` the dot is held at tick 0" so the dot leaves beat 1 exactly with the first click (EXPERIENCE `sweep-dot`).

### M4 — UI-owned visual state has no path into render; hit-testing conflicts with AD-3
- **UX:** marker-preview follows the finger / laptop hover at the snap position; dragged marker follows finger; keyboard grid cursor moves between snap positions (needs a visible cursor); marker zone = annulus 40 px inside to 24 px outside the ring; 24 px hit radius.
- **Spine:** layers are stateless `(ctx, frame)`; `Frame` comes only from `ClockReader`. Nothing carries preview tick, drag source, keyboard cursor, or reduced motion changes from UI. AD-3 says only `render` converts ticks↔angles, yet pointer→tick (hit-testing) is needed by UI. Two builders will either duplicate geometry in `ui` (breaking AD-3) or invent different ports. Layer list also lacks a keyboard-cursor layer.
- **Fix:** Add to `src/render/port.ts`: `setInteraction({ previewTick?, draggingFromTick?, cursorTick?, focused })` (merged into `Frame`), and `hitTest(x, y): { inZone, nearestFraction, markerTickUnder? }`; snapping itself stays in core (`snap(fraction, meter, grid) → tick`). Add `marker-cursor` (keyboard) to the layer list.

### M5 — Marker drag commit semantics
- **UX:** drag > 8 px moves; preview snaps; release commits; dropping onto an occupied position leaves one marker at target. Flow 2: dragging while playing, "it snaps and keeps firing".
- **Spine:** silent on whether the store changes during drag (marker would hop through many positions and be persisted/scheduled at each) or only on release; whether the original keeps firing during the drag.
- **Fix:** AD-4: "Drag is UI-local until release; one atomic `moveMarker(fromTick, toTick)` action on release (dedupes on collision). During the drag the marker still sounds and is drawn at its original tick (dimmed optional), preview at the target." Same for BPM drag: OK to call `setTempo` per step (collapse rule H5 handles it), but persistence should debounce/coalesce writes (AD-10 "every store change" at drag rate).

### M6 — Undo lifecycle and scope are not owned
- **UX:** `undo-notice` after bulk removal (grid family switch, coarser grid, Clear all; meter shrink per Open Question); visible 6 s **or** until next marker edit or grid/meter change; Undo restores exact previous markers **and grid level**; not shown when 0 removed; `Ctrl/Cmd+Z` only while visible; replaces any hint.
- **Spine AD-4:** keeps previous `{markers, grid}`. Missing: who expires it (6 s timer, invalidation on next edit), that restoring grid must not itself trigger another bulk removal, that a meter-shrink undo needs **meter and clickBeats** too, and whether the undo slot is persisted (should not be).
- **Fix:** AD-4: "The store holds `undo: { previous: {markers, grid, meter?, clickBeats?}, removedCount } | null`, cleared by any marker/grid/meter action and by a 6 s UI timer (wall-clock timers are allowed for UI, not sound — see L2). `undo()` restores atomically and bypasses the removal rule. `undo` is not persisted. No undo when `removedCount === 0`." Resolve the meter-shrink Open Question with UX and include meter in the snapshot if confirmed.

### M7 — Notice line has no owner; priority and first-run hint semantics undefined
- **UX:** one message at a time in the notice line: `undo-notice` > audio notices (`Sound paused…`, `No sound? Check the silent switch.`) > first-run hint `Tap the circle to place a marker.` (shown "until the first marker is placed"). Polite live region, focus never moved.
- **Spine:** nothing. Three stories (markers, engine lifecycle, iOS) will each write the notice line.
- **Fix:** Add a convention: "One derived `notice` in `src/ui/` (pure function of store + engine status + flags) picks the single message by fixed priority; components never write the notice line directly." Decide first-run hint: derived from `markers.length === 0` (returns after Clear all) or a persisted "has placed a marker" flag (EXPERIENCE: "until the first marker is placed" reads as once). Pick one.

### M8 — Persisted non-settings flags vs "one key" rule
- **UX:** iOS silent-switch hint "on the first Start after install, once ever" (only when `navigator.audioSession` is unsupported on iOS); possibly a first-run-hint flag (M7).
- **Spine AD-10:** persistence is "one versioned key" `groove-grid:settings` holding `Settings`. A flag is not a user setting; builders will either add it to `Settings` (pollutes snapshot sent to engine, AD-5) or create an unversioned ad-hoc key.
- **Fix:** AD-10: add `groove-grid:flags` `{ v: 1, silentHintShown: boolean, ... }` through the same try/catch adapter (storage unavailable → hint may repeat; acceptable), or nest `{ v, settings, flags }` under the one key. State the iOS detection rule (iOS UA/platform + no `audioSession`) in one module.

---

## Low

- **L1 — Mute's place in Settings and AD-6.** Mute is restored (CAP-9) so it is in `Settings` and travels in `apply()`. AD-6 doesn't list it; AD-7 says instant. Add mute explicitly to AD-6 as "immediate (gain change at `currentTime`, short ramp ~5 ms to avoid clicks)". Note the consequence: unmute makes already-scheduled clicks in the lookahead audible, which matches "resumes on the next scheduled click".
- **L2 — AD-1 wording vs UI timing.** Tap tempo (interval averaging, 2 s reset), hold-to-repeat (400 ms, 8/s→20/s), undo 6 s, SR announce debounce 500 ms, tap button 80 ms press state all legitimately use event timestamps / `setTimeout`. AD-1 bans `setTimeout`/`performance.now()` broadly; add "UI input and notice timing may use wall-clock; they never decide when a sound plays or where the dot is". Put the tap-tempo averaging (last 4 intervals, ≥ 2 taps, round, clamp) as a pure function in `core` so it's testable.
- **L3 — Wake lock re-request is dead code given stop-on-hidden.** UX says re-request on visible while playing; AD-8 stops on hidden, so playback never survives hidden. Harmless; note in spine that the wake-lock module releases on any non-`playing` status and needs no visibility handler (or keep for browsers that release the lock without hiding the page).
- **L4 — Reduced motion source and live changes.** AD-9 reads it in render; DESIGN pulse is now DOM (H3) and is also off under reduced motion. Say render subscribes to `matchMedia(...).change` so toggling the OS setting mid-session takes effect without reload.
- **L5 — Screen-reader grid name needs a tick→musical-name function.** `Grid: 4/4, 16ths, 3 markers: 1, and of 2, a of 3` requires naming positions (`e`, `and`, `a`, triplet names). Put `positionName(tick, meter, grid)` in `core` so the a11y label and any future UI agree; "beats are never announced" means no live region tied to the render loop.
- **L6 — Canvas DPR and the 260 px minimum.** Cache invalidation should include `devicePixelRatio`; the landscape/`rotate-overlay` threshold (landscape and < 560 px tall) is UI-only, but the render must tolerate being covered (keep running; playback unaffected).
- **L7 — Keyboard routing owner.** Global shortcuts are suspended inside sheets/popovers, `Space` excluded on focused buttons/chips, arrows retargeted when the grid has focus. Name one key-dispatch module in `src/ui/` to avoid per-component listeners fighting.
- **L8 — Meter change removes markers immediately but applies audibly at the next downbeat.** If meter shrink removes markers (Open Question), the removal happens in the store immediately while the old, longer bar is still playing; removed markers stop sounding before the bar switches. Acceptable, but state it so the timeline doesn't try to keep old markers until the downbeat.
- **L9 — Marker placed inside the committed horizon.** A marker added < lookahead ahead of the dot won't sound this bar (AD-6) but the renderer, querying the current timeline, would show a crossing. Either accept (rare, ≤ 100 ms) or have render use the engine's committed event list for times < `committedUntil`. State the choice.

## Covered correctly (no action)

Offline precache of shell + sounds (AD-11/AD-12); storage unavailable → defaults silently (AD-10); SW update next launch, no `skipWaiting` (AD-12); `navigator.audioSession.type = 'playback'` before context creation (AD-8); never auto-resume (AD-8); mute = click-bus gain, marker bus separate so marker sounds survive mute (AD-7); crossing derived from audio-clock event time, not dot proximity (AD-9); dot position closed-form from segment start (AD-1); one marker per tick, ≥ 1 enabled beat, BPM 30–250 integer validated in store (AD-4); tick model supports snapping to 16ths/triplets/8ths/beats (AD-3); one rAF loop (AD-9).
