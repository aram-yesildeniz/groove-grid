export interface AudioHost {
  ctx: AudioContext
  /** Must be called synchronously inside the user gesture. */
  resume(): Promise<void>
}

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

/** The only place an `AudioContext` is created (AD-8). It starts suspended. */
export function createAudioHost(): AudioHost {
  const session = (navigator as AudioSessionNavigator).audioSession
  if (session) session.type = 'playback'
  const ctx = new AudioContext({ latencyHint: 'interactive' })
  return { ctx, resume: () => ctx.resume() }
}
