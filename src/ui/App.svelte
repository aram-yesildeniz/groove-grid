<script lang="ts">
  import { onMount } from 'svelte'
  import type { ClockReader, EnginePort, EngineStatus, PausedReason } from '../core/ports.ts'
  import { BPM_MAX, BPM_MIN } from '../core/constants.ts'
  import { mount } from '../render/loop.ts'
  import { deriveNotice, isIos } from './notice.ts'
  import { settingsStore } from './settings.svelte.ts'
  import SpikePanel from './SpikePanel.svelte'
  import Stepper from './Stepper.svelte'
  import type { SpikeHooks } from './spike.ts'
  import { createWakeLock } from './wake-lock.ts'

  let {
    engine,
    clock,
    spike = null,
  }: { engine: EnginePort; clock: ClockReader; spike?: SpikeHooks | null } = $props()

  let canvas: HTMLCanvasElement

  let status = $state<EngineStatus>('stopped')
  let pausedReason = $state<PausedReason | null>(null)
  let silentHint = $state(false)
  // The silent-switch hint shows on the first Start only; kept in memory until Epic 5 persists it.
  let hintUsed = false
  const bpm = $derived(settingsStore.current.bpm)
  const notice = $derived(deriveNotice({ status, pausedReason, silentHint }))

  onMount(() => {
    status = engine.status
    const unmount = mount(canvas, clock, spike?.onFrame)
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
      void engine.start(settingsStore.current)
    }
  }
</script>

<main>
  <div class="column">
    <h1 class="sr-only">Groove Grid</h1>
    <div class="top-bar" aria-hidden="true"></div>
    <div class="circle">
      <canvas bind:this={canvas} aria-hidden="true"></canvas>
    </div>
    <p class="notice" aria-live="polite">{notice}</p>
    <div class="tempo-row">
      <Stepper
        label="Decrease tempo"
        kind="minus"
        disabled={bpm <= BPM_MIN}
        step={() => settingsStore.stepTempo(-1)}
      />
      <div class="tempo-value">
        <span class="bpm-numeral">{bpm}</span>
        <span class="bpm-unit">BPM</span>
      </div>
      <Stepper
        label="Increase tempo"
        kind="plus"
        disabled={bpm >= BPM_MAX}
        step={() => settingsStore.stepTempo(1)}
      />
    </div>
    <div class="transport-row">
      <button type="button" onclick={toggle}>{status === 'playing' ? 'Stop' : 'Start'}</button>
    </div>
  </div>
  {#if spike}<SpikePanel snapshot={spike.snapshot} {status} />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--surface);
    color: var(--ink);
    font-family: var(--font);
    font-size: var(--body-size);
    line-height: var(--body-line);
  }

  main {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* UX-DR3: top bar, circle, notice, tempo row, transport row in one centered column. */
  .column {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    max-width: var(--column-max);
    height: 100dvh;
    min-height: 640px;
    display: grid;
    grid-template-rows:
      calc(var(--top-bar-height) + var(--space-2))
      minmax(260px, 1fr)
      var(--target-min)
      88px
      var(--control-lg);
    padding: env(safe-area-inset-top) calc(var(--gutter) + env(safe-area-inset-right))
      calc(env(safe-area-inset-bottom) + var(--space-4))
      calc(var(--gutter) + env(safe-area-inset-left));
  }

  .circle {
    container-type: size;
    display: grid;
    place-items: center;
    min-height: 260px;
  }

  canvas {
    width: min(100cqw, 100cqh);
    aspect-ratio: 1;
    display: block;
  }

  .notice {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--ink-secondary);
    font-size: var(--caption-size);
    font-weight: var(--caption-weight);
    line-height: var(--caption-line);
  }

  .tempo-row {
    display: grid;
    grid-template-columns: var(--control-lg) 1fr var(--control-lg);
    align-items: center;
    padding-top: var(--space-2);
  }

  .tempo-value {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: baseline;
    column-gap: var(--space-2);
  }

  .bpm-numeral {
    grid-column: 2;
    min-width: 3ch;
    text-align: center;
    font-size: var(--bpm-numeral-size);
    font-weight: var(--bpm-numeral-weight);
    line-height: var(--bpm-numeral-line);
    letter-spacing: var(--bpm-numeral-tracking);
    font-variant-numeric: tabular-nums;
  }

  .bpm-unit {
    grid-column: 3;
    font-size: var(--bpm-unit-size);
    font-weight: var(--bpm-unit-weight);
    line-height: var(--bpm-unit-line);
    letter-spacing: var(--bpm-unit-tracking);
    color: var(--ink-secondary);
  }

  .transport-row {
    display: flex;
    gap: var(--space-2);
  }

  button {
    flex: 1;
    height: var(--control-lg);
    border: 0;
    border-radius: var(--radius-full);
    background: var(--ink);
    color: var(--surface-raised);
    font: inherit;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
  }

  button:active {
    opacity: 0.85;
  }

  button:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
</style>
