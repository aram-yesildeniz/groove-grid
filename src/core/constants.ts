/** Ticks per beat (AD-3). */
export const PPQ = 960

export const BPM_MIN = 30
export const BPM_MAX = 250

export const BEATS_MIN = 1
export const BEATS_MAX = 16

/** Seconds of audio the planner commits ahead of the clock (AD-7); the spike tunes it. */
export const LOOKAHEAD = 0.1

export const CLICK_SOUND_IDS = ['beep', 'woodblock', 'stick', 'hi-hat'] as const
export type ClickSoundId = (typeof CLICK_SOUND_IDS)[number]

export const MARKER_SOUND_IDS = ['clap', 'cowbell', 'conga'] as const
export type MarkerSoundId = (typeof MARKER_SOUND_IDS)[number]

/** Seconds between worker wake-ups that drive the planner (AD-7); the spike tunes it. */
export const WAKEUP_INTERVAL = 0.025

/** Seconds between the Start tap and beat 1 (AD-5); the spike tunes it. */
export const START_LEAD = 0.1
