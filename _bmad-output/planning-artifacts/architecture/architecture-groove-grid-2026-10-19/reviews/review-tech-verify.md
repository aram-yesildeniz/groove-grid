---
review: tech-verify
target: ../ARCHITECTURE-SPINE.md
date: 2026-10-19
method: npm registry (npm view / npm pack inspection), @mdn/browser-compat-data 8.1.6 (2026-10-15), nodejs.org/dist/index.json, WebKit Bugzilla, GitHub docs, web search
verdict: PASS WITH FIXES
---

# Tech Verification — Groove Grid Architecture Spine

**Verdict: PASS WITH FIXES.** Every Stack version exists, is the current `latest` on npm as of 2026-10-19, and all peer and engine ranges are compatible. The platform facts the spine relies on hold for the iOS 17+ floor. Two spots need tightening: AD-12's service-worker update rule is right in intent but under-specified, because one wrong `registerType` would reload the page mid-session. The spike (AD-13) also misses a Low Power Mode run. Nothing found invalidates a decision.

## 1. Stack versions and compatibility

| Package | Spine | npm latest (2026-10-19) | Peer / engines checked | Result |
| --- | --- | --- | --- | --- |
| Node.js | 24.22.0 | v24.22.0 "Krypton" LTS, released 2026-10-14; newest overall is v26.12.0 (not yet LTS) | vite `^20.19 \|\| >=22.12`; vite-plugin-svelte `^20.19 \|\| ^22.12 \|\| >=24`; vitest `^22.12 \|\| ^24 \|\| >=26`; vite-plugin-pwa `>=20.19` | OK. Note: Node 26 is due to be promoted to LTS around late Oct 2026, which moves 24 to Maintenance LTS (supported to April 2028). Still a valid choice. Pin with `.nvmrc` / `actions/setup-node` `node-version: 24`. |
| TypeScript | 6.0.3 | `latest` = 7.0.2; 6.0.3 is the newest 6.x | svelte-check 4.7.7 peer `typescript: ^5.0.0 \|\| ^6.0.0` | OK, and the pin to 6 is **required**: svelte-check does not accept TS 7 yet. Correctly reasoned in the memlog. |
| Vite | 8.3.4 | 8.3.4 | — | OK |
| Svelte | 5.57.2 | 5.57.2 | engines node >=18 | OK |
| @sveltejs/vite-plugin-svelte | 7.3.1 | 7.3.1 | peer `vite ^8.0.0`, `svelte ^5.46.4` | OK |
| svelte-check | 4.7.7 | 4.7.7 (published 2026-10-16) | peer `svelte ^4 \|\| ^5`, `typescript ^5 \|\| ^6` | OK |
| vite-plugin-pwa | 2.0.0 | 2.0.0 (published 2026-10-03) | peer `vite ^3.1 … \|\| ^8.0.0`, `workbox-build ^7.4.1`, `workbox-window ^7.4.1`, `@vite-pwa/assets-generator ^1 \|\| ^2` (optional) | OK. Not tied to Svelte; the `virtual:pwa-register/svelte` helper uses `svelte/store` `writable`, which Svelte 5 still supports. |
| Workbox | 7.4.1 | workbox-build 7.4.1 | — | OK |
| Vitest | 5.0.5 | 5.0.5 | peer `vite ^6.4 \|\| ^7 \|\| ^8`; `@types/node ^22 \|\| >=24` | OK |

**vite-plugin-pwa 2.0.0 breaking changes.** The GitHub release notes and README list only two: (a) Node >= 20.19.0 is required, and (b) the optional peer `@vite-pwa/assets-generator` may be `^2.0.0`. The config API (`registerType`, `injectRegister`, `strategies`, `workbox`, `manifest`, `devOptions`) is unchanged. I confirmed this by inspecting the 2.0.0 tarball. Vite 8 support arrived in 1.3.0. Nothing in the spine is affected.

**TypeScript 6 default changes the scaffold story must handle (not a spine defect):** in TS 6.0, `types` defaults to `[]`, `strict` defaults to `true`, and `module` defaults to `esnext`. `@types/*` and ambient types are no longer picked up automatically. The tsconfig must list `vite/client`, and `vite-plugin-pwa/svelte` (or `vite-plugin-pwa/client`) when the virtual register module is used, plus worker types for `wakeup.worker.ts` (`lib: ["WebWorker"]` in a separate tsconfig, or a triple-slash reference). Suggest a one-line note under Conventions → Types, or leave it to the scaffold story.

## 2. Web platform facts (iOS Safari floor 17+)

All support data comes from @mdn/browser-compat-data 8.1.6 unless noted otherwise.

