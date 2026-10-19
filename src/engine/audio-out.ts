import type { AudioOut, Bus } from '../core/ports.ts'
import type { SampleBank } from './sample-bank.ts'

const BUSES: readonly Bus[] = ['click', 'marker', 'preview']

/** Web Audio implementation of `AudioOut` (AD-7). */
export function createAudioOut(ctx: AudioContext, bank: SampleBank): AudioOut {
  const buses = new Map<Bus, GainNode>()
  for (const bus of BUSES) {
    const node = ctx.createGain()
    node.connect(ctx.destination)
    buses.set(bus, node)
  }
  const live = new Set<AudioBufferSourceNode>()

  return {
    play(sampleId, time, gain, bus) {
      const buffer = bank.get(sampleId)
      const out = buses.get(bus)
      if (!buffer || !out) return
      const source = ctx.createBufferSource()
      const level = ctx.createGain()
      level.gain.value = gain
      source.buffer = buffer
      source.connect(level).connect(out)
      source.onended = () => {
        live.delete(source)
        source.disconnect()
        level.disconnect()
      }
      live.add(source)
      source.start(time)
    },
    cancelAll() {
      for (const source of live) {
        source.onended = null
        try {
          source.stop()
        } catch {
          // already finished
        }
        source.disconnect()
      }
      live.clear()
    },
  }
}
