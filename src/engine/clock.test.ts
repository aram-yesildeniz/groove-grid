import { describe, expect, it } from 'vitest'
import { createClockReader, type ClockSource } from './clock.ts'

describe('createClockReader', () => {
  it('interpolates from the output timestamp using performance time', () => {
    const source: ClockSource = {
      currentTime: 5,
      getOutputTimestamp: () => ({ contextTime: 4.9, performanceTime: 1000 }),
    }
    const clock = createClockReader(
      source,
      () => null,
      () => 1500,
    )
    expect(clock.now()).toBeCloseTo(5.4, 9)
  })

  it('falls back to currentTime minus latencies when the timestamp is missing', () => {
    const source: ClockSource = {
      currentTime: 5,
      baseLatency: 0.01,
      outputLatency: 0.02,
      getOutputTimestamp: () => ({ contextTime: 0, performanceTime: 0 }),
    }
    expect(createClockReader(source, () => null).now()).toBeCloseTo(4.97, 9)
  })

  it('works without outputLatency or getOutputTimestamp', () => {
    expect(createClockReader({ currentTime: 2 }, () => null).now()).toBe(2)
  })

  it('never decreases', () => {
    const source: ClockSource = { currentTime: 5 }
    const clock = createClockReader(source, () => null)
    expect(clock.now()).toBe(5)
    source.currentTime = 4
    expect(clock.now()).toBe(5)
    source.currentTime = 6
    expect(clock.now()).toBe(6)
  })
})
