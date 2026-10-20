<script lang="ts">
  import { onMount } from 'svelte'
  import type { ClockReader, EnginePort, EngineStatus, PausedReason } from '../core/ports.ts'
  import { DEFAULT_SETTINGS } from '../core/settings.ts'
  import { mount } from '../render/loop.ts'
  import { deriveNotice, isIos } from './notice.ts'
  import { createWakeLock } from './wake-lock.ts'

  let { engine, clock }: { engine: EnginePort; clock: ClockReader } = $props()

  let canvas: HTMLCanvasElement

  let status = $state<EngineStatus>('stopped')
  let pausedReason = $state<PausedReason | null>(null)
  let silentHint = $state(false)
  // The silent-switch hint shows on the first Start only; kept in memory until Epic 5 persists it.
  let hintUsed = false
  const notice = $derived(deriveNotice({ status, pausedReason, silentHint }))

  onMount(() => {
    status = engine.status
    const unmount = mount(canvas, clock)
    const releaseWakeLock = createWakeLock(navigator, engine)
    const unsubscribe = engine.subscribe(() => {
      status = engine.status
      pausedReason = engine.pausedReason
      if (status !== 'playing') silentHint = false
    })
    return () => {
      unmount()
      releaseWakeLock()
      unsubscribe()
    }
  })

  // `start` calls AudioContext.resume() synchronously, so it must run directly in the tap.
  function toggle() {
    if (status === 'playing') engine.stop()
    else {
      if (!hintUsed) {
        hintUsed = true
        silentHint = !engine.audioSessionSupported && isIos(navigator)
      }
      void engine.start(DEFAULT_SETTINGS)
    }
  }
</script>

<main>
  <h1>Groove Grid</h1>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <p class="notice" aria-live="polite">{notice}</p>
  <button type="button" onclick={toggle}>{status === 'playing' ? 'Stop' : 'Start'}</button>
</main>

<style>
  :global(:root) {
    --surface: #f7f3ea;
    --surface-raised: #fffdf8;
    --ink: #1d1b16;
  }

  :global(body) {
    margin: 0;
    background: var(--surface);
    color: var(--ink);
    font-family: system-ui, sans-serif;
  }

  main {
    min-height: 100dvh;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 2rem;
  }

  canvas {
    width: clamp(260px, min(100vw - 32px, 480px), 480px);
    aspect-ratio: 1;
    display: block;
  }

  .notice {
    margin: 0;
    height: 48px;
    display: flex;
    align-items: center;
    font-size: 0.875rem;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  button {
    min-width: 160px;
    height: 56px;
    padding: 0 2rem;
    border: 0;
    border-radius: 28px;
    background: var(--ink);
    color: var(--surface-raised);
    font: inherit;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
  }
</style>
