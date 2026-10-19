- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-scaffold-ci-and-live-deploy.md`
  summary: Register the generated service worker and wire the prompt-update flow.
  evidence: vite-plugin-pwa builds `sw.js` but nothing registers it (`injectRegister: false`); belongs with Epic 5 story 5.2.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-scaffold-ci-and-live-deploy.md`
  summary: Tighten CSP `style-src` (drop `'unsafe-inline'`) if no inline styles are needed.
  evidence: Svelte production CSS is extracted, so inline styles may be unnecessary; confirm once canvas/UI exist.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-scaffold-ci-and-live-deploy.md`
  summary: Give worker code its own tsconfig (WebWorker lib) instead of a global DOM+WebWorker lib list.
  evidence: Both libs in one config can clash on globals; hidden today by `skipLibCheck`. First worker is story 1.3.
