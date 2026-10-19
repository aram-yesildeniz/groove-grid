import { LOOKAHEAD } from './constants.ts'
import { eventsBetween, type CoreEvent, type Live, type Timeline } from './timeline.ts'

export interface PlanState {
  timeline: Timeline
  live: Live
  /** Events before this time were already handed out. Always a window end, never an event time. */
  committedUntil: number
}

export function createPlanState(timeline: Timeline, live: Live): PlanState {
  const first = timeline.segments[0]
  return { timeline, live, committedUntil: first ? first.startTime : 0 }
}

/** Events for `[committedUntil, now + LOOKAHEAD)`; the window end becomes the new `committedUntil`. */
export function plan(state: PlanState, now: number): { events: CoreEvent[]; state: PlanState } {
  const end = now + LOOKAHEAD
  if (end <= state.committedUntil) return { events: [], state }
  const events = eventsBetween(state.timeline, state.live, state.committedUntil, end)
  return { events, state: { ...state, committedUntil: end } }
}
