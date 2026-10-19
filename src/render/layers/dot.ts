import { dotAngle } from '../../core/dot-angle.ts'
import { DOT_DIAMETER, DOT_HALO, pointOnRing, type Point } from '../geometry.ts'
import type { Layer } from './types.ts'

/** The sweeping dot: ink disc with a surface halo; rests on beat 1 when there is no timeline. */
export function createDotLayer(): Layer {
  const p: Point = { x: 0, y: 0 }
  return (ctx, frame) => {
    pointOnRing(frame.size, dotAngle(frame.timeline, frame.now), p)
    ctx.fillStyle = frame.theme.surface
    ctx.beginPath()
    ctx.arc(p.x, p.y, DOT_DIAMETER / 2 + DOT_HALO, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = frame.theme.ink
    ctx.beginPath()
    ctx.arc(p.x, p.y, DOT_DIAMETER / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}
