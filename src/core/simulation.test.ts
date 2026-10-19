import { describe, expect, it } from 'vitest'
import { PPQ } from './constants.ts'
import { plan, createPlanState } from './plan.ts'
import { DEFAULT_SETTINGS } from './settings.ts'
import { startTimeline, type CoreEvent, type Live } from './timeline.ts'

const live: Live = { grid: 4, markers: [], markerSound: null, muted: false }
const THIRTY_MIN = 30 * 60

describe.each([30, 120, 250])('30-minute run at %i BPM', (bpm) => {
  it('matches the closed form with no duplicate or missing event', () => {
    const startTime = 0.3
    const settings = {
      ...DEFAULT_SETTINGS,
      bpm,
      beats: 7,
      clickBeats: Array(7).fill(true),
      betweenBeats: 3 as const,
    }
    let state = createPlanState(startTimeline(settings, startTime), live)
    const events: CoreEvent[] = []
    for (let now = 0; now <= THIRTY_MIN; now += 0.025) {
      const r = plan(state, now)
      state = r.state
      events.push(...r.events)
    }

    const spt = 60 / (bpm * PPQ)
    const expectedTick = (n: number) => n * (PPQ / 3)
    let prevTime = -Infinity
    let prevTick = -1
    let clicks = 0
    let downbeats = 0
    for (const e of events) {
      expect(e.time).toBe(startTime + (e.tick - 0) * spt)
      expect(e.time).toBeGreaterThanOrEqual(prevTime)
      expect(e.tick).toBeGreaterThanOrEqual(prevTick)
      if (e.kind === 'downbeat') {
        downbeats++
        expect(e.tick % (7 * PPQ)).toBe(0)
      } else {
        expect(e.tick % (PPQ / 3)).toBe(0)
        clicks++
      }
      prevTime = e.time
      prevTick = e.tick
    }

    const lastTick = events[events.length - 1]!.tick
    const candidates = lastTick / (PPQ / 3) + 1
    expect(clicks).toBe(candidates)
    expect(expectedTick(candidates - 1)).toBe(lastTick)
    expect(downbeats).toBe(Math.floor(lastTick / (7 * PPQ)) + 1)
    expect(events.length).toBe(clicks + downbeats)
  })
})
