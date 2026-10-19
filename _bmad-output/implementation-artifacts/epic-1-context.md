# Epic 1 Context: A steady click and sweeping dot on the iPhone

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A musician opens the live URL on a phone, taps Start and gets a rock-solid click with a dot sweeping the bar in sync; Stop stops both. The epic includes project scaffold, CI and GitHub Pages deploy, the pure timing core, the audio engine, the dot layer, the audio lifecycle, and an iPhone timing spike with a pass/fail gate that decides whether the platform (web) is viable or a React Native port is needed.

## Stories

- Story 1.1: Scaffold, CI and live deploy
- Story 1.2: Closed-form timing core
- Story 1.3: Hear a steady click — Start and Stop
- Story 1.4: The dot sweeps in sync
- Story 1.5: Audio that behaves on phones
- Story 1.6: iPhone timing spike and platform gate

## Requirements & Constraints

- Click within 1 ms of ideal time at 30–250 BPM, zero cumulative drift over 30 min; dot within one display frame of each click.
- Audio clock is the master; visuals derive from it. Event times are closed-form from segment start, never accumulated.
- Phone is primary; iOS/Safari 17+ tab first, plus current Chrome and Firefox.
- No network calls after load, no analytics, no accounts; instant start with no splash.
- Quality gates: TypeScript strict, svelte-check and Vitest block deploy; simulated 30-min runs at 30/120/250 BPM.
- Defaults: 80 BPM, 4/4. Tempo fixed in this epic.
- Audio lifecycle: stop on hidden/interrupted/failed resume, never auto-resume, wake lock while playing.

## Technical Decisions

- Stack: Vite 8, Svelte 5, TypeScript 6 (strict), Vitest 5, svelte-check, vite-plugin-pwa 2 (`registerType: 'prompt'`), Node 24. No SvelteKit, UI kits, or audio libraries.
- Functional core, imperative shell. Layers: `src/core` (pure, imports nothing outside core), `engine`/`render`/`persist` (import core only), `ui` (core + port types), `main.ts` (composition root, only place adapters are built).
- Constants (PPQ 960, BPM 30–250, beats 1–16, LOOKAHEAD, WAKEUP_INTERVAL, START_LEAD) live only in `src/core/constants.ts`.
- tsconfig must list `vite/client`, `vite-plugin-pwa/client` and worker types explicitly (TS 6 defaults `types` to `[]`).
- Static build on GitHub Pages (`groove-grid/groove-grid.github.io`, URL `https://groove-grid.github.io/`); base path set once in `vite.config.ts`; Actions on push to `main` run svelte-check + vitest, then build and deploy; rollback = revert. CSP `<meta>` allows only same-origin scripts, workers, media.
- Directory seed: `public/sounds/`, `src/{core,engine,render,persist,ui}/`, `src/main.ts`, `spike/`, `vite.config.ts`, `.github/workflows/`.
- Scheduling: Web Worker wake-up (~25 ms) + ~100 ms lookahead pure planner; single AudioContext owner created at boot suspended; samples pre-decoded at boot as mono WAV with transient at sample 0.
- One rAF loop in `src/render/`; `ui` owns the canvas.

## UX & Interaction Patterns

- Placeholder page is a cream `surface` background with the app name.
- Start/Stop is a single 56px ink pill whose label shows the next action.
- Dot: 18px ink disc with 2px surface halo; ring: 3px ink, beat 1 at 12 o'clock, clockwise; at rest the dot sits on beat 1.
- Audio notice line (48px reserved) shows `Sound paused. Tap Start to play again.` for interrupted/resume-failed only; one-time `No sound? Check the silent switch.` hint where audioSession is unsupported on iOS.

## Cross-Story Dependencies

- 1.2 (core) precedes 1.3 (engine) and 1.4 (render); 1.3 and 1.4 feed 1.5 and 1.6.
- 1.6 gates the whole platform and tunes constants set in 1.1.
- The silent-switch hint flag is kept in memory until Epic 5 adds persistence.
