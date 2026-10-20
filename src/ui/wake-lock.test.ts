import { describe, expect, it, vi } from 'vitest'
import type { EngineStatus } from '../core/ports.ts'
import { createWakeLock } from './wake-lock.ts'

function setup(request: () => Promise<{ release: () => Promise<void> }>) {
  let status: EngineStatus = 'stopped'
  const listeners = new Set<() => void>()
  const engine = {
    get status() {
      return status
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
  const set = (next: EngineStatus) => {
    status = next
    listeners.forEach((l) => l())
  }
  createWakeLock({ wakeLock: { request } }, engine)
  return { set }
}

describe('createWakeLock', () => {
  it('requests on playing and releases on any other status', async () => {
    const release = vi.fn(() => Promise.resolve())
    const request = vi.fn(() => Promise.resolve({ release }))
    const { set } = setup(request)
    set('playing')
    await Promise.resolve()
    expect(request).toHaveBeenCalledWith('screen')
    set('paused-by-system')
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('releases a grant that arrives after stop', async () => {
    const release = vi.fn(() => Promise.resolve())
    let grant!: (s: { release: () => Promise<void> }) => void
    const { set } = setup(() => new Promise((resolve) => (grant = resolve)))
    set('playing')
    set('stopped')
    grant({ release })
    await Promise.resolve()
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('swallows denied and missing wake locks', async () => {
    const { set } = setup(() => Promise.reject(new Error('denied')))
    set('playing')
    await Promise.resolve()
    set('stopped')
    expect(() => createWakeLock({}, { status: 'playing', subscribe: () => () => {} })).not.toThrow()
  })
})
