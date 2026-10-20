import { describe, expect, it } from 'vitest'
import { parseSpike } from './spike.ts'

describe('parseSpike', () => {
  it('is on only with spike=1', () => {
    expect(parseSpike('?spike=1')).toEqual({ enabled: true })
    expect(parseSpike('')).toEqual({ enabled: false })
    expect(parseSpike('?spike=0')).toEqual({ enabled: false })
  })
  it('ignores the removed bpm hook', () => {
    expect(parseSpike('?spike=1&bpm=250')).toEqual({ enabled: true })
  })
})
