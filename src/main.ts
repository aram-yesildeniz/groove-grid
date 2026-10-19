import { mount } from 'svelte'
import { createAudioHost } from './engine/audio-context.ts'
import { createAudioOut } from './engine/audio-out.ts'
import { loadBank } from './engine/sample-bank.ts'
import { createScheduler } from './engine/scheduler.ts'
import { createWorkerWakeup } from './engine/wakeup.ts'
import App from './ui/App.svelte'

// Composition root: the only place adapters are constructed (AD-8). The context starts suspended.
const host = createAudioHost()
const bank = loadBank(host.ctx)
const out = bank.then((samples) => createAudioOut(host.ctx, samples))

const engine = createScheduler({
  out: {
    play: (...args) => void out.then((o) => o.play(...args)),
    cancelAll: () => void out.then((o) => o.cancelAll()),
  },
  wakeup: createWorkerWakeup(),
  now: () => host.ctx.currentTime,
  resume: () => host.resume(),
  ready: out,
})

mount(App, { target: document.getElementById('app')!, props: { engine } })
