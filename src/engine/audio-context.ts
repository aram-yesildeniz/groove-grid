import type { PausedReason } from '../core/ports.ts'

export interface AudioHost {
  /** The current context; replaced by `recreate`. */
  readonly ctx: AudioContext
  readonly audioSessionSupported: boolean
  /** Must be called synchronously inside the user gesture. */
  resume(): Promise<void>
  /** Creates a fresh suspended context and closes the old one without awaiting. */
  recreate(): void
  /** Reports page-hidden and context `interrupted`/`suspended` transitions. Returns an unsubscribe. */
  onSystemPause(listener: (reason: PausedReason) => void): () => void
}

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

/** The only place an `AudioContext` is created (AD-8). It starts suspended. */
export function createAudioHost(): AudioHost {
  const session = (navigator as AudioSessionNavigator).audioSession
  const listeners = new Set<(reason: PausedReason) => void>()
  const emit = (reason: PausedReason) => {
    for (const listener of listeners) listener(reason)
  }

  function create(): AudioContext {
    if (session) session.type = 'playback'
    const created = new AudioContext({ latencyHint: 'interactive' })
    created.addEventListener('statechange', () => {
      // Only the current context counts; a closed predecessor reports `closed`.
      if (created !== ctx) return
      if ((created.state as string) === 'interrupted' || created.state === 'suspended') {
        emit('interrupted')
      }
    })
    return created
  }

  let ctx = create()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') emit('hidden')
  })

  return {
    get ctx() {
      return ctx
    },
    audioSessionSupported: session !== undefined,
    resume: () => ctx.resume(),
    recreate() {
      const old = ctx
      ctx = create()
      void old.close().catch(() => {})
    },
    onSystemPause(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
