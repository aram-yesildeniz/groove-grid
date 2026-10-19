import { describe, expect, it } from 'vitest'
import { clickSampleId, sampleUrl } from './sample-bank.ts'

describe('sample bank ids', () => {
  it('builds URLs from the base path', () => {
    expect(sampleUrl('click-beep-accent', '/')).toBe('/sounds/click-beep-accent.wav')
    expect(sampleUrl('click-beep-accent', '/app/')).toBe('/app/sounds/click-beep-accent.wav')
  })

  it('accent uses the accent sample; beat and sub use the normal one', () => {
    expect(clickSampleId('beep', 'accent')).toBe('click-beep-accent')
    expect(clickSampleId('beep', 'beat')).toBe('click-beep-normal')
    expect(clickSampleId('beep', 'sub')).toBe('click-beep-normal')
  })
})
