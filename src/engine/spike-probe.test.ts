import { describe, expect, it } from 'vitest'
import { createFrameRecorder, createGapRecorder, probeWakeup } from './spike-probe.ts'

describe('gap recorder', () => {
  it('counts gaps, mean, max and late', () => {
    const r = createGapRecorder(50)
    for (const t of [0, 25, 50, 150, 175]) r.mark(t)
    expect(r.stats()).toEqual({ count: 4, meanMs: 43.75, maxMs: 100, late: 1 })
  })
  it('does not count the gap across a reset', () => {
    const r = createGapRecorder(50)
    r.mark(0)
    r.reset()
    r.mark(5000)
    expect(r.stats().count).toBe(0)
  })
  it('is empty before two marks', () => {
    const r = createGapRecorder(50)
    r.mark(5)
    expect(r.stats().count).toBe(0)
  })
})

describe('frame recorder', () => {
  it('flags frames over 1.5x the median', () => {
    const r = createFrameRecorder()
    let t = 0
    for (let i = 0; i < 20; i++) r.mark((t += 17))
    r.mark((t += 40))
    expect(r.stats()).toMatchObject({ frames: 20, medianMs: 17, maxMs: 40, long: 1, pauses: 0 })
  })
  it('counts a hidden-page gap as a pause, not stutter', () => {
    const r = createFrameRecorder()
    r.mark(0)
    r.mark(17)
    r.mark(5017)
    expect(r.stats()).toMatchObject({ frames: 1, long: 0, pauses: 1 })
  })
})

describe('probeWakeup', () => {
  it('timestamps each wake and forwards it', () => {
    let fire = () => {}
    const inner = { start: (cb: () => void) => (fire = cb), stop: () => {} }
    const r = createGapRecorder(50)
    let clock = 0
    let woke = 0
    probeWakeup(inner, r, () => clock).start(() => woke++)
    fire()
    clock = 30
    fire()
    expect(woke).toBe(2)
    expect(r.stats().count).toBe(1)
  })
})
