import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalize } from './settings.ts'

describe('normalize', () => {
  it('returns defaults for non-objects', () => {
    for (const input of [undefined, null, 5, 'x', [], true]) {
      expect(normalize(input)).toEqual(DEFAULT_SETTINGS)
    }
  })

  it('round-trips valid settings', () => {
    const s = {
      ...DEFAULT_SETTINGS,
      bpm: 133,
      beats: 3,
      beatUnit: 8 as const,
      grid: 3 as const,
      clickBeats: [true, false, true],
      betweenBeats: 2 as const,
      clickSound: 'stick' as const,
      markerSound: 'conga' as const,
      markers: [0, 320, 1920],
      muted: true,
    }
    expect(normalize(JSON.parse(JSON.stringify(s)))).toEqual(s)
  })

  it('rounds and clamps numbers', () => {
    expect(normalize({ bpm: 999 }).bpm).toBe(250)
    expect(normalize({ bpm: 1 }).bpm).toBe(30)
    expect(normalize({ bpm: 90.6 }).bpm).toBe(91)
    expect(normalize({ bpm: NaN }).bpm).toBe(80)
    expect(normalize({ beats: 0 }).beats).toBe(1)
    expect(normalize({ beats: 40 }).beats).toBe(16)
    expect(normalize({ bpm: '120' }).bpm).toBe(80)
  })

  it('resizes clickBeats to beats and keeps at least one on', () => {
    expect(normalize({ beats: 3, clickBeats: [false] }).clickBeats).toEqual([false, true, true])
    expect(normalize({ beats: 2, clickBeats: [true, false, false, true] }).clickBeats).toEqual([
      true,
      false,
    ])
    expect(normalize({ beats: 3, clickBeats: [false, false, false] }).clickBeats).toEqual([
      true,
      false,
      false,
    ])
    expect(normalize({ beats: 2, clickBeats: 'x' }).clickBeats).toEqual([true, true])
  })

  it('replaces invalid ids and divisions with defaults', () => {
    const s = normalize({
      grid: 5,
      betweenBeats: 7,
      clickSound: 'gong',
      markerSound: 'x',
      beatUnit: 16,
    })
    expect(s).toMatchObject({
      grid: 4,
      betweenBeats: 1,
      clickSound: 'beep',
      markerSound: null,
      beatUnit: 4,
    })
  })

  it('filters markers to integer ticks on a grid line, sorted and unique', () => {
    const s = normalize({
      beats: 2,
      grid: 2,
      markers: [960, 480, 480, 100, -480, 1920, 2400, 1.5, '480', 0],
    })
    expect(s.markers).toEqual([0, 480, 960])
  })

  it('does not mutate its input', () => {
    const input = { beats: 2, clickBeats: [true], markers: [480, 0] }
    const copy = JSON.parse(JSON.stringify(input))
    normalize(input)
    expect(input).toEqual(copy)
  })
})
