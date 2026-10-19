import { describe, expect, it } from 'vitest'
import { pointOnRing, ringRadius } from './geometry.ts'

describe('pointOnRing', () => {
  const size = 300
  const r = ringRadius(size)
  const p = { x: 0, y: 0 }

  it("puts angle 0 at 12 o'clock", () => {
    pointOnRing(size, 0, p)
    expect(p.x).toBeCloseTo(150, 9)
    expect(p.y).toBeCloseTo(150 - r, 9)
  })

  it("goes clockwise: a quarter turn is 3 o'clock", () => {
    pointOnRing(size, Math.PI / 2, p)
    expect(p.x).toBeCloseTo(150 + r, 9)
    expect(p.y).toBeCloseTo(150, 9)
  })

  it("half a turn is 6 o'clock", () => {
    pointOnRing(size, Math.PI, p)
    expect(p.x).toBeCloseTo(150, 9)
    expect(p.y).toBeCloseTo(150 + r, 9)
  })
})
