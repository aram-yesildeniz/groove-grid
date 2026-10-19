import type { ClockReader } from '../core/ports.ts'
import { createDotLayer } from './layers/dot.ts'
import { createGridLayer } from './layers/grid.ts'
import type { Frame, Layer } from './layers/types.ts'

/**
 * Mounts the one animation loop on `canvas` (AD-9). Sizing follows the canvas's CSS box and the
 * screen's pixel density. Returns a dispose function.
 */
export function mount(canvas: HTMLCanvasElement, clock: ClockReader): () => void {
  const ctx = canvas.getContext('2d')!
  const layers: Layer[] = [createGridLayer(), createDotLayer()]
  const frame: Frame = {
    now: 0,
    timeline: null,
    size: 0,
    dpr: 1,
    theme: { ink: '#000', surface: '#fff' },
  }

  function readTheme(): void {
    const style = getComputedStyle(document.documentElement)
    frame.theme.ink = style.getPropertyValue('--ink').trim() || frame.theme.ink
    frame.theme.surface = style.getPropertyValue('--surface').trim() || frame.theme.surface
  }

  function resize(): void {
    const size = canvas.clientWidth
    const dpr = window.devicePixelRatio || 1
    if (size === frame.size && dpr === frame.dpr) return
    frame.size = size
    frame.dpr = dpr
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)
  }

  readTheme()
  let raf = 0
  function tick(): void {
    resize()
    if (frame.size > 0) {
      frame.now = clock.now()
      frame.timeline = clock.timeline()
      ctx.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0)
      ctx.clearRect(0, 0, frame.size, frame.size)
      for (const layer of layers) layer(ctx, frame)
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
