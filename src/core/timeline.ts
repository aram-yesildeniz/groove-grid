import { PPQ, type ClickSoundId, type MarkerSoundId } from './constants.ts'
import type { Division, Settings } from './settings.ts'

/** The metric fields a segment carries (AD-2). */
export interface Metric {
  bpm: number
  beats: number
  beatUnit: 4 | 8
  clickBeats: readonly boolean[]
  betweenBeats: Division
  clickSound: ClickSoundId
}

/** Covers `[startTick, next segment's startTick)`; `startTime` is stored once at creation. */
export interface Segment {
  startTick: number
  startTime: number
  barOriginTick: number
  metric: Metric
}

export interface Timeline {
  readonly segments: readonly Segment[]
}

/** Fields that apply to events not yet committed; kept outside the timeline (AD-2). */
export interface Live {
  grid: Division
  markers: readonly number[]
  markerSound: MarkerSoundId | null
  muted: boolean
}

export type ClickLevel = 'accent' | 'beat' | 'sub'

export type CoreEvent =
  | { kind: 'click'; time: number; tick: number; level: ClickLevel }
  | { kind: 'downbeat'; time: number; tick: number }

export function secondsPerTick(metric: Metric): number {
  return 60 / (metric.bpm * PPQ)
}

/** Closed-form time of an absolute tick within a segment (AD-1). */
export function tickTime(segment: Segment, tick: number): number {
  return segment.startTime + (tick - segment.startTick) * secondsPerTick(segment.metric)
}

export function startTimeline(settings: Settings, startTime: number): Timeline {
  const { bpm, beats, beatUnit, clickBeats, betweenBeats, clickSound } = settings
  return {
    segments: [
      {
        startTick: 0,
        startTime,
        barOriginTick: 0,
        metric: { bpm, beats, beatUnit, clickBeats: [...clickBeats], betweenBeats, clickSound },
      },
    ],
  }
}

/**
 * Smallest multiple index `m` (tick = m × step) whose closed-form time is >= `time`.
 * Estimated, then corrected against `tickTime`, so one monotone predicate serves every window.
 */
function firstIndexAtOrAfter(segment: Segment, step: number, time: number): number {
  const spt = secondsPerTick(segment.metric)
  let m = Math.ceil((segment.startTick + (time - segment.startTime) / spt) / step)
  while (tickTime(segment, (m - 1) * step) >= time) m--
  while (tickTime(segment, m * step) < time) m++
  return m
}

function eventsAtTick(segment: Segment, tick: number): CoreEvent[] {
  const { beats, clickBeats } = segment.metric
  const barTicks = beats * PPQ
  const barTick = (((tick - segment.barOriginTick) % barTicks) + barTicks) % barTicks
  const time = tickTime(segment, tick)
  const events: CoreEvent[] = []
  if (barTick === 0) events.push({ kind: 'downbeat', time, tick })
  if (clickBeats[Math.floor(barTick / PPQ)]) {
    const level: ClickLevel = barTick % PPQ !== 0 ? 'sub' : barTick === 0 ? 'accent' : 'beat'
    events.push({ kind: 'click', time, tick, level })
  }
  return events
}

/** Events with `t0 <= time < t1`, ordered by tick (downbeat before click). `live` is reserved for marker events. */
export function eventsBetween(timeline: Timeline, live: Live, t0: number, t1: number): CoreEvent[] {
  void live
  const events: CoreEvent[] = []
  timeline.segments.forEach((segment, i) => {
    const next = timeline.segments[i + 1]
    const step = PPQ / segment.metric.betweenBeats
    const from = Math.max(
      firstIndexAtOrAfter(segment, step, t0),
      Math.ceil(segment.startTick / step),
    )
    const to = firstIndexAtOrAfter(segment, step, t1)
    for (let m = from; m < to; m++) {
      const tick = m * step
      if (next && tick >= next.startTick) break
      events.push(...eventsAtTick(segment, tick))
    }
  })
  return events
}

/** Fractional tick within the bar at audio time `t`; 0 before the timeline starts. */
export function positionAt(timeline: Timeline, t: number): number {
  const first = timeline.segments[0]
  if (!first || t <= first.startTime) return 0
  let segment = first
  for (const s of timeline.segments) if (s.startTime <= t) segment = s
  const absTick = segment.startTick + (t - segment.startTime) / secondsPerTick(segment.metric)
  const barTicks = segment.metric.beats * PPQ
  const pos = (absTick - segment.barOriginTick) % barTicks
  return pos < 0 ? pos + barTicks : pos
}
