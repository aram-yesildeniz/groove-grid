---
review-of: ../ARCHITECTURE-SPINE.md
driving-spec: ../../../../specs/spec-groove-grid/SPEC.md
lens: good-spine rubric
date: 2026-10-19
verdict: PASS WITH FIXES
---

# Rubric Review: Groove Grid v1 Architecture Spine

## Verdict

**PASS WITH FIXES.** The spine is tight and well-aimed. The timing invariants (AD-1, AD-2, AD-3, AD-6, AD-7) are the real divergence points for a metronome and are mostly enforceable. All nine capabilities map to ADs. The gaps are: (1) one rule, AD-1's clock rule, can't produce a smooth dot on Safari as written; (2) two places where ownership or shape is ambiguous enough that two stories would diverge (where ClockReader lives, and who calls `engine.apply`); (3) the `pending` shape can't express mixed-boundary changes; (4) the operational envelope is missing security (CSP), accessibility architecture and a performance budget. None of these needs a restructure.

## Checklist Results

| Check | Result | Notes |
| --- | --- | --- |
| Fixes the real divergence points | Mostly | Timing, ticks, settings ownership, lifecycle and render order are covered. Missing: ClockReader location, the apply path, the pending shape, preview routing, ownership of the marker cursor and canvas a11y. |
| Rules enforceable and prevent their divergence | Mostly | AD-1 is enforceable but over-constrains the dot (F1). AD-5's `pending` can't represent a combined tempo+meter change (F4). AD-4 vs AD-5 disagree on how settings reach the engine (F3). |
| Deferred items can't cause divergence | Pass | Each deferred item sits behind a port or a constant, or is out of scope. "Lint/format tooling" is justified correctly. |
| Covers spec capabilities | Pass | CAP-1..9 all mapped. CAP-8 "start from beat 1" is implied, not stated (F-minor). |
| Feature-altitude dimensions decided/deferred/open | Partial | Deployment, infra, CI and SW update are decided (AD-12). Missing: CSP and security headers, accessibility architecture, performance budget. Also missing: environments (preview/staging) and rollback. |
| No bloat | Pass | AD-13 is a sequencing decision, not an invariant, but it is a real trade-off with a kill criterion, so it stays. AD-11's file list is close to seed, but it pins the accent/normal pairing that stories share. Acceptable. |
| Mermaid valid | Pass | All three diagrams (flowchart TD, sequenceDiagram, flowchart LR) parse by inspection: no reserved ids, labels are bracket-safe, loop blocks are closed. The layer graph matches the import table. |

## Findings

### F1 [HIGH] AD-1 forbids the only way to get a smooth dot on Safari

`AudioContext.currentTime` advances in render-quantum or larger chunks (on WebKit it often steps every several ms and can sit still across a whole frame). If you sample it raw once per rAF, the dot stutters, which breaks CAP-2 ("no visible stutter", "within one display frame"). AD-1 also says `performance.now()` "never decides where the dot is", so it bans the standard fix: map audio time to performance time with `getOutputTimestamp()` or a `currentTime`/`performance.now()` pair, then interpolate. Different render stories will either break the rule or ship stutter.

**Fix:** amend AD-1. `ClockReader.now()` returns audio-clock seconds that the engine interpolates between context updates, anchored to `getOutputTimestamp()` (or a sampled `currentTime`/`performance.now()` pair) and monotonic. Only `audio-context.ts` does that mapping. Timing *decisions* still use audio time only. Add a dot-smoothness and dot-vs-click alignment check (a 120 Hz ProMotion device included) to the AD-13 spike pass criteria.

### F2 [MEDIUM] ClockReader has no home; the layer table blocks render from importing it

AD-1 and AD-2 say every module gets "now" and the `Timeline` through the injected `ClockReader` port, but the spine never says where that type is defined. Render may import only `core`. If ClockReader lands in `src/engine/port.ts`, the render story either breaks the import rule or defines its own copy. The contents of `src/render/port.ts` (which the UI imports) are also unstated.

**Fix:** define `ClockReader` (`now(): number`, `timeline(): Timeline`) in `src/core/ports.ts`. State what `render/port.ts` exposes, for example `mount(canvas)`, `setReducedMotion`, and hit-test/snap for marker input.

### F3 [MEDIUM] AD-4 and AD-5 disagree on how settings reach the engine

AD-4: "Persistence and the engine **subscribe** to [the store]." AD-5: "UI → engine traffic is full snapshots", with `apply(settings)` as a command. One story will wire a subscription in `main.ts` and another will call `apply` from components, which gives double applies or missed ones.

