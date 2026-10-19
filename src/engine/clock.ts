import type { ClockReader } from '../core/ports.ts'
import type { Timeline } from '../core/timeline.ts'

/** The slice of `AudioContext` the clock reads. */
export interface ClockSource {
  currentTime: number
  baseLatency?: number
  outputLatency?: number
  getOutputTimestamp?(): { contextTime?: number; performanceTime?: number }
}

/**
 * Audible audio time for visuals (AD-1). The one sanctioned use of `performance.now()` for timing:
 * it interpolates between coarse `currentTime` steps. Never decreases.
 */
export function createClockReader(
  source: ClockSource,
  getTimeline: () => Timeline | null,
  perfNow: () => number = () => performance.now(),
): ClockReader {
  let last = 0
  return {
    now() {
      const stamp = source.getOutputTimestamp?.()
      let t: number
      if (stamp?.contextTime && stamp.performanceTime) {
        t = stamp.contextTime + (perfNow() - stamp.performanceTime) / 1000
      } else {
        t = source.currentTime - (source.baseLatency ?? 0) - (source.outputLatency ?? 0)
      }
      if (t > last) last = t
      return last
    },
    timeline: getTimeline,
  }
}
