import type { EngineStatus, PausedReason } from '../core/ports.ts'

export const PAUSED_NOTICE = 'Sound paused. Tap Start to play again.'
export const SILENT_SWITCH_HINT = 'No sound? Check the silent switch.'

/** One notice at a time; audio notice outranks the silent-switch hint (FR26). */
export function deriveNotice(input: {
  status: EngineStatus
  pausedReason: PausedReason | null
  silentHint: boolean
}): string {
  const { status, pausedReason, silentHint } = input
  if (status === 'paused-by-system' && pausedReason !== null && pausedReason !== 'hidden') {
    return PAUSED_NOTICE
  }
  return silentHint ? SILENT_SWITCH_HINT : ''
}

/** True on iPhone, iPad and iPod, including iPadOS reporting as a Mac. */
export function isIos(nav: Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  return (
    /iPhone|iPad|iPod/.test(nav.userAgent) ||
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  )
}