| Claim in spine / memlog | Finding | Status |
| --- | --- | --- |
| `navigator.audioSession.type = 'playback'` (memlog: "iOS 17+") | Shipped in **Safari / iOS 16.4**. MDN marks it experimental and limited availability. Safari implements only `type`; `audioSession.state` is undefined (WebKit bug 283417). Bug reports from iOS 17.2 to 17.3.1 say the context could still suspend in background with `playback`, which does not matter here because the app stops on hidden. | Confirmed (the floor is above 16.4). The spine is right to feature-detect and to read state from the **AudioContext**, not from `audioSession.state`. The memlog's "iOS 17+" is slightly off; harmless. |
| `AudioContext.state === 'interrupted'` | Safari 9+ / iOS 9+; Chrome 136+. | Confirmed |
| `AudioBufferSourceNode.start(when)` on `currentTime` | Safari / iOS 7+. Unprefixed `AudioContext` from iOS 14.5. Per the Web Audio spec, a `when` that is already past plays **immediately**. | Confirmed. Gap: AD-7 does not say what happens to an event whose time has passed (a late wake-up after jank). It is played late by default, which is an audible misplaced click. Suggest a rule: events with `time < currentTime` are skipped, not started, and logged via `console.warn` (the spike can count them). |
| `decodeAudioData` of WAV on iOS Safari | Supported since iOS 6; Promise form since iOS 14.5. PCM WAV decodes everywhere. Decoded buffers are resampled to the context rate (iPhone hardware is usually 48 kHz). | Confirmed. Suggest exporting the samples as 16-bit PCM at 48 kHz so no resampling happens; this is not architectural. Use the Promise form only (floor 17). |
| Screen Wake Lock in Safari **tabs** | Safari / iOS **16.4+** in tabs. Home Screen (standalone) web apps did not work until **iOS 18.4** (BCD: "partial 16.4–18.3, does not work in standalone", WebKit bug 254545). The lock is released automatically when the page is hidden. | Confirmed for the primary target (tab). On installed apps under iOS 17.0–18.3 the wake lock silently fails, so the screen may sleep. That is acceptable because install is non-gating, but the spike should note it. Re-requesting after `visibilitychange` is unnecessary here because the app stops on hidden. |
| Worker timer throttling, hidden tab | Irrelevant: the app stops on hidden (AD-8). | N/A |
| Worker timer throttling, **foreground on iOS** | No hard throttling of dedicated-worker timers in a visible tab is documented. But **Low Power Mode** is documented to stretch `setInterval` by about 30% (WebKit bug 272156, still NEW; tested on the main thread and iframes, workers not tested) and caps `requestAnimationFrame` at **30 fps** (intentional since iOS 14). A 25 ms wake-up may arrive at about 33 ms or worse; a 100 ms lookahead still absorbs that. | Unconfirmed for workers. **The spike (AD-13) should add a Low Power Mode run** (e.g. 10 min at 250 BPM) and log the actual wake-up interval distribution. The renderer's 30 fps in Low Power Mode is fine because positions come from `t` (AD-9). |
| WebKit bug 291892 (memlog: frozen clock → recreate) | Exists: "WebAudio AudioContext silent after PWA returns from background, even after resuming it", status NEW, iOS 18 / iOS 26, mostly **Home Screen apps**; `resume()` can hang; one user reports a fix in iOS 26.2 beta 3 (unconfirmed). Note: the symptom is **silence while state = 'running'**, not only a frozen `currentTime`. | Partially covered. AD-8 detects a frozen clock or a hung `resume()`, but silence with an advancing clock cannot be detected by a clock check. That is acceptable because Start after return recreates the context. Consider: always close and recreate the context on Start after any `paused-by-system`, instead of trying `resume()` first. This costs one buffer re-decode (small WAVs) and removes a whole class of bugs. |

## 3. Hosting and deploy

| Claim | Finding | Status |
| --- | --- | --- |
| Org site repo `groove-grid.github.io` served at `https://groove-grid.github.io/` root | GitHub docs: a user or org site "must be stored in a repository named `<owner>.github.io`" and is served at `http(s)://<owner>.github.io`; one such site per account. | Confirmed. On a Free org plan the repo must be **public** for Pages. |
| Deploy via GitHub Actions | Supported: Settings → Pages → Source = "GitHub Actions"; workflow uses `actions/configure-pages`, `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`, with `permissions: pages: write, id-token: write` and environment `github-pages`. | Confirmed. The Pages source must be switched from "Deploy from a branch" by hand once. |
| Base `/` single value | Correct for an org root site. The `groove-grid:` key prefix is now less critical, since the origin is no longer shared with the user's other project pages, but it is still good hygiene. | OK. AD-10's "Prevents: two projects on the shared github.io origin" is now **stale rationale**, because `groove-grid.github.io` is its own origin. Reword it to "future same-origin pages / custom domain". |

