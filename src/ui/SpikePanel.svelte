<script lang="ts">
  import { onMount } from 'svelte'
  import type { EngineStatus } from '../core/ports.ts'
  import type { SpikeSnapshot } from './spike.ts'

  let { snapshot, status }: { snapshot: () => SpikeSnapshot; status: EngineStatus } = $props()

  let text = $state('')
  let copied = $state('')
  let startedAt = 0
  let elapsed = 0

  onMount(() => {
    const id = setInterval(() => {
      if (status === 'playing') {
        if (!startedAt) startedAt = Date.now()
        elapsed = Math.floor((Date.now() - startedAt) / 1000)
      } else startedAt = 0
      text = JSON.stringify({ elapsedS: elapsed, ...snapshot() }, null, 1)
    }, 500)
    return () => clearInterval(id)
  })

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      copied = 'Copied'
    } catch {
      copied = 'Copy failed; select the text'
    }
  }
</script>

<section class="spike">
  <pre>{text}</pre>
  <button type="button" onclick={copy}>Copy JSON</button>
  <span>{copied}</span>
</section>

<style>
  .spike {
    font-size: 0.75rem;
    max-width: 320px;
  }
  pre {
    margin: 0 0 0.5rem;
    user-select: text;
  }
  button {
    min-width: 0;
    height: 36px;
    padding: 0 1rem;
    border-radius: 18px;
    font-size: 0.875rem;
  }
</style>
