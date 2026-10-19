import type { AudioOut, Bus, Wakeup } from '../core/ports.ts'

export interface PlayedSound {
  sampleId: string
  time: number
  gain: number
  bus: Bus
}

export function createFakeOut(): AudioOut & { played: PlayedSound[]; cancelled: number } {
  const fake = {
    played: [] as PlayedSound[],
    cancelled: 0,
    play(sampleId: string, time: number, gain: number, bus: Bus) {
      fake.played.push({ sampleId, time, gain, bus })
    },
    cancelAll() {
      fake.cancelled++
      fake.played.length = 0
    },
  }
  return fake
}

export function createFakeWakeup(): Wakeup & { running: boolean; wake(): void } {
  let callback: (() => void) | null = null
  return {
    get running() {
      return callback !== null
    },
    start(onWake) {
      callback = onWake
    },
    stop() {
      callback = null
    },
    wake() {
      callback?.()
    },
  }
}

export function createFakeClock(start = 0): { now(): number; advance(seconds: number): void } {
  let time = start
  return {
    now: () => time,
    advance(seconds) {
      time += seconds
    },
  }
}