## 4. Service worker update rule (AD-12) — needs one more sentence

Verified in the vite-plugin-pwa 2.0.0 source:

- `registerType` **defaults to `'prompt'`**. With `prompt`, the generated SW does **not** call `skipWaiting`. A new SW installs and waits, `onNeedRefresh` / `needRefresh` fires, and the SW activates only if the app calls `updateServiceWorker()` (which posts SKIP_WAITING and then **reloads the page** on `controlling`) or when every client is closed.
- With `registerType: 'autoUpdate'` and `injectRegister` `auto` or unset, the plugin forces `workbox.skipWaiting = true` and `clientsClaim = true`, and the client **reloads the page on `activated`**. That would kill playback mid-session, which violates AD-12.

So the choice matters, and the spine should name it: **`registerType: 'prompt'` (default), never `autoUpdate`; do not call `updateServiceWorker()` while engine status is `playing`.**

Caveat on "takes over on next launch": without `skipWaiting`, the waiting SW activates only once **all** clients of the scope are closed. A reload of the only tab does not count, because the old page stays controlling during navigation. iOS Safari keeps tabs alive or restores them, and Home Screen apps are often suspended rather than closed, so "next launch" may be delayed for days. A reasonable completion of the rule: when `needRefresh` is true and the engine is `stopped`, either call `updateServiceWorker()` at the next cold app load before first Start, or show the quiet "update available" affordance described in EXPERIENCE.md. Pick one and state it.

## 5. Other observations

- **Tone.js 15.1.22 / TanStack Start versions** are in the memlog only, as rejected options. Not checked further.
- **AudioWorklet deferral**: fine. AudioWorklet is available in Safari 14.1+ if the spike forces it.
- **`AudioContext.outputLatency`**: Safari only since 18.4. Irrelevant (latency compensation is a non-goal), but do not depend on it if that ever changes.
- **Browser floor "current Chrome, Firefox"**: all APIs used are present (Wake Lock in Firefox since 126).

## Top findings (with fix)

1. **AD-12 SW update is under-specified**: `autoUpdate` forces `skipWaiting` + `clientsClaim` and reloads the page, which breaks playback. Fix: state `registerType: 'prompt'`, no `updateServiceWorker()` while playing, and say when the waiting SW is applied, since iOS rarely closes all clients.
2. **Late events (AD-7)**: `start(when)` with a past `when` plays immediately. Fix: add a rule to skip (and count) events whose time has already passed.
3. **Low Power Mode not in spike (AD-13)**: setInterval is stretched about 30% and rAF capped at 30 fps on iOS. Fix: add an LPM run that logs worker wake-up intervals.
4. **Bug 291892 symptom is silence with a running clock** (mostly Home Screen, iOS 18/26). Fix: on Start after `paused-by-system`, always recreate the AudioContext instead of trying `resume()` first.
5. **TS 6 defaults (`types: []`)**: `vite/client`, PWA virtual-module and worker types are no longer auto-included. Fix: note this in Conventions → Types or in the scaffold story.
6. **Stale rationale in AD-10** (shared github.io origin no longer applies), and Node 24 moves to Maintenance LTS when Node 26 becomes LTS in late Oct 2026. Fix: reword AD-10's "Prevents"; keep Node 24 (supported to April 2028) or note the planned bump.

## Sources

- npm registry: `npm view` for vite, svelte, @sveltejs/vite-plugin-svelte, svelte-check, vite-plugin-pwa, vitest, typescript, workbox-build (2026-10-19); vite-plugin-pwa@2.0.0 tarball (`dist/index.js`, `dist/client/build/svelte.js`)
- https://nodejs.org/dist/index.json
- @mdn/browser-compat-data 8.1.6 (2026-10-15)
- https://github.com/vite-pwa/vite-plugin-pwa/releases ; https://raw.githubusercontent.com/vite-pwa/vite-plugin-pwa/main/README.md
- https://bugs.webkit.org/show_bug.cgi?id=291892 ; https://bugs.webkit.org/show_bug.cgi?id=254545 ; https://bugs.webkit.org/show_bug.cgi?id=272156 ; https://bugs.webkit.org/show_bug.cgi?id=283417 ; https://bugs.webkit.org/show_bug.cgi?id=261554
- https://developer.mozilla.org/docs/Web/API/AudioSession/type ; https://caniuse.com/wake-lock ; https://progressier.com/pwa-capabilities/screen-wake-lock
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages ; https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://visualstudiomagazine.com/articles/2026/03/23/typescript-6-0-ships-as-final-javascript-based-release-clears-path-for-go-native-7-0.aspx
