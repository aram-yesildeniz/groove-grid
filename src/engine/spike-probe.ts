import type { Wakeup } from '../core/ports.ts'

/** Gap statistics for a stream of timestamps (milliseconds). */
export interface GapStats {
  count: number
  meanMs: number
  maxMs: number
  /** Gaps longer than the late threshold given at creation. */
  late: number
}

export interface GapRecorder {
  mark(timeMs: number): void
  /** Forget the previous timestamp, so a stop/start gap is not counted. */
  reset(): void
  stats(): GapStats
}

/** Records gaps between successive `mark` calls; diagnostics only, never used for scheduling. */
export function createGapRecorder(lateMs: number): GapRecorder {
  let last: number | null = null
  let count = 0
  let sum = 0
  let max = 0
  let late = 0
  return {
    reset() {
      last = null
    },
    mark(timeMs) {
      if (last !== null) {
        const gap = timeMs - last
        count++
        sum += gap
        if (gap > max) max = gap
        if (gap > lateMs) late++
      }
      last = timeMs
    },
    stats: () => ({ count, meanMs: count ? sum / count : 0, maxMs: max, late }),
  }
}

/** Frame deltas longer than this are a hidden or locked page, not stutter; counted apart. */
const PAUSE_MS = 1000

/** Frame deltas judged against their own median, so 60 and 120 Hz screens both work. */
export function createFrameRecorder() {
  const buckets = new Map<number, number>()
  let last: number | null = null
  let frames = 0
  let pauses = 0
  return {
    mark(timeMs: number) {
      if (last !== null) {
        const delta = timeMs - last
        if (delta > PAUSE_MS) pauses++
        else {
          frames++
          const key = Math.round(delta)
          buckets.set(key, (buckets.get(key) ?? 0) + 1)
        }
      }
      last = timeMs
    },
    stats() {
      const keys = [...buckets.keys()].sort((a, b) => a - b)
      let median = 0
      let seen = 0
      for (const key of keys) {
        seen += buckets.get(key)!
        if (seen > frames / 2) {
          median = key
          break
        }
      }
      let long = 0
      for (const [key, n] of buckets) if (key > median * 1.5) long += n
      return { frames, medianMs: median, maxMs: keys.at(-1) ?? 0, long, pauses }
    },
  }
}

/** Wraps a `Wakeup` so each wake-up is timestamped into `recorder`. */
export function probeWakeup(inner: Wakeup, recorder: GapRecorder, nowMs: () => number): Wakeup {
  return {
    start(onWake) {
      inner.start(() => {
        recorder.mark(nowMs())
        onWake()
      })
    },
    stop() {
      recorder.reset()
      inner.stop()
    },
  }
}
