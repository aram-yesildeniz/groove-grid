import { PPQ } from './constants.ts'
import { positionAt, type Timeline } from './timeline.ts'

/** Dot angle in radians, clockwise from 12 o'clock; 0 when stopped or before beat 1. */
export function dotAngle(timeline: Timeline | null, now: number): number {
  const first = timeline?.segments[0]
  if (!timeline || !first) return 0
  let segment = first
  for (const s of timeline.segments) if (s.startTime <= now) segment = s
  const barTicks = segment.metric.beats * PPQ
  return (positionAt(timeline, now) / barTicks) * 2 * Math.PI
}
