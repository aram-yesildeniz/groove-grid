import { RING_WIDTH, ringRadius } from '../geometry.ts'
import type { Layer } from './types.ts'

/** The ring, drawn once to an offscreen canvas and rebuilt only when size, DPR or ink change. */
export function createGridLayer(): Layer {
  let cache: HTMLCanvasElement | null = null
  let cachedSize = 0
  let cachedDpr = 0
  let cachedInk = ''
  return (ctx, frame) => {
    const { size, dpr, theme } = frame
    if (!cache || size !== cachedSize || dpr !== cachedDpr || theme.ink !== cachedInk) {
      cachedSize = size
      cachedDpr = dpr
      cachedInk = theme.ink
      cache ??= document.createElement('canvas')
      const px = Math.round(frame.size * frame.dpr)
      cache.width = px
      cache.height = px
      const g = cache.getContext('2d')!
      g.scale(frame.dpr, frame.dpr)
      g.strokeStyle = frame.theme.ink
      g.lineWidth = RING_WIDTH
      g.beginPath()
      g.arc(frame.size / 2, frame.size / 2, ringRadius(frame.size), 0, Math.PI * 2)
      g.stroke()
    }
    ctx.drawImage(cache, 0, 0, frame.size, frame.size)
  }
}
