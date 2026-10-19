---
title: 'Story 1.1: Scaffold, CI and live deploy'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '6cd131685d95e08450504d8df3f6cea9f17e2c1d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repo has planning docs but no app. Every later story needs a typed, layered Vite + Svelte project with quality gates and an automated deploy to a real URL that opens on a phone.

**Approach:** Scaffold Vite 8 + Svelte 5 + TypeScript 6 at the repo root in the Structural Seed layout, add an import-boundary check, constants, lint/format tooling, a placeholder page, and a GitHub Actions workflow (svelte-check + vitest, then Pages deploy).

## Boundaries & Constraints

**Always:** TypeScript `strict`; `tsconfig` `types` lists `vite/client`, `vite-plugin-pwa/client` and worker types explicitly. Base path set once in `vite.config.ts`. Pin stack versions from the architecture (TS 6.0.3, Vite 8.3.4, Svelte 5.57.2, plugin-svelte 7.3.1, svelte-check 4.7.7, vite-plugin-pwa 2.0.0, Vitest 5.0.5). Node 24 in CI. `src/core/constants.ts` is the only home for PPQ = 960, BPM 30–250, beats 1–16. Placeholder page: cream `surface` background and the app name "Groove Grid". CSP `<meta>` allows only same-origin scripts, workers, media. Layer rules: `core` imports nothing outside `core`; `render`, `engine`, `persist` must not import `ui`.

**Never:** SvelteKit, UI kits, audio libraries, analytics, network calls after load. No app logic, audio, canvas or PWA behavior beyond what the scaffold needs (service worker/precache and `registerType: 'prompt'` config may be wired minimally but no update UI). No `any` in `src/core/`. Do not push or trigger a deploy.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Clean build | `npm ci && npm run build` | Build succeeds, `dist/` has placeholder page | N/A |
| Core boundary breach | file in `src/core` importing `../engine/x` or `svelte` | Boundary check fails naming file and import | Non-zero exit |
| Adapter imports ui | file in `render`/`engine`/`persist` importing `../ui/...` | Boundary check fails | Non-zero exit |
| Allowed imports | `ui` -> `core`; `main.ts` -> any; `core` -> `./x` | Check passes | N/A |

</frozen-after-approval>

## Code Map

- Repo root has only `_bmad/`, `_bmad-output/`, `.claude/`; no `package.json`, `.gitignore`, `src/` yet. Remote is `groove-grid/groove-grid.github.io` (URL `https://groove-grid.github.io/`, base `/`).
- Architecture: `_bmad-output/planning-artifacts/architecture/architecture-groove-grid-2026-10-19/ARCHITECTURE-SPINE.md` (Structural Seed, AD-12, Types convention).
- Design tokens: `_bmad-output/planning-artifacts/ux-designs/ux-groove-grid-2026-10-18/DESIGN.md` (cream `surface` color value for the placeholder).

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `package-lock.json`, `.gitignore`, `.nvmrc` -- pinned deps and scripts (`dev`, `build`, `check`, `test`, `lint`, `format`) -- reproducible `npm ci`
- [x] `tsconfig.json` (+ node config if needed) -- strict, explicit `types`, `WebWorker` lib handling -- AD types convention
- [x] `vite.config.ts` -- svelte + vite-plugin-pwa (`registerType: 'prompt'`, manifest name `Groove Grid`), single `base` constant -- AD-12
- [x] `index.html`, `src/main.ts`, `src/ui/App.svelte` -- placeholder page with CSP meta, surface background, app name -- live URL placeholder
- [x] `src/core/constants.ts` -- PPQ, BPM range, beats range -- AD constants rule
- [x] `src/{core,engine,render,persist,ui}/` placeholders (e.g. `.gitkeep`) and `public/sounds/`, `spike/` -- Structural Seed layout
- [x] `scripts/check-boundaries.ts` (or similar) + `*.test.ts` -- import-boundary check run by vitest and an npm script -- matrix cases
- [x] ESLint (flat config, typescript-eslint, eslint-plugin-svelte) + Prettier configs -- lint/format tooling choice
- [x] `.github/workflows/deploy.yml` -- on push to `main`: `npm ci`, svelte-check, vitest, build, then upload-pages-artifact + deploy-pages only if checks pass -- AD-12
- [x] `README.md` -- short dev/deploy notes incl. enabling Pages "GitHub Actions" source -- manual setup step

**Acceptance Criteria:**
- Given a fresh clone, when `npm ci && npm run build` runs, then it succeeds under strict TS.
- Given a push to `main`, when the workflow runs, then deploy depends on a passing check job.
- Given the built page, then it is a cream page with "Groove Grid", and the CSP meta forbids non-same-origin script/worker/media.

## Verification

**Commands:**
- `npm ci && npm run check && npm test && npm run build && npm run lint` -- expected: all exit 0
- `npm run preview` then fetch `/` -- expected: placeholder HTML with CSP meta

**Manual checks (if no CLI):**
- Pages source must be set to "GitHub Actions" in repo settings; first live deploy is verified by the human after pushing.

## Implementation Notes

- Implemented directly (no subagent). Boundary check is `scripts/check-boundaries.ts` (pure `findViolations(srcDir)`), tested in `scripts/check-boundaries.test.ts` incl. the real `src/`; also runnable via `node scripts/check-boundaries.ts`.
- `svelte-check` 4.7.7 needs `allowJs: true` in `tsconfig.json` or it cannot type `.svelte` imports; `types` also lists `svelte`.
- `vite.config.ts` imports `defineConfig` from `vitest/config` for the `test` key.
- PWA: `registerType: 'prompt'`, `injectRegister: false`, no update UI yet. Surface color `#F7F3EA` from DESIGN.md.
- Not done by design: no push; Pages source must be set to "GitHub Actions" by the human.

## Spec Change Log

## Review Triage Log

Inline review (no subagents, by user choice).

| Finding | Verdict | Evidence / route |
|---|---|---|
| CSP acceptance criterion had no test | medium | patch: added `scripts/csp.test.ts` |
| Service worker generated but never registered | low | defer: registration/update flow belongs to Epic 5 story 5.2; spec said no update UI |
| `style-src 'unsafe-inline'` in CSP | low | defer: spec limits restriction to scripts/workers/media; revisit once UI exists |
| Global `WebWorker` + `DOM` libs may clash for worker code | low | defer: first worker arrives in story 1.3; split tsconfig then |
| Boundary regex could match import-like text in comments/strings | false | only yields a spurious failure, never a miss; no such text in `src/` |
| Boundary check ignores path aliases | false | no aliases are configured |
| CI does not run `lint` | low | rejected: not required by AC; fix would add a gate beyond intent |
