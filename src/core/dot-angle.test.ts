import { describe, expect, it } from 'vitest'
import { dotAngle } from './dot-angle.ts'
import { DEFAULT_SETTINGS } from './settings.ts'
import { startTimeline } from './timeline.ts'

describe('dotAngle', () => {
  const timeline = startTimeline(DEFAULT_SETTINGS, 10)
  const beat = 60 / DEFAULT_SETTINGS.bpm
  const beats = DEFAULT_SETTINGS.beats

  it('is 0 with no timeline and before the start', () => {
    expect(dotAngle(null, 5)).toBe(0)
    expect(dotAngle(timeline, 9.9)).toBe(0)
  })

  it('is 0 at the start and a full lap per bar', () => {
    expect(dotAngle(timeline, 10)).toBe(0)
    expect(dotAngle(timeline, 10 + beat * beats)).toBeCloseTo(0, 9)
  })

  it('advances one beat and half a bar', () => {
    expect(dotAngle(timeline, 10 + beat)).toBeCloseTo((2 * Math.PI) / beats, 9)
    expect(dotAngle(timeline, 10 + (beat * beats) / 2)).toBeCloseTo(Math.PI, 9)
  })
})
