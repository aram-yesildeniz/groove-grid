# iPhone timing spike (AD-13)

Status: **provisional PASS** (2026-10-20), recorded from the user's runs on an iPhone in a Safari tab against the live site. Several gate checks were not run; see Deviations. Numbers were read off the on-screen panel by hand.

## Setup

1. Open `https://groove-grid.github.io/?spike=1&bpm=120` in an iPhone Safari tab (plain tab, not home screen). Change `bpm` to 30 or 250 for the other runs. `?bpm=` works only together with `spike=1`.
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

| #   | Check                                                          | Result        | Notes                                                                                                                                                                     |
| --- | -------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 30 BPM, 30 min: no glitch/dropout/doubled click, `skipped` = 0 | NOT RUN       | accepted from row 3                                                                                                                                                       |
| 2   | 120 BPM, 30 min: same                                          | NOT RUN       | accepted from row 3                                                                                                                                                       |
| 3   | 250 BPM, 30 min: same                                          | PASS (27 min) | `elapsedS` 1612, `skipped` 0; wake-ups 56771, mean 28.4 ms, max 34 ms, late 0; frames 96877, median 17 ms, max 41 ms, long 4, pauses 0; sounded precise, animation smooth |
| 4   | Low Power Mode run: wake-up intervals logged                   | NOT RUN       |                                                                                                                                                                           |
| 5   | Recording analysis ±1 ms, no cumulative drift                  | NOT MEASURED  | `spike/analyze.ts` is ready; accepted on listening and `skipped` = 0                                                                                                      |
| 6   | 240 fps video: dot on the line within one display frame        | NOT RUN       | dot looked smooth by eye                                                                                                                                                  |
| 7   | Silent switch on: clicks audible                               | PASS          | clicks played with the mute switch on                                                                                                                                     |
| 8   | After lock/unlock, tapping Start plays correctly               | PASS          | playback reset correctly                                                                                                                                                  |

Not gating, record only: home-screen install (known iOS audio-loss risk): NOT CHECKED.

## Tuning

After the runs, set `LOOKAHEAD`, `WAKEUP_INTERVAL` and `START_LEAD` in `src/core/constants.ts` from the results and note the values here. Left unchanged at 0.1 / 0.025 / 0.1: the 250 BPM run showed a worst wake-up gap of 34 ms against a 100 ms lookahead and no late wake-ups.

## Deviations accepted by the user

- 250 BPM ran 27 minutes, not 30; 30 and 120 BPM were not run.
- No Low Power Mode log, no recording analysis, no 240 fps video.
- NFR1, NFR2 and NFR4 are therefore supported by the listening test, `skipped` = 0 and the wake-up and frame stats, not by the ±1 ms measurement.

## Open observation

Once, after returning to Safari from the background, there was no sound; reloading the page did not help and Safari had to be restarted. Not reproduced; cause unknown. Revisit if it recurs (the audio lifecycle from story 1.5 is the first suspect).

## Verdict

**Provisional PASS: continue on the web platform.** A React Native port (AD-13) is not triggered. Accepted by the user on 2026-10-20 with the deviations above.
