import { BPM_MAX, BPM_MIN } from '../core/constants.ts'
import { DEFAULT_SETTINGS, normalize, type Settings } from '../core/settings.ts'

/** The one settings owner (AD-4). Every change goes through a named action and `normalize`. */
export function createSettingsStore(initial: Settings = DEFAULT_SETTINGS) {
  let current = $state<Settings>(normalize(initial))
  let listeners: ((settings: Settings) => void)[] = []

  function commit(next: Settings): void {
    const normalized = normalize(next)
    if (JSON.stringify(normalized) === JSON.stringify(current)) return
    current = normalized
    for (const listener of listeners) listener(current)
  }

  return {
    /** Reactive snapshot for the UI; never mutate it. */
    get current(): Settings {
      return current
    },
    /** Called after every change. Returns an unsubscribe. */
    subscribe(listener: (settings: Settings) => void): () => void {
      listeners = [...listeners, listener]
      return () => {
        listeners = listeners.filter((l) => l !== listener)
      }
    },
    setTempo(bpm: number): void {
      if (!Number.isFinite(bpm)) return
      commit({ ...current, bpm })
    },
    /** Steps tempo by `delta`; returns whether another step in that direction is possible. */
    stepTempo(delta: number): boolean {
      this.setTempo(current.bpm + delta)
      return delta > 0 ? current.bpm < BPM_MAX : current.bpm > BPM_MIN
    },
  }
}

export const settingsStore = createSettingsStore()
