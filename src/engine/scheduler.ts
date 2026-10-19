import { START_LEAD } from '../core/constants.ts'
import { createPlanState, plan, type PlanState } from '../core/plan.ts'
import type { AudioOut, EnginePort, EngineStatus, Pending, Wakeup } from '../core/ports.ts'
import { DEFAULT_SETTINGS, type Settings } from '../core/settings.ts'
import { startTimeline, type ClickLevel, type Live } from '../core/timeline.ts'
import { clickSampleId } from './sample-bank.ts'

export interface SchedulerDeps {
  out: AudioOut
  wakeup: Wakeup
  /** Raw audio-clock `currentTime` in seconds. */
  now: () => number
  /** Called synchronously inside `start`, before any await; resolves once audio is running. */
  resume: () => Promise<void>
  /** Resolves when the sample bank is decoded. */
  ready: Promise<unknown>
}

export interface Scheduler extends EnginePort {
  /** Events dropped because their time had already passed (AD-7). */
  readonly skipped: number
}

const LEVEL_GAIN: Record<ClickLevel, number> = { accent: 1, beat: 0.7, sub: 0.45 }

export function createScheduler(deps: SchedulerDeps): Scheduler {
  const { out, wakeup, now, resume, ready } = deps
  const listeners = new Set<() => void>()
  let status: EngineStatus = 'stopped'
  let settings: Settings = DEFAULT_SETTINGS
  let state: PlanState | null = null
  let skipped = 0
  let starting = false
  /** Bumped by `stop` so a `start` still waiting on audio can tell it was cancelled. */
  let generation = 0

  function setStatus(next: EngineStatus): void {
    status = next
    for (const listener of listeners) listener()
  }

  function onWake(): void {
    if (!state) return
    const current = now()
    const planned = plan(state, current)
    state = planned.state
    for (const event of planned.events) {
      if (event.kind !== 'click') continue
      if (event.time < current) {
        skipped++
        continue
      }
      out.play(
        clickSampleId(settings.clickSound, event.level),
        event.time,
        LEVEL_GAIN[event.level],
        'click',
      )
    }
  }

  return {
    get status() {
      return status
    },
    get pending(): Pending | null {
      return null
    },
    get skipped() {
      return skipped
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    apply(next) {
      settings = next
    },
    async start(next) {
      if (status === 'playing' || starting) return
      starting = true
      const mine = generation
      settings = next
      const resumed = resume()
      try {
        await Promise.all([resumed, ready])
      } catch (error) {
        console.warn('Audio failed to start', error)
        starting = false
        return
      }
      starting = false
      if (mine !== generation) return
      const live: Live = {
        grid: next.grid,
        markers: next.markers,
        markerSound: next.markerSound,
        muted: next.muted,
      }
      state = createPlanState(startTimeline(next, now() + START_LEAD), live)
      setStatus('playing')
      wakeup.start(onWake)
      onWake()
    },
    stop() {
      generation++
      wakeup.stop()
      out.cancelAll()
      state = null
      if (status !== 'stopped') setStatus('stopped')
    },
  }
}
