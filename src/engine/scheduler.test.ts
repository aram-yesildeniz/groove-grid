import { describe, expect, it, vi } from 'vitest'
import { START_LEAD, WAKEUP_INTERVAL } from '../core/constants.ts'
import { DEFAULT_SETTINGS } from '../core/settings.ts'
import { createFakeClock, createFakeOut, createFakeWakeup } from './fakes.ts'
import type { PausedReason } from '../core/ports.ts'
import { createScheduler } from './scheduler.ts'

function setup(overrides: { resume?: () => Promise<void>; ready?: Promise<unknown> } = {}) {
  let pauseListener: (reason: PausedReason) => void = () => {}
  const order: string[] = []
  const out = createFakeOut()
  const wakeup = createFakeWakeup()
  const clock = createFakeClock(10)
  const resume = vi.fn(() => {
    order.push('resume')
    return (overrides.resume ?? (() => Promise.resolve()))()
  })
  const recreate = vi.fn(() => {
    order.push('recreate')
    return Promise.resolve()
  })
  const scheduler = createScheduler({
    out,
    wakeup,
    now: clock.now,
    resume,
    ready: overrides.ready ?? Promise.resolve(),
    recreate,
    onSystemPause: (listener) => {
      pauseListener = listener
      return () => {}
    },
    audioSessionSupported: true,
    resumeTimeoutMs: 1000,
  })
  /** Runs wake-ups on the worker cadence for `seconds` of audio time. */
  const run = (seconds: number) => {
    for (let t = 0; t < seconds; t += WAKEUP_INTERVAL) {
      clock.advance(WAKEUP_INTERVAL)
      wakeup.wake()
    }
  }
  return {
    out,
    wakeup,
    clock,
    resume,
    recreate,
    order,
    scheduler,
    run,
    pause: pauseListener,
    system: (r: PausedReason) => pauseListener(r),
  }
}

const secondsPerBeat = 60 / DEFAULT_SETTINGS.bpm

