import { describe, expect, it } from 'vitest'
import { createHoldRepeat, type HoldTimers } from './hold-repeat.ts'

/** Manual clock: `advance` fires due timers in order. */
function fakeTimers() {
  let t = 0
  let next = 1
  const pending = new Map<number, { at: number; fn: () => void }>()
  const timers: HoldTimers = {
    setTimeout(fn, ms) {
      const id = next++
      pending.set(id, { at: t + ms, fn })
      return id
    },
    clearTimeout(handle) {
      pending.delete(handle as number)
    },
    now: () => t,
  }
  function advance(ms: number): void {
    const end = t + ms
    for (;;) {
      const due = [...pending.entries()]
        .filter(([, p]) => p.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      pending.delete(due[0])
      t = due[1].at
      due[1].fn()
    }
    t = end
  }
  return { timers, advance }
}

describe('hold repeat', () => {
  it('steps once on press and not again before 400 ms', () => {
    const { timers, advance } = fakeTimers()
    let n = 0
    const hold = createHoldRepeat(() => (n++, true), timers)
    hold.press()
    advance(399)
    expect(n).toBe(1)
  })

  it('repeats at 8/s after 400 ms, then 20/s once held 1.5 s', () => {
    const { timers, advance } = fakeTimers()
    let n = 0
    const hold = createHoldRepeat(() => (n++, true), timers)
    hold.press()
    advance(400) // first repeat
    expect(n).toBe(2)
    advance(1000) // slow phase: 125 ms apart
    expect(n).toBe(2 + 8)
    const before = n
    advance(1000) // fast phase: 50 ms apart
    expect(n - before).toBeGreaterThanOrEqual(18)
    expect(n - before).toBeLessThanOrEqual(22)
  })

  it('stops on release', () => {
    const { timers, advance } = fakeTimers()
    let n = 0
    const hold = createHoldRepeat(() => (n++, true), timers)
    hold.press()
    advance(500)
    hold.release()
    const at = n
    advance(2000)
    expect(n).toBe(at)
  })

  it('stops when step reports a limit', () => {
    const { timers, advance } = fakeTimers()
    let n = 0
    const hold = createHoldRepeat(() => ++n < 3, timers)
    hold.press()
    advance(5000)
    expect(n).toBe(3)
  })

  it('does not schedule repeats if the first step is already at the limit', () => {
    const { timers, advance } = fakeTimers()
    let n = 0
    createHoldRepeat(() => (n++, false), timers).press()
    advance(2000)
    expect(n).toBe(1)
  })
})
