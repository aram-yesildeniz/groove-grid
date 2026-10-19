import { WAKEUP_INTERVAL } from '../core/constants.ts'

let timer: ReturnType<typeof setInterval> | undefined

self.onmessage = (event: MessageEvent<'start' | 'stop'>) => {
  clearInterval(timer)
  timer = undefined
  if (event.data === 'start') {
    timer = setInterval(() => postMessage('wake'), WAKEUP_INTERVAL * 1000)
  }
}
