import { mount } from 'svelte'
import { createClockReader } from './engine/clock.ts'
import { createAudioHost } from './engine/audio-context.ts'
import { createAudioOut } from './engine/audio-out.ts'
import { loadBank } from './engine/sample-bank.ts'
import { createScheduler } from './engine/scheduler.ts'
import { createWorkerWakeup } from './engine/wakeup.ts'
import { createFrameRecorder, createGapRecorder, probeWakeup } from './engine/spike-probe.ts'
import { WAKEUP_INTERVAL } from './core/constants.ts'
import App from './ui/App.svelte'
import { parseSpike } from './ui/spike.ts'

// Composition root: the only place adapters are constructed (AD-8). The context starts suspended.
const host = createAudioHost()

/** Decodes the bank against the current context and builds the output on it. */
function buildOut() {
  const built = loadBank(host.ctx).then((samples) => createAudioOut(host.ctx, samples))
  built.catch(() => {}) // the engine reports and retries on Start
  return built
}
let out = buildOut()

const spikeParams = parseSpike(location.search)
const wakeGaps = createGapRecorder(WAKEUP_INTERVAL * 2000)
const frames = createFrameRecorder()
const baseWakeup = createWorkerWakeup()

const engine = createScheduler({
  out: {
    play: (...args) => void out.then((o) => o.play(...args)),
    cancelAll: () => void out.then((o) => o.cancelAll()),
  },
  wakeup: spikeParams.enabled
    ? probeWakeup(baseWakeup, wakeGaps, () => performance.now())
    : baseWakeup,
  now: () => host.ctx.currentTime,
  resume: () => host.resume(),
  ready: out,
  recreate: () => {
    host.recreate()
    out = buildOut()
    return out
  },
  onSystemPause: host.onSystemPause,
  audioSessionSupported: host.audioSessionSupported,
})

const clock = createClockReader(
  () => host.ctx,
  () => engine.timeline,
)

mount(App, {
  target: document.getElementById('app')!,
  props: {
    engine,
    clock,
    spike: spikeParams.enabled
      ? {
          bpm: spikeParams.bpm,
          snapshot: () => ({
            bpm: spikeParams.bpm,
            skipped: engine.skipped,
            wakeups: wakeGaps.stats(),
            frames: frames.stats(),
          }),
          onFrame: (t: number) => frames.mark(t),
        }
      : null,
  },
})
