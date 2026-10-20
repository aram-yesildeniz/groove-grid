# Groove Grid

A circular-grid metronome PWA. Vite + Svelte 5 + TypeScript, static build on GitHub Pages.

## Develop

```sh
npm ci
npm run dev      # local dev server
npm run check    # svelte-check
npm test         # vitest (includes the import-boundary check)
npm run lint
npm run build
```

`npm test` also runs `scripts/check-boundaries.ts` logic against `src/`: `core` imports only `core`; `render`, `engine` and `persist` never import `ui`. Run it standalone with `node scripts/check-boundaries.ts`.

## Timing spike

The iPhone timing run (AD-13) uses `/?spike=1&bpm=120` for the on-screen log and `node spike/analyze.ts <recording.wav> --bpm 120` for recordings. Runbook and results: `spike/RESULTS.md`.

## Deploy

Pushes to `main` run `svelte-check` and `vitest`, build, then deploy to https://groove-grid.github.io/ only if checks pass. Rollback = revert the commit on `main`.

One-time setup: in the repo's Settings → Pages, set Source to **GitHub Actions**.

The deploy base path lives in one place: `BASE` in `vite.config.ts`.
