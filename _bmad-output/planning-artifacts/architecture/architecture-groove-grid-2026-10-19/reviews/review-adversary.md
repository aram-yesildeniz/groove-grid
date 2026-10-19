---
review: adversary
target: ../ARCHITECTURE-SPINE.md
context:
  - ../../../../specs/spec-groove-grid/SPEC.md
  - ../../../ux-designs/ux-groove-grid-2026-10-18/EXPERIENCE.md
date: 2026-10-19
verdict: 'NOT READY for story breakdown: paradigm and layering are sound, but at least 9 seams let compliant stories build incompatible code'
---

# Adversarial Review — Architecture Spine, Groove Grid v1

## Method

For each seam I wrote two stories one level below the spine. Each obeys every AD to the letter, and the two still produce code that cannot be integrated, or that integrates and then misbehaves. Every pair is a hole. Each one ends with a short proposed AD rule or tightening. The spine was not edited.

Severity: **H** = the stories will diverge, or the clock/audio contract (CAP-2/3) breaks. **M** = a likely integration bug or rework. **L** = cosmetic, or cheap to fix later.

## Verdict

The functional-core / imperative-shell split, single clock owner, 960 PPQ and full-snapshot port are the right bones. The spine names entities without fixing their **shape** (Settings, Event, Timeline, pending, ClockReader) or their **lifecycle owner** (AudioContext creation, undo snapshot, flags, canvas). Those are exactly where separately built stories collide. Adding about 12 terse rules (listed at the end) closes the holes. None of them changes the paradigm.

---

## F1 [H] — `Settings` shape is named but not defined

**Story A (Click sheet, `BeatToggle`):** defines `clickBeats: Set<number>` (1-based beat numbers) and `betweenBeats: 'none' | '8ths' | '16ths' | 'triplets'`. This is valid under AD-4, because the type lives in `src/core/settings.ts`.
**Story B (Meter sheet + persist):** the same file, edited earlier or later, uses `clickBeats: boolean[]` (0-based, length = beats), `betweenBeats: number | null` (a division), `grid: 1 | 2 | 4 | 3`, `meter: { beats, unit }`.
**Clash:** `JSON.stringify(new Set())` is `{}`, so persistence silently loses the beat pattern (AD-10 still passes). `'triplets'` and `3` both "identify a subdivision", but AD-3 says *division*, while Voice/Tone and the Grid sheet use names. `null` vs `'none'` for between-beats contradicts the Ids convention ("no marker sound is `null`"). That convention covers only marker sound, so the authors extrapolate differently. `clickBeats` length on a meter change: Story B resizes in `setMeter` with the UX carry-over rule. Story A's Set needs no resize but keeps beat 7 after 7/8→4/4. The engine then plays nothing extra, but persistence keeps garbage, and on 4/4→7/8 beat 7 reappears enabled even though not every previous beat was on. That violates the UX rule.
**Also:** load bypasses validation. AD-4 validates in *actions*, but AD-10 loads `{v:1,...}` straight in. A hand-edited or older-build value (`bpm: 300`, `clickBeats` of the wrong length, a marker off-grid, an unknown sound id) enters the store unvalidated.

**Proposed rule (AD-4 tighten):** The spine pins `Settings` literally:
`{ bpm: int; beats: 1..16; beatUnit: 4|8; grid: Division; clickBeats: boolean[] /* length === beats, ≥1 true */; betweenBeats: Division|null; clickSound: ClickSoundId; markerSound: MarkerSoundId|null; markers: number[] /* sorted unique ticks */; muted: boolean }`, with `Division = 1|2|4|3`. JSON-plain only (no Set/Map). Core exports `normalize(raw: unknown): Settings`. Persist load and every store action pass through it, so it is the single validator.

## F2 [H] — Beat-aligned immutable segments cannot carry mid-beat changes, and a pending meter breaks `clickBeats`

