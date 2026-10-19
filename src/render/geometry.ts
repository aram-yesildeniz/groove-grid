export const RING_WIDTH = 3
export const DOT_DIAMETER = 18
export const DOT_HALO = 2

export interface Point {
  x: number
  y: number
}

/** Ring radius in CSS px for a square canvas of `size`, leaving room for the stroke and the dot. */
export function ringRadius(size: number): number {
  return size / 2 - DOT_DIAMETER / 2 - DOT_HALO
}

/** Point on the ring for `angle` (radians clockwise from 12 o'clock); writes into `out`. */
export function pointOnRing(size: number, angle: number, out: Point): Point {
  const r = ringRadius(size)
  out.x = size / 2 + Math.sin(angle) * r
  out.y = size / 2 - Math.cos(angle) * r
  return out
}
