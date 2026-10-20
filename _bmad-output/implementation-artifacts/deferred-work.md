- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-scaffold-ci-and-live-deploy.md`
  summary: Register the generated service worker and wire the prompt-update flow.
  evidence: vite-plugin-pwa builds `sw.js` but nothing registers it (`injectRegister: false`); belongs with Epic 5 story 5.2.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-scaffold-ci-and-live-deploy.md`
  summary: Tighten CSP `style-src` (drop `'unsafe-inline'`) if no inline styles are needed.
  evidence: Svelte production CSS is extracted, so inline styles may be unnecessary; confirm once canvas/UI exist.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-scaffold-ci-and-live-deploy.md`
  summary: Give worker code its own tsconfig (WebWorker lib) instead of a global DOM+WebWorker lib list.
  evidence: Both libs in one config can clash on globals; hidden today by `skipLibCheck`. First worker is story 1.3.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-hear-a-steady-click-start-and-stop.md`
  summary: Handle sample-bank decode failure at boot (no unhandled rejection, allow retry on next Start).
  evidence: `loadBank` rejection in `main.ts` is only warned when Start is tapped; fits the 1.5 audio lifecycle story.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-iphone-timing-spike-and-platform-gate.md`
  summary: Add a test that `loop.mount` calls `onFrame` and that the spike BPM reaches the engine.
  evidence: Spike wiring in `main.ts`/`App.svelte`/`loop.ts` has no automated test; verification gap review, low risk for throwaway harness.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-design-tokens-and-the-practice-screen-layout.md`
  summary: Add a DOM component test for `App.svelte` (BPM numeral, Start/Stop label, notice) once a DOM test environment exists.
  evidence: No automated check renders `App`; layout verified only by headless screenshots; verification-gap review.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-settings-store-and-tempo-steppers.md`
  summary: Test the store-to-engine wiring (`apply` receives new tempo) and `Stepper.svelte` pointer/keyboard handling.
  evidence: Only the store and hold-repeat logic are unit-tested; wiring and component handlers need a DOM test setup or a device check. Fits story 2.3's `apply` tests.