**Story A (core timeline):** reads AD-2 literally. A `Segment` holds the whole `Settings` and starts on a beat boundary. `withSettings` always appends a segment at the next beat (or downbeat).
**Story B (engine scheduler):** reads AD-6 literally ("grid level, markers and sounds take effect for events not yet committed") and expects a marker placed mid-beat to fire later in the *same* beat.
**Clash:** in A, a marker dropped 300 ms ahead of the dot does not fire until the next beat's segment, and that contradicts B and the UX ("editable while playing"; Flow 2 step 8, "keeps firing"). If A instead splits a segment mid-beat, it breaks AD-2's "each starting on a beat boundary".
**Second clash (meter pending + beat toggle):** while 4/4→3/4 is pending to the downbeat, the store already holds `clickBeats.length === 3`. The user toggles beat 2 ("applies next beat"). The snapshot handed to `withSettings` has a 3-long `clickBeats` that must drive the *remaining 4/4 bar*. One core author indexes out of range (beat 4 silent). Another keeps the old array until the downbeat, which drops the toggle. A third applies the whole snapshot at the next beat, which is a mid-bar meter switch and violates AD-6.
**Third clash (sound change):** AD-6 puts sounds on "not yet committed events". UX says the new click sound "takes over on the next beat". Between-beat clicks inside the current beat differ between the two readings.

**Proposed rule (AD-2/AD-6 split):** The Timeline holds only **metric** fields (`bpm, beats, beatUnit, clickBeats, betweenBeats, clickSound`), in beat-aligned segments. **Live** fields (`markers, grid, markerSound, muted`) are not in the Timeline. They are passed as a separate `live` argument: `eventsBetween(timeline, live, t0, t1)`, and they take effect for uncommitted events. If a snapshot's `beats` differs from the current segment's, the whole metric part applies at the next downbeat, tempo included (UX deviation to confirm). Otherwise it applies at the next beat.

## F3 [H] — `pending` is one opaque slot; the grey numeral can't be derived, and rapid changes may stack

**Story A (BpmNumeral):** greys while `pending !== null`. That obeys AD-5 ("grey BPM numeral... come only from pending").
**Story B (engine):** sets `pending` for *any* beat-boundary change, including a beat toggle.
**Clash:** toggling beat 2 greys the BPM. Alternatively, a UI author compares `pending.settings.bpm` against the store's `bpm`. Those are always equal, because the store holds the target, so the numeral never greys. There is no "currently effective bpm" on the port.
**Collapse:** "rapid changes within one beat collapse to the latest" is a UX rule. AD-2's `withSettings(timeline, settings, committedUntil)` does not say it must *replace* not-yet-started segments. A core author who appends produces 92→93→94→95 segments stacked on successive beats when a hold-repeat fires at 20/s. That gives four tempo steps, not one.
**Two pending targets:** a tempo change (next beat) plus a meter change (next downbeat) gives two future segments and one `pending` slot. Which `atTime` is reported?

**Proposed rule (AD-5 tighten):** `pending: { changed: (keyof Settings)[]; settings; atTime } | null`, where `atTime` is the latest not-yet-started boundary. The numeral greys iff `changed` includes `'bpm'`. `withSettings` drops every segment whose `startTime ≥ committedUntil` before adding the new one, so a timeline holds at most one future segment. The engine clears `pending` on the first wake-up where `now() ≥ atTime`.

## F4 [H] — `ClockReader.now()` is undefined, and AD-1 forbids the only way to make the dot smooth and aligned

**Story A (engine, ClockReader):** `now() => ctx.currentTime`. That obeys AD-1.
**Story B (render, dot layer):** trusts `now()` and draws `positionAt(now())`.
**Clash:** `currentTime` advances in render quanta (128 frames, about 2.7 ms), and Safari and Firefox coarsen it further. It also reports the *next block to be rendered*, not what is audible, so it runs ahead of the speaker by `baseLatency + outputLatency` (roughly 10–40 ms on iOS). The dot stair-steps at 120 Hz and leads the click by one to two display frames. That fails CAP-2's "within one display frame" with every story compliant. The standard fix interpolates `getOutputTimestamp()` (`contextTime` + `performance.now()` delta). AD-1's letter bans that: "`performance.now()` never decide... where the dot is".
**Also:** "latency compensation" is a SPEC non-goal (Bluetooth calibration). Is aligning to the *platform-reported* output timestamp compensation? Two authors will answer differently.

**Proposed rule (AD-1 amend):** `ClockReader.now()` returns the **audible** context time: `getOutputTimestamp().contextTime + (performance.now() − performanceTime)/1000`, falling back to `currentTime − baseLatency − (outputLatency||0)`. It is monotonic (never returns less than the last value) and is computed only in `src/engine/clock.ts`. This is the single sanctioned `performance.now()` use. The scheduler keeps using raw `currentTime` for horizons. User calibration remains a non-goal.

## F5 [H] — AudioContext creation timing collides with preview-while-stopped and sample-bank decode

