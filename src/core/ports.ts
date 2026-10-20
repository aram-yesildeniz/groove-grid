import type { Settings } from './settings.ts'
import type { Timeline } from './timeline.ts'

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

/** Why the system stopped playback (AD-8). */
export type PausedReason = 'hidden' | 'interrupted' | 'resume-failed'

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
  readonly pausedReason: PausedReason | null
  /** False where `navigator.audioSession` is missing. */
  readonly audioSessionSupported: boolean
  readonly pending: Pending | null
  subscribe(listener: () => void): () => void
}

/** What visuals may know about time (AD-1). */
export interface ClockReader {
  /** Audible audio-clock seconds; never decreases. */
  now(): number
  /** The timeline being played, or null while stopped. */
  timeline(): Timeline | null
}
