import type { EnginePort } from '../core/ports.ts'

interface Sentinel {
  release(): Promise<void>
}
export interface WakeLockNavigator {
  wakeLock?: { request(type: 'screen'): Promise<Sentinel> }
}

/** Holds a screen wake lock exactly while the engine is playing. Failures are silent. Returns dispose. */
export function createWakeLock(
  nav: WakeLockNavigator,
  engine: Pick<EnginePort, 'status' | 'subscribe'>,
): () => void {
  let sentinel: Sentinel | null = null
  let wanted = false

  const release = () => {
    const held = sentinel
    sentinel = null
    void held?.release().catch(() => {})
  }

  const sync = () => {
    const playing = engine.status === 'playing'
    if (playing === wanted) return
    wanted = playing
    if (!playing) return release()
    try {
      void nav.wakeLock
        ?.request('screen')
        .then((granted) => {
          // Stopped (or restarted) before the grant arrived.
          if (!wanted || sentinel) void granted.release().catch(() => {})
          else sentinel = granted
        })
        .catch(() => {})
    } catch {
      // unsupported or denied
    }
  }

  const unsubscribe = engine.subscribe(sync)
  sync()
  return () => {
    unsubscribe()
    wanted = false
    release()
  }
}
