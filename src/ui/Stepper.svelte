<script lang="ts">
  import { createHoldRepeat } from './hold-repeat.ts'

  let {
    label,
    kind,
    disabled,
    step,
  }: { label: string; kind: 'minus' | 'plus'; disabled: boolean; step: () => boolean } = $props()

  const hold = createHoldRepeat(() => step())
  // A pointer press already stepped; its trailing click must not step again.
  let pointerPressed = false

  function release() {
    hold.release()
  }

  $effect(() => release)
</script>

<button
  type="button"
  class="stepper"
  aria-label={label}
  {disabled}
  onpointerdown={(event) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerPressed = true
    hold.press()
  }}
  onpointerup={release}
  onpointercancel={release}
  onblur={release}
  onclick={(event) => {
    if (pointerPressed) pointerPressed = false
    else {
      event.preventDefault()
      step()
    }
  }}
  oncontextmenu={(event) => event.preventDefault()}
>
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path d={kind === 'plus' ? 'M12 5v14M5 12h14' : 'M5 12h14'} />
  </svg>
</button>

<style>
  .stepper {
    width: var(--control-lg);
    height: var(--control-lg);
    padding: 0;
    border: 1.5px solid var(--ink);
    border-radius: var(--radius-full);
    background: var(--surface-raised);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }

  svg {
    display: block;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .stepper:active:not(:disabled) {
    background: var(--surface-pressed);
  }

  .stepper:disabled {
    color: var(--ink-disabled);
    border-color: color-mix(in srgb, var(--ink) 40%, transparent);
    cursor: default;
  }

  .stepper:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
</style>
