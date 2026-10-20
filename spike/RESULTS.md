# iPhone timing spike (AD-13)

Status: **PENDING**. Nothing below has been measured. The agent that built the harness recorded no results.

## Setup

1. Open `https://groove-grid.github.io/?spike=1` in an iPhone Safari tab (plain tab, not home screen). The `?bpm=` hook was removed in story 2.2; once the tempo steppers are deployed, set the tempo with `−`/`+` (hold to repeat). Before that, builds from the 1.6 commit take `&bpm=120`, `&bpm=250` etc.
2. Tap Start. The panel shows `elapsedS`, `skipped`, `wakeups` (gaps between worker wake-ups; `late` = gaps over 2 × `WAKEUP_INTERVAL`) and `frames` (rAF deltas; `long` = frames over 1.5 × the median).
3. Leave the screen on (the app holds a wake lock). After 30 minutes tap **Copy JSON** and paste it into the table notes below.

## Recording analysis

Record the phone's output with a wired path (headphone/USB adapter into an audio interface or a laptop line-in), mono or stereo WAV, 44.1 kHz or higher, starting before the first click:

```sh
node spike/analyze.ts run-120.wav --bpm 120
node spike/analyze.ts run-120.wav --bpm 120 --fit-period   # also reports recorder clock skew in ppm
```

PASS = every onset within ±1 ms of `t0 + n × period` (t0 = first onset), exit code 0. If the nominal check fails but `--fit-period` shows a steady ppm offset with a tiny residual, suspect the recorder's clock and repeat with a better one before judging the phone.

## Gate (all must pass)

| #   | Check                                                                             | Result  | Notes |
| --- | --------------------------------------------------------------------------------- | ------- | ----- |
| 1   | 30 BPM, 30 min: no glitch/dropout/doubled click, `skipped` = 0                    | PENDING |       |
| 2   | 120 BPM, 30 min: same                                                             | PENDING |       |
| 3   | 250 BPM, 30 min: same                                                             | PENDING |       |
| 4   | Low Power Mode run: wake-up intervals logged (`wakeups` JSON)                     | PENDING |       |
| 5   | Recording analysis ±1 ms, no cumulative drift (30/120/250)                        | PENDING |       |
| 6   | 240 fps video: dot on the line at each click within one display frame, no stutter | PENDING |       |
| 7   | Silent switch on: clicks audible (where `audioSession` exists)                    | PENDING |       |
| 8   | After lock/unlock or a phone call, tapping Start plays correctly                  | PENDING |       |

Not gating, record only: home-screen install (known iOS audio-loss risk) | PENDING.

## Tuning

After the runs, set `LOOKAHEAD`, `WAKEUP_INTERVAL` and `START_LEAD` in `src/core/constants.ts` from the results and note the values here. Current: 0.1 / 0.025 / 0.1.

## Verdict

**PENDING.** On a fail, AD-13 triggers the React Native port decision; `src/core/` is the reusable part. Record NFR1, NFR2 and NFR4 outcomes against FR5 and FR6 here.