describe('scheduler', () => {
  it('start calls resume synchronously, then plays beat 1 at now + START_LEAD', async () => {
    const { scheduler, resume, out, run } = setup()
    const started = scheduler.start(DEFAULT_SETTINGS)
    expect(resume).toHaveBeenCalledTimes(1)
    expect(scheduler.status).toBe('stopped')
    await started
    expect(scheduler.status).toBe('playing')
    run(WAKEUP_INTERVAL)
    expect(out.played[0]).toMatchObject({
      sampleId: 'click-beep-accent',
      time: 10 + START_LEAD,
      bus: 'click',
    })
  })

  it('accents beat 1 only and plays the other beats with the normal sample at closed-form times', async () => {
    const { scheduler, out, run } = setup()
    await scheduler.start(DEFAULT_SETTINGS)
    run(8 * secondsPerBeat)
    const ids = out.played.map((p) => p.sampleId)
    expect(ids.slice(0, 8)).toEqual([
      'click-beep-accent',
      'click-beep-normal',
      'click-beep-normal',
      'click-beep-normal',
      'click-beep-accent',
      'click-beep-normal',
      'click-beep-normal',
      'click-beep-normal',
    ])
    out.played.slice(0, 8).forEach((p, n) => {
      expect(p.time).toBeCloseTo(10 + START_LEAD + n * secondsPerBeat, 9)
    })
    expect(scheduler.skipped).toBe(0)
  })

  it('exposes the playing timeline and clears it on stop', async () => {
    const { scheduler } = setup()
    expect(scheduler.timeline).toBeNull()
    await scheduler.start(DEFAULT_SETTINGS)
    expect(scheduler.timeline?.segments[0]?.startTime).toBe(10 + START_LEAD)
    scheduler.stop()
    expect(scheduler.timeline).toBeNull()
  })

  it('waits for the sample bank before starting', async () => {
    let release!: () => void
    const ready = new Promise<void>((resolve) => (release = resolve))
    const { scheduler, wakeup } = setup({ ready })
    const started = scheduler.start(DEFAULT_SETTINGS)
    await Promise.resolve()
    expect(scheduler.status).toBe('stopped')
    expect(wakeup.running).toBe(false)
    release()
    await started
    expect(scheduler.status).toBe('playing')
  })

  it('stays stopped and warns when the bank fails to decode', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { scheduler } = setup({ ready: Promise.reject(new Error('decode')) })
    await scheduler.start(DEFAULT_SETTINGS)
    expect(scheduler.status).toBe('stopped')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('stop cancels scheduled nodes, halts the wake-up and silences later wake-ups', async () => {
    const { scheduler, out, wakeup, run } = setup()
    await scheduler.start(DEFAULT_SETTINGS)
    scheduler.stop()
    expect(scheduler.status).toBe('stopped')
    expect(out.cancelled).toBe(1)
    expect(wakeup.running).toBe(false)
    run(1)
    expect(out.played).toHaveLength(0)
  })

  it('skips and counts an event whose time already passed', async () => {
    const { scheduler, out, clock, wakeup } = setup()
    await scheduler.start(DEFAULT_SETTINGS)
    out.played.length = 0
    clock.advance(3 * secondsPerBeat)
    wakeup.wake()
    expect(scheduler.skipped).toBeGreaterThan(0)
    expect(out.played.every((p) => p.time >= clock.now())).toBe(true)
  })

  it('restart begins again from beat 1 at the new time', async () => {
    const { scheduler, out, clock, run } = setup()
    await scheduler.start(DEFAULT_SETTINGS)
    run(2)
    scheduler.stop()
    clock.advance(5)
    await scheduler.start(DEFAULT_SETTINGS)
    const startTime = clock.now() + START_LEAD
    run(WAKEUP_INTERVAL)
    expect(out.played[0]).toMatchObject({
      sampleId: 'click-beep-accent',
      time: startTime,
    })
  })

  it('ignores start while playing or already starting', async () => {
    const { scheduler, resume } = setup()
    const first = scheduler.start(DEFAULT_SETTINGS)
    void scheduler.start(DEFAULT_SETTINGS)
    await first
    await scheduler.start(DEFAULT_SETTINGS)
    expect(resume).toHaveBeenCalledTimes(1)
  })

  it('stop during a pending start prevents playback', async () => {
    const { scheduler, wakeup } = setup()
    const started = scheduler.start(DEFAULT_SETTINGS)
    scheduler.stop()
    await started
    expect(scheduler.status).toBe('stopped')
    expect(wakeup.running).toBe(false)
  })

  it('notifies subscribers on status change', async () => {
    const { scheduler } = setup()
    const listener = vi.fn()
    scheduler.subscribe(listener)
    await scheduler.start(DEFAULT_SETTINGS)
    scheduler.stop()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  describe('platform lifecycle', () => {
    it.each(['hidden', 'interrupted'] as const)(
      'stops on %s and does not resume by itself',
      async (reason) => {
        const { scheduler, out, wakeup, system, run, resume } = setup()
        await scheduler.start(DEFAULT_SETTINGS)
        system(reason)
        expect(scheduler.status).toBe('paused-by-system')
        expect(scheduler.pausedReason).toBe(reason)
        expect(scheduler.timeline).toBeNull()
        expect(wakeup.running).toBe(false)
        expect(out.cancelled).toBe(1)
        run(1)
        expect(out.played).toHaveLength(0)
        expect(resume).toHaveBeenCalledTimes(1)
      },
    )

    it('ignores system pauses while not playing', () => {
      const { scheduler, system } = setup()
      system('hidden')
      expect(scheduler.status).toBe('stopped')
      expect(scheduler.pausedReason).toBeNull()
    })

    it('treats a resume that never settles as resume-failed after the timeout', async () => {
      vi.useFakeTimers()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { scheduler, wakeup } = setup({ resume: () => new Promise(() => {}) })
      const started = scheduler.start(DEFAULT_SETTINGS)
      await vi.advanceTimersByTimeAsync(1000)
      await started
      expect(scheduler.status).toBe('paused-by-system')
      expect(scheduler.pausedReason).toBe('resume-failed')
      expect(wakeup.running).toBe(false)
      expect(scheduler.timeline).toBeNull()
      warn.mockRestore()
      vi.useRealTimers()
    })

    it('treats a rejected or throwing resume as resume-failed without throwing', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      for (const resume of [
        () => Promise.reject(new Error('no')),
        () => {
          throw new Error('closed')
        },
      ]) {
        const { scheduler } = setup({ resume })
        await scheduler.start(DEFAULT_SETTINGS)
        expect(scheduler.pausedReason).toBe('resume-failed')
      }
      warn.mockRestore()
    })

    it('recreates before resuming on Start after a pause, then plays from beat 1', async () => {
      const { scheduler, order, out, run, system } = setup()
      await scheduler.start(DEFAULT_SETTINGS)
      system('interrupted')
      order.length = 0
      const started = scheduler.start(DEFAULT_SETTINGS)
      expect(order).toEqual(['recreate', 'resume'])
      await started
      expect(scheduler.status).toBe('playing')
      expect(scheduler.pausedReason).toBeNull()
      run(WAKEUP_INTERVAL)
      expect(out.played[0]?.sampleId).toBe('click-beep-accent')
    })

    it('does not recreate on a normal Start, and stop clears the reason', async () => {
      const { scheduler, recreate, system } = setup()
      await scheduler.start(DEFAULT_SETTINGS)
      expect(recreate).not.toHaveBeenCalled()
      system('hidden')
      scheduler.stop()
      expect(scheduler.status).toBe('stopped')
      expect(scheduler.pausedReason).toBeNull()
    })

    it('rebuilds on the next Start after a bank failure', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { scheduler, recreate } = setup({ ready: Promise.reject(new Error('decode')) })
      await scheduler.start(DEFAULT_SETTINGS)
      expect(scheduler.status).toBe('stopped')
      await scheduler.start(DEFAULT_SETTINGS)
      expect(recreate).toHaveBeenCalledTimes(1)
      expect(scheduler.status).toBe('playing')
      warn.mockRestore()
    })
  })
})
