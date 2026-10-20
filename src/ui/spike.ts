import { BPM_MAX, BPM_MIN } from '../core/constants.ts'
import { DEFAULT_SETTINGS } from '../core/settings.ts'

export interface SpikeParams {
  enabled: boolean
  bpm: number
}

/** Reads the spike-only URL hook (AD-13): `?spike=1&bpm=N`. `bpm` is ignored unless `spike=1`. */
export function parseSpike(search: string): SpikeParams {
  const params = new URLSearchParams(search)
  if (params.get('spike') !== '1') return { enabled: false, bpm: DEFAULT_SETTINGS.bpm }
  const raw = Number(params.get('bpm'))
  if (!params.get('bpm') || !Number.isFinite(raw))
    return { enabled: true, bpm: DEFAULT_SETTINGS.bpm }
  return { enabled: true, bpm: Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(raw))) }
}

/** What the spike panel and Copy JSON report; gathered by `main.ts` from the probes. */
export interface SpikeSnapshot {
  bpm: number
  skipped: number
  wakeups: { count: number; meanMs: number; maxMs: number; late: number }
  frames: { frames: number; medianMs: number; maxMs: number; long: number; pauses: number }
}

/** Wiring `main.ts` hands to the app when the hook is on. */
export interface SpikeHooks {
  bpm: number
  snapshot: () => SpikeSnapshot
  onFrame: (timeMs: number) => void
}
