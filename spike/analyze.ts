import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export interface Wav {
  sampleRate: number
  /** Mono mix, -1..1. */
  samples: Float32Array
}

/** Decodes 16/24/32-bit PCM and 32-bit float WAV (including WAVE_FORMAT_EXTENSIBLE) to a mono mix. */
export function parseWav(bytes: Uint8Array): Wav {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const tag = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4))
  if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Not a WAV file')
  let fmt: { format: number; channels: number; rate: number; bits: number } | null = null
  let data: [number, number] | null = null
  for (let at = 12; at + 8 <= bytes.length;) {
    const size = view.getUint32(at + 4, true)
    if (tag(at) === 'fmt ') {
      let format = view.getUint16(at + 8, true)
      if (format === 0xfffe) format = view.getUint16(at + 8 + 24, true)
      fmt = {
        format,
        channels: view.getUint16(at + 10, true),
        rate: view.getUint32(at + 12, true),
        bits: view.getUint16(at + 22, true),
      }
    } else if (tag(at) === 'data') {
      data = [at + 8, Math.min(size, bytes.length - at - 8)]
      break
    }
    at += 8 + size + (size % 2)
  }
  if (!fmt || !data) throw new Error('WAV is missing fmt or data')
  const { format, channels, rate, bits } = fmt
  const isFloat = format === 3 && bits === 32
  if (!isFloat && !(format === 1 && (bits === 16 || bits === 24 || bits === 32)))
    throw new Error(`Unsupported WAV format ${format}/${bits}-bit`)
  const bytesPer = bits / 8
  const frames = Math.floor(data[1] / (bytesPer * channels))
  const samples = new Float32Array(frames)
  for (let i = 0; i < frames; i++) {
    let sum = 0
    for (let c = 0; c < channels; c++) {
      const at = data[0] + (i * channels + c) * bytesPer
      if (isFloat) sum += view.getFloat32(at, true)
      else if (bits === 16) sum += view.getInt16(at, true) / 32768
      else if (bits === 24)
        sum += (view.getInt32(at - 1, true) >> 8) / 8388608 // little-endian 24-bit
      else sum += view.getInt32(at, true) / 2147483648
    }
    samples[i] = sum / channels
  }
  return { sampleRate: rate, samples }
}

/**
 * Onset times in seconds. A click is found where the signal first passes 5% of the loudest
 * sample; its onset is the first sample at 10% of that click's own peak, interpolated to
 * sub-sample precision, so accented and plain clicks share one definition.
 */
export function findOnsets(wav: Wav, minGapSeconds: number): number[] {
  const { samples, sampleRate } = wav
  let max = 0
  for (const v of samples) max = Math.max(max, Math.abs(v))
  if (max === 0) return []
  const gate = max * 0.05
  const window = Math.round(0.01 * sampleRate)
  const holdoff = Math.round(minGapSeconds * sampleRate)
  const onsets: number[] = []
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]!) < gate) continue
    let peak = 0
    for (let j = i; j < Math.min(samples.length, i + window); j++)
      peak = Math.max(peak, Math.abs(samples[j]!))
    const level = peak * 0.1
    let k = i
    while (k > 0 && Math.abs(samples[k - 1]!) >= level) k--
    const hit = Math.abs(samples[k]!)
    const before = k > 0 ? Math.abs(samples[k - 1]!) : 0
    const frac = hit > before ? (level - before) / (hit - before) : 0
    onsets.push((k - 1 + Math.min(1, Math.max(0, frac))) / sampleRate)
    i += holdoff
  }
  return onsets
}

export interface Analysis {
  count: number
  periodSeconds: number
  /** Deviation of each onset from `t0 + n × period`, in milliseconds. */
  deviationsMs: number[]
  maxAbsMs: number
  worstIndex: number
  pass: boolean
  fit?: { periodRatio: number; ppm: number; maxAbsMs: number }
}

export const TOLERANCE_MS = 1

/** Checks every onset against the nominal grid anchored on the first onset (AD-13). */
export function analyze(onsets: number[], bpm: number, fitPeriod = false): Analysis {
  if (onsets.length < 2) throw new Error('Fewer than two onsets found')
  const period = 60 / bpm
  const t0 = onsets[0]!
  const deviationsMs = onsets.map((t, n) => (t - (t0 + n * period)) * 1000)
  let maxAbsMs = 0
  let worstIndex = 0
  deviationsMs.forEach((d, n) => {
    if (Math.abs(d) > maxAbsMs) {
      maxAbsMs = Math.abs(d)
      worstIndex = n
    }
  })
  const result: Analysis = {
    count: onsets.length,
    periodSeconds: period,
    deviationsMs,
    maxAbsMs,
    worstIndex,
    pass: maxAbsMs <= TOLERANCE_MS,
  }
  if (fitPeriod) {
    // Least-squares line t = a + b·n. A ratio away from 1 is recorder clock skew or real drift.
    const n = onsets.length
    let sn = 0
    let st = 0
    let snn = 0
    let snt = 0
    onsets.forEach((t, i) => {
      sn += i
      st += t
      snn += i * i
      snt += i * t
    })
    const b = (n * snt - sn * st) / (n * snn - sn * sn)
    const a = (st - b * sn) / n
    let fitMax = 0
    onsets.forEach((t, i) => (fitMax = Math.max(fitMax, Math.abs(t - (a + b * i)) * 1000)))
    result.fit = { periodRatio: b / period, ppm: (b / period - 1) * 1e6, maxAbsMs: fitMax }
  }
  return result
}

const USAGE = 'Usage: node spike/analyze.ts <recording.wav> --bpm <30-250> [--fit-period]'

function main(args: string[]): number {
  if (args.includes('--help')) {
    console.log(USAGE)
    return 0
  }
  const file = args.find((a) => !a.startsWith('--') && a !== args[args.indexOf('--bpm') + 1])
  const bpm = Number(args[args.indexOf('--bpm') + 1])
  if (!file || !Number.isFinite(bpm) || bpm < 30 || bpm > 250 || !args.includes('--bpm')) {
    console.error(USAGE)
    return 2
  }
  try {
    const wav = parseWav(readFileSync(file))
    const onsets = findOnsets(wav, Math.min((60 / bpm) * 0.4, 0.03))
    const result = analyze(onsets, bpm, args.includes('--fit-period'))
    console.log(
      `${result.count} onsets at ${bpm} BPM (period ${(result.periodSeconds * 1000).toFixed(3)} ms)`,
    )
    console.log(`max |deviation| ${result.maxAbsMs.toFixed(3)} ms at onset #${result.worstIndex}`)
    if (result.fit)
      console.log(
        `fit: period ratio ${result.fit.periodRatio.toFixed(8)} (${result.fit.ppm.toFixed(1)} ppm), max |deviation from fit| ${result.fit.maxAbsMs.toFixed(3)} ms`,
      )
    console.log(result.pass ? 'PASS' : `FAIL (limit ±${TOLERANCE_MS} ms)`)
    return result.pass ? 0 : 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 2
  }
}

if (import.meta.main ?? process.argv[1] === fileURLToPath(import.meta.url))
  process.exitCode = main(process.argv.slice(2))