**Fix:** one sentence in AD-4: "`main.ts` subscribes the engine and persist to the store; the subscription calls `engine.apply(snapshot)`. Components never call `apply`." Persist-on-write should also be debounced or trailing-edge (the BPM drag fires many changes), or explicitly stay "every change".

### F4 [MEDIUM] `pending` can't represent mixed-boundary or superseding changes

AD-6 puts tempo/click changes at the next beat and meter at the next downbeat. One full-snapshot `apply` can carry both, but `pending: { settings, atTime } | null` has a single `atTime`. Neither AD says what happens when a second `apply` arrives before the first boundary. EXPERIENCE.md requires "rapid changes within one beat collapse to the latest value". Engine and UI stories will each invent semantics.

**Fix:** in AD-6 / `withSettings`, uncommitted future segments are replaced, never appended (latest snapshot wins). Make `pending` a list `{ settings, atTime }[]` (at most 2), or define it as the earliest pending change and specify that the numeral greys out until the tempo-bearing entry lands.

### F5 [MEDIUM] Operational envelope missing: CSP/security, accessibility architecture, performance budget

- **CSP/security:** GitHub Pages can't set response headers, so any CSP has to be a `<meta http-equiv>` in `index.html`. No decision is recorded. Pick a policy now (e.g. `default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self' 'unsafe-inline'` if Svelte needs it, `connect-src 'self'`, `img-src 'self' data:`), check it against vite-plugin-pwa's registration script and the Vite worker build, and enforce it in CI. That also enforces the "no network calls after load" convention. Note that `frame-ancestors` doesn't work in meta.
- **Accessibility architecture:** EXPERIENCE.md requires the canvas to be `role="img"` with a live-composed label, a keyboard marker cursor on the grid, and polite live regions. The spine doesn't say who owns the cursor state (store vs render layer), where the label string is composed (a pure core formatter?), or that the canvas is wrapped by a focusable DOM element in `ui`. Without that, the render and UI stories will diverge.
- **Performance budget:** the spec says "dropped frames are a defect" but there are no numbers. Add a per-frame budget (e.g. ≤ 4 ms main-thread render work so 120 Hz has headroom; no allocation per frame in layers), a JS bundle cap (e.g. ≤ 100 KB gz), and a sample-set size cap. Otherwise make it an open question.
- **Environments/rollback:** only prod exists. State that explicitly ("single environment; rollback = revert on main") or defer it.

### F6 [LOW] `preview()` routing is unstated; muted previews would go silent

EXPERIENCE.md: previews play even when muted. AD-7 routes clicks through the click bus, which is gain 0 when muted. A story that reuses the click path for `preview` will be silent.

**Fix:** AD-7: "`preview` plays through a third preview path (or directly to destination), bypassing mute."

### Minor

- **CAP-8 "starts from beat 1":** AD-6/AD-2 should state that `start()` builds a fresh `Timeline` with tick 0 at `now + startLatency` (constant in `constants.ts`). Stop then re-Start must never resume mid-bar.
- **AD-8 vs EXPERIENCE.md wake lock:** UX says "re-request when the page becomes visible again while playing", but hidden → stop means that can't happen. The spine's "follows engine status" is correct. Flag it to UX as an inconsistency rather than changing the spine.
- **Meter denominator:** EXPERIENCE.md has a beat unit /4 or /8 where BPM counts the beat unit. AD-3's "960 per beat" is still correct if "beat" means beat unit. Say so in one clause so nobody adds a quarter-note conversion.
- **Triplet + straight levels:** AD-3 allows any divisor of 960, but CAP-1 treats triplets as an alternative family. AD-4's "markers on a visible line" depends on how `Settings` encodes grid family vs level. Pin the shape (e.g. `grid: { family: 'straight' | 'triplet', division: 1|2|4|3 }`) in AD-3 or AD-4, because persisted v1 data depends on it.
- **Open question on meter shrink:** fine as an open question. The assumed answer (bulk removal + Undo) is consistent with AD-4.

## Capability Coverage

| CAP | Covered by | Gap |
| --- | --- | --- |
| CAP-1 | AD-3, AD-6, AD-9 | Grid-family shape (minor) |
| CAP-2 | AD-1, AD-2, AD-9, AD-13 | F1 |
| CAP-3 | AD-1, AD-7, AD-8, AD-11 | none |
| CAP-4 | AD-2, AD-6, AD-7 | none |
| CAP-5 | AD-4, AD-5, AD-6 | F4 |
| CAP-6 | AD-3, AD-4 | marker cursor ownership (F5) |
| CAP-7 | AD-2, AD-7, AD-9 | none |
| CAP-8 | AD-5, AD-8 | start-at-beat-1 (minor), F6 |
| CAP-9 | AD-4, AD-10 | persist cadence (F3) |
