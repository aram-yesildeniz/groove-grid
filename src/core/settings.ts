import {
  BEATS_MAX,
  BEATS_MIN,
  BPM_MAX,
  BPM_MIN,
  CLICK_SOUND_IDS,
  MARKER_SOUND_IDS,
  PPQ,
  type ClickSoundId,
  type MarkerSoundId,
} from './constants.ts'

/** Divisions per beat: beats, 8ths, 16ths, triplets (AD-3, AD-4). */
export type Division = 1 | 2 | 4 | 3

export interface Settings {
  bpm: number
  beats: number
  beatUnit: 4 | 8
  grid: Division
  clickBeats: boolean[]
  betweenBeats: Division
  clickSound: ClickSoundId
  markerSound: MarkerSoundId | null
  markers: number[]
  muted: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  bpm: 80,
  beats: 4,
  beatUnit: 4,
  grid: 4,
  clickBeats: [true, true, true, true],
  betweenBeats: 1,
  clickSound: 'beep',
  markerSound: null,
  markers: [],
  muted: false,
}

const DIVISIONS: readonly Division[] = [1, 2, 4, 3]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function pickDivision(value: unknown): Division {
  return DIVISIONS.find((d) => d === value) ?? 1
}

/** Validates and repairs unknown input into a valid `Settings`; never throws, never mutates. */
export function normalize(input: unknown): Settings {
  const raw = isRecord(input) ? input : {}
  const d = DEFAULT_SETTINGS

  const bpm = clampInt(raw.bpm, BPM_MIN, BPM_MAX, d.bpm)
  const beats = clampInt(raw.beats, BEATS_MIN, BEATS_MAX, d.beats)
  const beatUnit = raw.beatUnit === 8 ? 8 : 4
  const grid = DIVISIONS.find((x) => x === raw.grid) ?? d.grid

  const given = Array.isArray(raw.clickBeats) ? raw.clickBeats : []
  const clickBeats = Array.from({ length: beats }, (_, i) =>
    i < given.length ? given[i] === true : true,
  )
  if (!clickBeats.some(Boolean)) clickBeats[0] = true

  const clickSound = CLICK_SOUND_IDS.find((id) => id === raw.clickSound) ?? d.clickSound
  const markerSound = MARKER_SOUND_IDS.find((id) => id === raw.markerSound) ?? null

  const step = PPQ / grid
  const barTicks = beats * PPQ
  const markers = Array.isArray(raw.markers)
    ? [
        ...new Set(
          raw.markers.filter(
            (t): t is number =>
              typeof t === 'number' &&
              Number.isInteger(t) &&
              t >= 0 &&
              t < barTicks &&
              t % step === 0,
          ),
        ),
      ].sort((a, b) => a - b)
    : []

  return {
    bpm,
    beats,
    beatUnit,
    grid,
    clickBeats,
    betweenBeats: pickDivision(raw.betweenBeats),
    clickSound,
    markerSound,
    markers,
    muted: raw.muted === true,
  }
}
