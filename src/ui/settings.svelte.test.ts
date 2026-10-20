import { describe, expect, it, vi } from 'vitest'
import { createSettingsStore } from './settings.svelte.ts'

describe('settings store', () => {
  it('starts at the default 80 BPM', () => {
    expect(createSettingsStore().current.bpm).toBe(80)
  })

  it('sets tempo and notifies once with the new snapshot', () => {
    const store = createSettingsStore()
    const listener = vi.fn()
    store.subscribe(listener)
    store.setTempo(81)
    expect(store.current.bpm).toBe(81)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0]![0].bpm).toBe(81)
  })

  it('clamps to 30-250 and rounds', () => {
    const store = createSettingsStore()
    store.setTempo(999)
    expect(store.current.bpm).toBe(250)
    store.setTempo(3)
    expect(store.current.bpm).toBe(30)
    store.setTempo(100.6)
    expect(store.current.bpm).toBe(101)
  })

  it('ignores non-finite input without notifying', () => {
    const store = createSettingsStore()
    const listener = vi.fn()
    store.subscribe(listener)
    store.setTempo(NaN)
    expect(store.current.bpm).toBe(80)
    expect(listener).not.toHaveBeenCalled()
  })

  it('does not notify when the value does not change', () => {
    const store = createSettingsStore()
    store.setTempo(250)
    const listener = vi.fn()
    store.subscribe(listener)
    store.setTempo(251)
    store.setTempo(250)
    expect(listener).not.toHaveBeenCalled()
  })

  it('stepTempo reports whether it can continue', () => {
    const store = createSettingsStore()
    store.setTempo(248)
    expect(store.stepTempo(1)).toBe(true) // 249
    expect(store.stepTempo(1)).toBe(false) // 250
    expect(store.stepTempo(1)).toBe(false) // stays 250
    expect(store.current.bpm).toBe(250)
    store.setTempo(31)
    expect(store.stepTempo(-1)).toBe(false) // 30
    expect(store.stepTempo(-1)).toBe(false)
    expect(store.current.bpm).toBe(30)
    store.setTempo(100)
    expect(store.stepTempo(-1)).toBe(true)
  })

  it('stops notifying after unsubscribe', () => {
    const store = createSettingsStore()
    const listener = vi.fn()
    store.subscribe(listener)()
    store.setTempo(90)
    expect(listener).not.toHaveBeenCalled()
  })
})