**Story A (engine, `audio-context.ts`):** creates the context lazily inside the Start gesture, because "`resume()` happens only inside the Start gesture" and the first gesture is Start.
**Story B (engine, `sample-bank.ts`):** "decodes all of them once into a sample bank before the first Start can play". `decodeAudioData` needs a context, so B creates one at boot.
**Story C (Click sheet, Sounds level):** on first launch, before any Start, the user picks `Woodblock` and the UX requires a preview while stopped. `preview(soundId)` reaches a context that is suspended (iOS) or doesn't exist (A). AD-8 forbids `resume()` outside Start, so the preview is silent and all three stories comply.
**Clash:** under A, the first Start awaits fetch+decode of 11 files inside the gesture. iOS may drop the gesture's audio unlock across the `await`, and Start is no longer instant (Casio target). Under B, two modules both believe they own context creation (AD-8 names one file, but B's author places `new AudioContext()` in the bank "temporarily" or uses `OfflineAudioContext`, whose sample rate mismatches the live context, so buffers get resampled).

**Proposed rule (AD-8/AD-11 tighten):** `audio-context.ts` creates the context at app boot (suspended), after setting `audioSession`. The sample bank decodes immediately against that context, and `start()` awaits `bankReady` (it is not fetched in the gesture). `resume()` is called synchronously inside **any** user gesture that needs sound: Start, and preview while stopped. The engine ignores `preview()` while `status === 'playing'`, so the UI does not need to enforce it.

## F6 [H] — Engine lifecycle: `start` args, stop vs paused-by-system, timeline reset, stopped dot

**Story A (port):** `start()` takes no args, as the port list literally shows. The engine uses the last `apply`'d snapshot.
**Story B (StartStopButton):** reads "always with the full Settings" and calls `start(settings)`. The port types differ and TypeScript fails the build. At least that is loud.
**Silent clashes:**
- **Start time:** no core function builds a Timeline from scratch (only `withSettings(timeline, …)`). One author passes `startTime = currentTime`, so the first click is already late. Another uses `currentTime + lookahead`. During the lead, `positionAt(t < startTime)` returns a negative tick, and the render wraps it to the end of the bar: the dot jumps backwards before "leaving beat 1 exactly with the first click".
- **Stopped:** what is `ClockReader.timeline` when stopped: `null`, or the last one? If `null`, the render can't draw the grid for the stopped state. If it's the last one, the dot keeps sweeping after Stop.
- **Recreate on frozen clock:** the new context's `currentTime` restarts near 0. The render still holds the old Timeline (times around 600 s), and `positionAt` returns garbage until the next Start.
- **paused-by-system vs stopped:** the UX shows `Sound paused…` for interruption/resume failure but **not** for backgrounding ("returns stopped state"). AD-8 reports `paused-by-system` for all three, so one hint story shows the notice after every app switch. Is `start()` legal from `paused-by-system`, and does it clear the hint?
- **iOS silent-switch hint:** it needs "audioSession unsupported", which only `audio-context.ts` knows. The port is "exactly" the list, so the UI re-detects `navigator.audioSession` itself and duplicates platform logic in `ui`.

**Proposed rule (AD-5/AD-8 tighten):** Port: `start(settings)`, `stop()`, `apply(settings)`, `preview(soundId)`. Observable `status`, `pausedReason: 'interrupted'|'resume-failed'|'hidden'|null`, `pending`, `audioSessionSupported: boolean`. Core: `startTimeline(settings, startTime)` with `startTime = currentTime + START_LEAD` (in constants). `positionAt` clamps `t < startTime` to tick 0. When status ≠ playing, `ClockReader.timeline` is a **parked** timeline (startTime = +∞, which gives tick 0) rebuilt by every `apply`. Context recreation discards the timeline. The `Sound paused…` hint shows iff `pausedReason ∈ {interrupted, resume-failed}`. `start()` from any non-playing status resets to beat 1.

## F7 [H] — Interval, boundary and tick semantics of `committedUntil`, segments and `positionAt`

