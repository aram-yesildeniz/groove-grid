export interface HoldTimers {
  setTimeout: (fn: () => void, ms: number) => unknown
  clearTimeout: (handle: unknown) => void
  now: () => number
}

const realTimers: HoldTimers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  now: () => performance.now(),
}

/** Delay before a held press starts repeating, and the two repeat speeds (UX-DR11). */
export const HOLD_DELAY_MS = 400
export const HOLD_SLOW_PER_S = 8
export const HOLD_FAST_PER_S = 20
export const HOLD_FAST_AFTER_MS = 1500

/**
 * Press-and-hold repeat. `step` returns false when it can go no further, which ends the hold.
 * The first step happens on `press`; `release` stops everything.
 */
export function createHoldRepeat(step: () => boolean, timers: HoldTimers = realTimers) {
  let handle: unknown = null
  let pressedAt = 0

  function stop(): void {
    if (handle !== null) timers.clearTimeout(handle)
    handle = null
  }

  function tick(): void {
    if (!step()) return stop()
    const fast = timers.now() - pressedAt >= HOLD_FAST_AFTER_MS
    handle = timers.setTimeout(tick, 1000 / (fast ? HOLD_FAST_PER_S : HOLD_SLOW_PER_S))
  }

  return {
    press(): void {
      stop()
      pressedAt = timers.now()
      if (!step()) return
      handle = timers.setTimeout(tick, HOLD_DELAY_MS)
    },
    release: stop,
  }
}
