<script lang="ts">
  import { onMount } from 'svelte'
  import type { EnginePort, EngineStatus } from '../core/ports.ts'
  import { DEFAULT_SETTINGS } from '../core/settings.ts'

  let { engine }: { engine: EnginePort } = $props()

  let status = $state<EngineStatus>('stopped')
  onMount(() => {
    status = engine.status
    return engine.subscribe(() => (status = engine.status))
  })

  // `start` calls AudioContext.resume() synchronously, so it must run directly in the tap.
  function toggle() {
    if (status === 'playing') engine.stop()
    else void engine.start(DEFAULT_SETTINGS)
  }
</script>

<main>
  <h1>Groove Grid</h1>
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
