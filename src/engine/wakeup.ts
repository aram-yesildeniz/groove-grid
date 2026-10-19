import type { Wakeup } from '../core/ports.ts'

/** `Wakeup` backed by a dedicated worker, so main-thread jank doesn't delay the scheduler (AD-7). */
export function createWorkerWakeup(): Wakeup {
  const worker = new Worker(new URL('./wakeup.worker.ts', import.meta.url), { type: 'module' })
  return {
    start(onWake) {
      worker.onmessage = () => onWake()
      worker.postMessage('start')
    },
    stop() {
      worker.onmessage = null
      worker.postMessage('stop')
    },
  }
}
