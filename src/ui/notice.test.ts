import { describe, expect, it } from 'vitest'
import { deriveNotice, isIos, PAUSED_NOTICE, SILENT_SWITCH_HINT } from './notice.ts'

describe('deriveNotice', () => {
  it.each(['interrupted', 'resume-failed'] as const)(
    'shows the paused notice for %s',
    (pausedReason) => {
      expect(deriveNotice({ status: 'paused-by-system', pausedReason, silentHint: false })).toBe(
        PAUSED_NOTICE,
      )
    },
  )

  it('shows nothing for hidden', () => {
    expect(
      deriveNotice({ status: 'paused-by-system', pausedReason: 'hidden', silentHint: false }),
    ).toBe('')
  })

  it('prefers the audio notice over the silent-switch hint', () => {
    expect(
      deriveNotice({ status: 'paused-by-system', pausedReason: 'interrupted', silentHint: true }),
    ).toBe(PAUSED_NOTICE)
    expect(deriveNotice({ status: 'playing', pausedReason: null, silentHint: true })).toBe(
      SILENT_SWITCH_HINT,
    )
  })
})

describe('isIos', () => {
  it('detects iPhone and iPadOS-as-Mac, not desktops', () => {
    expect(
      isIos({ userAgent: 'Mozilla/5.0 (iPhone; CPU)', platform: 'iPhone', maxTouchPoints: 5 }),
    ).toBe(true)
    expect(
      isIos({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }),
    ).toBe(true)
    expect(
      isIos({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }),
    ).toBe(false)
    expect(
      isIos({ userAgent: 'Mozilla/5.0 (X11; Linux)', platform: 'Linux x86_64', maxTouchPoints: 0 }),
    ).toBe(false)
  })
})
