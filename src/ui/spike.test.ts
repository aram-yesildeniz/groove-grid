import { describe, expect, it } from 'vitest'
import { parseSpike } from './spike.ts'

describe('parseSpike', () => {
  it('is off without spike=1 and ignores bpm', () => {
    expect(parseSpike('')).toEqual({ enabled: false, bpm: 80 })
    expect(parseSpike('?bpm=250')).toEqual({ enabled: false, bpm: 80 })
  })
  it('reads bpm when on', () => {
    expect(parseSpike('?spike=1&bpm=120')).toEqual({ enabled: true, bpm: 120 })
  })
  it('clamps and repairs bpm', () => {
    expect(parseSpike('?spike=1&bpm=999').bpm).toBe(250)
    expect(parseSpike('?spike=1&bpm=3').bpm).toBe(30)
    expect(parseSpike('?spike=1&bpm=abc').bpm).toBe(80)
    expect(parseSpike('?spike=1').bpm).toBe(80)
  })
})
