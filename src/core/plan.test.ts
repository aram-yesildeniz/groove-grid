import { describe, expect, it } from 'vitest'
import { LOOKAHEAD } from './constants.ts'
import { plan, createPlanState } from './plan.ts'
import { DEFAULT_SETTINGS } from './settings.ts'
import { startTimeline, type Live } from './timeline.ts'

const live: Live = { grid: 4, markers: [], markerSound: null, muted: false }
const fresh = () => createPlanState(startTimeline({ ...DEFAULT_SETTINGS, bpm: 120 }, 1), live)

describe('plan', () => {
  it('returns events for [committedUntil, now + LOOKAHEAD) and commits the window end', () => {
    const s0 = fresh()
    const { events, state } = plan(s0, 1)
    expect(state.committedUntil).toBe(1 + LOOKAHEAD)
    expect(events.map((e) => e.time).every((t) => t >= 1 && t < 1 + LOOKAHEAD)).toBe(true)
    expect(events.map((e) => e.kind)).toEqual(['downbeat', 'click'])
    expect(s0.committedUntil).toBe(1)
  })

  it('returns nothing and keeps committedUntil when the window is empty', () => {
    const s = plan(fresh(), 1.5).state
    const again = plan(s, 1.0)
    expect(again.events).toEqual([])
    expect(again.state.committedUntil).toBe(s.committedUntil)
    expect(plan(s, s.committedUntil - LOOKAHEAD).events).toEqual([])
  })

  it('never emits an event twice across successive plans', () => {
    let state = fresh()
    const seen = new Set<string>()
    for (let now = 0.9; now < 6; now += 0.025) {
      const r = plan(state, now)
      state = r.state
      for (const e of r.events) {
        const k = `${e.kind}@${e.tick}`
        expect(seen.has(k)).toBe(false)
        seen.add(k)
      }
    }
    expect(seen.size).toBeGreaterThan(10)
  })
})