**Story A (core):** `eventsBetween(t0, t1)` is inclusive `[t0, t1]`. It returns ticks bar-relative, and segment `startTick` is the bar-relative tick.
**Story B (scheduler):** after scheduling, sets `committedUntil = lastEventTime`.
**Clash:** every boundary event is scheduled twice (a doubled click: an AD-13 spike fail). With `committedUntil = t1` and inclusive bounds it still doubles. With exclusive-both it skips. Separately, a segment that begins at the next downbeat after a meter change cannot express its `startTick` bar-relatively (the bar length changed), and two authors resolve it differently.
**Float seam:** a new segment's `startTime` derived from the old one (`old.startTime + Δtick × spt_old`) and an event computed from either side of the boundary can differ by 1 ulp. A time-based dedupe or `>=` comparison then flips, so the event is doubled or dropped.
**Integer vs fractional:** AD-3 says "a position in the bar is an integer tick", but `positionAt` must return a fractional tick for a smooth dot. An author who returns `Math.floor` makes the dot step in 1/960 beat at 30 BPM (about 2 ms, invisible) and makes crossing/glow comparisons off by one tick.

**Proposed rule (AD-2/AD-7 tighten):** All windows are half-open `[t0, t1)`. The scheduler sets `committedUntil = t1` (the window end, never an event time). Segments are keyed by **absolute** integer tick since start: `[startTick, nextStartTick)`, and `startTime` is computed once and stored. The event at a boundary tick belongs to the new segment only. Membership is decided in ticks, never by time comparison. Bar-relative tick = `(absTick − segment.barOriginTick) mod (beats×960)`. `positionAt` returns a fractional tick; events and markers are integer ticks.

## F8 [H] — Canvas and pointer ownership: who hit-tests, who snaps, who draws preview and cursor?

**Story A (ui, `GridCanvas.svelte`):** owns `<canvas>` and pointer events. It converts pointer→angle with its own `atan2`, center and radius (AD-3 bans only *ticks→angles* outside render, not the inverse), then snaps with `core.snap`.
**Story B (render, `loop.ts`):** creates its own canvas, sizes it for DPR in a ResizeObserver, and lays out the ring radius from the column width.
**Clash:** two canvases or two sizing paths. A's radius, rotation (beat 1 at 12 o'clock, clockwise) and the marker annulus (−40/+24 px) drift from B's actual drawing, so a tap lands one spoke off, worst at 16 × 16ths. The `marker-preview` layer needs the preview tick, but `Frame` is built only "from `positionAt` and `eventsBetween`", so no path carries UI gesture state into render. The keyboard **marker cursor** (Keyboard map) has no layer in AD-9's fixed list. Wrap at 12 o'clock is unspecified: `round(fraction × positions)` can yield `positions`, one past the last.
**Accessible name:** the role `img` label (`Grid: 4/4, 16ths, 3 markers: 1, and of 2…`) needs tick→musical-name formatting. A UI author writes it, and render or core may write another for the a11y layer.

**Proposed rule (AD-3/AD-9 tighten):** `ui` owns the `<canvas>` element, its ARIA and all pointer and keyboard events. The render port exposes `mount(canvas)`, `hitTest(x, y) → { inZone: boolean; barFraction: number }` (render owns geometry, DPR and the annulus) and `setOverlay({ previewTick: number|null, cursorTick: number|null })`. Core owns `snap(barFraction, settings) → tick` (with mod-wrap) and `tickLabel(tick, settings)`. Add a `marker-cursor` layer after `marker-preview`.

## F9 [M] — Render reads settings from where? Grid redraw and markers during a pending meter

**Story A (render grid layer):** AD-9 says the grid cache is "redrawn only on settings or size change". The author subscribes to the store, so the grid shows 3/4 immediately while the bar is still 4/4.
**Story B (render dot):** uses `positionAt(timeline)`, which is still 4/4.
**Clash:** the dot sweeps a 4-beat bar over a 3-spoke circle until the downbeat. That violates the UX rule "on meter change, redraws at the next downbeat while playing". Markers in the dropped 4th beat are removed from the store at once, yet the current 4/4 bar has nowhere to draw them. Snap during the pending window uses the store's 3/4 while the user sees 4/4 spokes, so a tap on the visible beat-4 spoke is rejected or lands elsewhere.

**Proposed rule (AD-9 tighten):** `render` imports nothing from `ui`. Every visual reads `ClockReader` only (`timeline` segment at `t` for metric fields, `live` for markers/grid). `hitTest`/`snap` use the meter of the segment *displayed now*. Marker edits during a pending meter change are validated against the **target** meter, and a tick outside it is rejected, with the preview hidden.

## F10 [M] — Undo snapshot, notice lifetime and meter shrink

