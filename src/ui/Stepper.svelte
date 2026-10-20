<script lang="ts">
  import { createHoldRepeat } from './hold-repeat.ts'

  let {
    label,
    glyph,
    disabled,
    step,
  }: { label: string; glyph: string; disabled: boolean; step: () => boolean } = $props()

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
  {glyph}
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
    font: inherit;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
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
