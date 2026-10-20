export interface SpikeParams {
  enabled: boolean
}

/** Reads the spike-only URL hook (AD-13): `?spike=1` shows the on-screen log. */
export function parseSpike(search: string): SpikeParams {
  return { enabled: new URLSearchParams(search).get('spike') === '1' }
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
  snapshot: () => SpikeSnapshot
  onFrame: (timeMs: number) => void
}