**Story A (store):** keeps `{markers, grid}` as AD-4 says, until the next bulk removal.
**Story B (UndoNotice):** runs its own 6 s timer and clears on "next marker edit or grid/meter change".
**Clash:** after the notice hides, Ctrl+Z (Keyboard map: "while undo-notice is visible") still undoes in A, because the store snapshot is alive. Two owners of the undo lifetime. Meter shrink (the Open Question's assumed path) removes markers past the new bar, but Undo restores `{markers, grid}`, not the meter, so the restored markers sit outside the bar. The `normalize()` from F1 then deletes them again, or worse, they persist off-bar.

**Proposed rule (AD-4 tighten):** The store owns `undo: { before: Pick<Settings,'markers'|'grid'|'beats'|'beatUnit'|'clickBeats'>; removed: number; expiresAt: number /* performance.now ms, ui-only */ } | null`. The store clears it on any marker, grid or meter action and on expiry. The notice and Ctrl+Z render and act only from `undo`. Undo restores the whole `before`.

## F11 [M] — Non-settings persistent flags and storage access have no owner

**Story A (hint-text):** stores the "iOS silent-switch hint shown, once ever" flag as `localStorage['groove-grid:ios-hint']` directly from `ui`, with try/catch and the prefix. That obeys AD-10 to the letter, since AD-10 constrains key *names*, not *who* touches storage.
**Story B (persist):** adds `iosHintShown` into `Settings`, so AD-4's store "mutates" it and AD-10 versions it.
**Clash:** two storage paths, and possibly both if the stories run in parallel. A flag inside `Settings` is sent to the engine on every `apply` and appears in `pending.changed`. The first-run marker hint ("until the first marker exists") is derived from `markers.length` in one story but a persisted "has ever placed" flag in another. They differ after the user clears all.

**Proposed rule (AD-10 tighten):** Only `src/persist/` touches Web Storage. Non-musical flags live in a second key `groove-grid:flags` `{ v:1, iosSilentHintShown: boolean }`, exposed through a `flags` slice in the store, never inside `Settings` and never sent to the engine. The first-run hint is derived (`markers.length === 0 && !everPlacedMarker`, where `everPlacedMarker` is a flag), so it doesn't return after Clear all.

## F12 [M] — Event shape: `kind`, variant, gain and marker-without-sound

**Story A (core):** `Event = { tick, time, kind: 'click'|'marker'|'beat1', gain }`. Beat 1 emits *both* `click` and `beat1`.
**Story B (engine):** picks the sample from `kind === 'beat1' ? accent : normal`. That double-plays beat 1 (accent + normal), or plays an accent when beat 1 is *disabled*, because the pulse still needs `beat1` events (UX: pulse fires while muted and regardless of click-beats). Marker events with `markerSound: null`: one author emits nothing (so no crossing or glow), another emits them and the engine plays `null`.

**Proposed rule (AD-2/AD-7 tighten):** Core defines a discriminated union: `{kind:'click'; variant:'accent'|'normal'; level:'beat'|'between'; gain}`, `{kind:'marker'}` (always emitted, independent of sound), `{kind:'downbeat'}` (visual only, never sounded). Gain constants for accent, beat and between live in `constants.ts`. The engine sounds `click` and, iff `markerSound !== null`, `marker`.

## F13 [M] — Sound ids and sample file contract

**Story A (assets):** `public/sounds/beep-accent.wav`, `beep.wav`, `hi-hat-accent.wav`.
**Story B (sample-bank):** fetches `sounds/${id}/beat1.wav` and keys the bank as `Map<'beep:accent', AudioBuffer>`.
**Clash:** 404s that surface only on a device. The SW precache (AD-11, AD-12 base path) globs a third pattern. The id unions are duplicated in the store's validator, the Sounds UI and the engine.

**Proposed rule (AD-11 tighten):** `CLICK_SOUNDS = ['beep','woodblock','stick','hi-hat'] as const` and `MARKER_SOUNDS = ['clap','cowbell','conga'] as const` live in `src/core/constants.ts`. Files are `sounds/<id>-accent.wav`, `sounds/<id>-normal.wav` for clicks and `sounds/<id>.wav` for markers. URLs are built by one function from `import.meta.env.BASE_URL`, and the precache list is generated from the same constants.

## F14 [M] — Mute: a setting, a gain, or an event filter?

**Story A (engine):** treats `muted` in the `apply` snapshot as a click-bus gain → 0 at `currentTime`. That follows AD-7.
**Story B (core):** AD-6 doesn't list mute. The author files it under "click-beat changes", so the core omits click events while muted, producing a beat-boundary `pending`.
**Clash:** in B, unmute waits for the next beat and the BPM greys (via F3). Also, the gain change at `currentTime` affects nodes already scheduled up to 100 ms ahead. That is the intended "instant", but it is never stated, so a "fix" might ramp at `committedUntil` instead.

**Proposed rule (AD-6/AD-7 tighten):** `muted` is a live field (F2). It never creates a segment or `pending`. The engine applies it as `clickBus.gain.setValueAtTime(muted?0:1, ctx.currentTime)` immediately. Core never filters clicks by `muted`.

## F15 [L] — Tap-tempo state and units

**Story A (TapTempoButton):** keeps its own tap buffer with `performance.now()`.
**Story B (keyboard map `T`):** wants testable pure logic and puts `tapTempo(timesMs[])` in `src/core/`. That violates "no milliseconds in the core", so B switches to `AudioContext` seconds via `ClockReader`. Before the first Start the context is suspended, its clock is frozen, and tap tempo returns ∞.
**Clash:** two buffers (button and `T` don't share a sequence), and the core variant breaks while stopped.

**Proposed rule:** One `src/ui/tap-tempo.ts` module shared by the button and `T`, using `performance.now()` ms (UI time, not musical time; AD-1 explicitly allows it here). It calls `setTempo` only.

## F16 [L] — Persist write rate and wake-lock trigger

Hold-repeat at 20/s and drag fire `setTempo` about 20 times per second. AD-10's "written on every store change" means 20 synchronous `localStorage` writes per second on the main thread during playback. That can cause jank, which "dropped frames are a defect" forbids. Wake lock "follows engine status" (AD-8), but `status` flips asynchronously after `resume()`, outside the gesture. That is fine for the Wake Lock API, but a second author might request it in the Start handler too, giving two owners.
**Proposed rule:** Persist writes are trailing-debounced by about 300 ms and flushed on `pagehide`. Only `src/ui/wake-lock.ts` calls `navigator.wakeLock`, driven solely by `status`.

---

## Consolidated rule additions (terse)

1. **Settings literal** (F1): pin fields, units, `Division = 1|2|4|3`, `clickBeats: boolean[]` of length `beats`, JSON-plain. Core `normalize()` is the only validator, also used on load.
2. **Metric vs live** (F2, F14): the Timeline carries `bpm, beats, beatUnit, clickBeats, betweenBeats, clickSound`. `markers, grid, markerSound, muted` are live (uncommitted events / instant). A meter change moves the whole metric snapshot to the next downbeat.
3. **Pending** (F3): `{changed, settings, atTime}`. The numeral greys iff `bpm ∈ changed`. `withSettings` replaces not-yet-started segments, so there is at most one future segment.
4. **Audible clock** (F4): `now()` is from `getOutputTimestamp` interpolation, monotonic, in `engine/clock.ts`, and is the only `performance.now` timing use. The scheduler uses `currentTime`.
5. **Context at boot** (F5): create the context suspended at boot, decode the bank at once, call `resume()` in any sound gesture (Start or preview). The engine drops `preview` while playing.
6. **Lifecycle** (F6): `start(settings)`, add `pausedReason` and `audioSessionSupported`. Core `startTimeline(settings, startTime)` with `START_LEAD`. `positionAt` clamps before start. A parked timeline when not playing. Recreate discards the timeline.
7. **Intervals and ticks** (F7): half-open windows, `committedUntil = t1`, absolute integer ticks for segments with stored `startTime`, boundary event owned by the new segment, `positionAt` returns a fractional tick.
8. **Canvas** (F8, F9): `ui` owns the element and events. The render port has `mount`, `hitTest`, `setOverlay`. Core has `snap` and `tickLabel`. Add a `marker-cursor` layer. Render reads only `ClockReader`.
9. **Undo** (F10): a store-owned `undo` with expiry, cleared by the store. The snapshot includes meter and clickBeats.
10. **Storage** (F11, F16): only `persist` touches storage. A separate `groove-grid:flags` key. Debounced writes.
11. **Events** (F12): a discriminated `Event` union. `marker` is always emitted and `downbeat` is never sounded.
12. **Sounds** (F13): id tuples and the file-name pattern in `constants.ts`. One URL builder from `BASE_URL`.

## UX deviations these rules force (confirm with UX)

- F2: tempo changed while a meter change is pending would apply at the downbeat, not the next beat.
- F6: no `Sound paused…` hint after backgrounding (it matches the UX, but AD-8 currently implies otherwise).
- F9: marker edits are rejected in the dropped beats while a meter shrink is pending.
