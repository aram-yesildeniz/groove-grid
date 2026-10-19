import type { Settings } from './settings.ts'

/** Output buses (AD-7). Only `click` is used until markers and previews arrive. */
export type Bus = 'click' | 'marker' | 'preview'

export interface AudioOut {
  /** Plays `sampleId` at audio-clock `time` (seconds). */
  play(sampleId: string, time: number, gain: number, bus: Bus): void
  /** Stops every node handed out and not yet finished. */
  cancelAll(): void
}

/** Fires `onWake` roughly every `WAKEUP_INTERVAL` until stopped. */
export interface Wakeup {
  start(onWake: () => void): void
  stop(): void
}

export type EngineStatus = 'stopped' | 'playing' | 'paused-by-system'

export interface Pending {
  changed: (keyof Settings)[]
  settings: Settings
  atTime: number
}

export interface EnginePort {
  /** Calls `resume()` synchronously, so it must run inside the user gesture. */
  start(settings: Settings): Promise<void>
  stop(): void
  apply(settings: Settings): void
  readonly status: EngineStatus
  readonly pending: Pending | null
  subscribe(listener: () => void): () => void
}
