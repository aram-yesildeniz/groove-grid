import type { Timeline } from '../../core/timeline.ts'

export interface Theme {
  ink: string
  surface: string
}

/** Filled in place once per animation frame; layers must not allocate or keep it. */
export interface Frame {
  now: number
  timeline: Timeline | null
  /** Square canvas side in CSS px. */
  size: number
  dpr: number
  theme: Theme
}

export type Layer = (ctx: CanvasRenderingContext2D, frame: Frame) => void
