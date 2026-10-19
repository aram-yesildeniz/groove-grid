import { describe, expect, it } from 'vitest'
import { PPQ } from './constants.ts'
import { DEFAULT_SETTINGS, type Settings } from './settings.ts'
import {
  eventsBetween,
  positionAt,
  startTimeline,
  tickTime,
  type CoreEvent,
  type Live,
  type Timeline,
} from './timeline.ts'

const live: Live = { grid: 4, markers: [], markerSound: null, muted: false }
const make = (over: Partial<Settings> = {}, startTime = 10) =>
  startTimeline({ ...DEFAULT_SETTINGS, ...over }, startTime)

const key = (e: CoreEvent) => `${e.kind}@${e.tick}`

describe('startTimeline / closed form', () => {
  it('computes time from the segment start, never a running sum', () => {
    const tl = make({ bpm: 120 }, 5)
    const seg = tl.segments[0]!
    expect(tickTime(seg, 0)).toBe(5)
    expect(tickTime(seg, PPQ)).toBe(5 + PPQ * (60 / (120 * PPQ)))
    const events = eventsBetween(tl, live, 5, 5 + 2.5)
    const beats = events.filter((e) => e.kind === 'click')
    expect(beats.map((e) => e.time)).toEqual([5, 5.5, 6, 6.5, 7])
  })
})

describe('eventsBetween', () => {
  it('assigns levels: beat 1 accent, other enabled beats beat', () => {
    const levels = eventsBetween(make({ beats: 3, clickBeats: [true, true, true] }), live, 10, 20)
      .filter((e) => e.kind === 'click')
      .map((e) => (e.kind === 'click' ? e.level : ''))
    expect(levels.slice(0, 4)).toEqual(['accent', 'beat', 'beat', 'accent'])
  })

  it('emits downbeats first at each bar start, even if beat 1 is disabled', () => {
    const tl = make({ beats: 2, clickBeats: [false, true] })
    const events = eventsBetween(tl, live, 10, 10 + 4.5)
    expect(events.filter((e) => e.kind === 'downbeat').map((e) => e.tick)).toEqual([
      0,
      2 * PPQ,
      4 * PPQ,
    ])
    expect(events.filter((e) => e.kind === 'click').map((e) => e.tick)).toEqual([
      PPQ,
      3 * PPQ,
      5 * PPQ,
    ])
  })

  it('puts downbeat before click at the same tick', () => {
    const [a, b] = eventsBetween(make(), live, 10, 10.001)
    expect([a?.kind, b?.kind]).toEqual(['downbeat', 'click'])
  })

  it('places between-beat clicks only inside enabled beats', () => {
    const tl = make({ beats: 2, clickBeats: [true, false], betweenBeats: 3 })
    const clicks = eventsBetween(tl, live, 10, 10 + (2 * 60) / 80).filter((e) => e.kind === 'click')
    expect(clicks.map((e) => [e.tick, e.kind === 'click' ? e.level : ''])).toEqual([
      [0, 'accent'],
      [320, 'sub'],
      [640, 'sub'],
    ])
  })

  it('has no between-beat clicks for betweenBeats 1 and no clicks on disabled beats', () => {
    const tl = make({ beats: 4, clickBeats: [false, true, false, false] })
    const ticks = eventsBetween(tl, live, 10, 10 + (60 / 80) * 4).filter((e) => e.kind === 'click')
    expect(ticks.map((e) => e.tick)).toEqual([PPQ])
  })

  it('is empty for an empty or reversed window and clamps before start', () => {
    const tl = make()
    expect(eventsBetween(tl, live, 12, 12)).toEqual([])
    expect(eventsBetween(tl, live, 12, 11)).toEqual([])
    expect(eventsBetween(tl, live, 0, 9.99)).toEqual([])
  })

  it('partitions with no duplicate or missing event for awkward window edges', () => {
    const tl = make({ bpm: 137, beats: 5, betweenBeats: 3 }, 0.1234567)
    const whole = eventsBetween(tl, live, 0, 30).map(key)
    const parts: string[] = []
    let t = 0
    let i = 1
    while (t < 30) {
      const next = Math.min(30, t + 0.0173 * ((i++ % 7) + 1))
      parts.push(...eventsBetween(tl, live, t, next).map(key))
      t = next
    }
    expect(parts).toEqual(whole)
    expect(new Set(whole).size).toBe(whole.length)
  })

  it('includes an event sitting exactly on a window edge in exactly one window', () => {
    const tl = make({ bpm: 120 }, 0)
    const edge = tickTime(tl.segments[0]!, 2 * PPQ)
    const a = eventsBetween(tl, live, 0, edge).map(key)
    const b = eventsBetween(tl, live, edge, edge + 0.1).map(key)
    expect(a).not.toContain('click@1920')
    expect(b).toContain('click@1920')
  })

  it('decides segment boundaries in ticks across a two-segment timeline', () => {
    const base = make({ bpm: 100, beats: 4 }, 0)
    const first = base.segments[0]!
    const boundaryTick = 2 * PPQ
    const second = {
      ...first,
      startTick: boundaryTick,
      startTime: tickTime(first, boundaryTick),
      barOriginTick: boundaryTick,
      metric: { ...first.metric, bpm: 200, beats: 2, clickBeats: [true, true] },
    }
    const tl: Timeline = { segments: [first, second] }
    const whole = eventsBetween(tl, live, 0, 10)
    const ticks = whole.filter((e) => e.kind === 'click').map((e) => e.tick)
    expect(ticks.slice(0, 6)).toEqual([0, PPQ, 2 * PPQ, 3 * PPQ, 4 * PPQ, 5 * PPQ])
    expect(
      whole
        .filter((e) => e.kind === 'downbeat')
        .map((e) => e.tick)
        .slice(0, 3),
    ).toEqual([0, 2 * PPQ, 4 * PPQ])
    const edge = second.startTime
    const parts = [...eventsBetween(tl, live, 0, edge), ...eventsBetween(tl, live, edge, 10)].map(
      key,
    )
    expect(parts).toEqual(whole.map(key))
    expect(new Set(parts).size).toBe(parts.length)
  })
})

describe('positionAt', () => {
  it('clamps to 0 before the start', () => {
    expect(positionAt(make(), 3)).toBe(0)
    expect(positionAt(make(), 10)).toBe(0)
  })

  it('returns a fractional tick within the bar and wraps', () => {
    const tl = make({ bpm: 120, beats: 4 }, 0)
    expect(positionAt(tl, 0.25)).toBeCloseTo(PPQ / 2, 6)
    expect(positionAt(tl, 2)).toBeCloseTo(0, 6)
    expect(positionAt(tl, 2.25)).toBeCloseTo(PPQ / 2, 6)
  })
})
