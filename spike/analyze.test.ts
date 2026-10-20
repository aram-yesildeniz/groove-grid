import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { analyze, findOnsets, parseWav } from './analyze.ts'

const RATE = 48000

/** 16-bit mono WAV of decaying clicks starting at the given times (seconds). */
function makeWav(times: number[], seconds: number, bits: 16 | 32 = 16): Uint8Array {
  const total = Math.ceil(seconds * RATE)
  const buf = new Float32Array(total)
  times.forEach((t, n) => {
    const at = Math.round(t * RATE)
    const gain = n % 4 === 0 ? 1 : 0.7
    for (let i = 0; i < 400 && at + i < total; i++) buf[at + i] = gain * Math.exp(-i / 60) * 0.8
  })
  const bytesPer = bits / 8
  const out = new Uint8Array(44 + total * bytesPer)
  const v = new DataView(out.buffer)
  const put = (o: number, s: string) => [...s].forEach((c, i) => (out[o + i] = c.charCodeAt(0)))
  put(0, 'RIFF')
  v.setUint32(4, out.length - 8, true)
  put(8, 'WAVEfmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, bits === 32 ? 3 : 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, RATE, true)
  v.setUint32(28, RATE * bytesPer, true)
  v.setUint16(32, bytesPer, true)
  v.setUint16(34, bits, true)
  put(36, 'data')
  v.setUint32(40, total * bytesPer, true)
  buf.forEach((s, i) =>
    bits === 16
      ? v.setInt16(44 + i * 2, Math.round(s * 32767), true)
      : v.setFloat32(44 + i * 4, s, true),
  )
  return out
}

const grid = (bpm: number, n: number, t0 = 0.1) =>
  Array.from({ length: n }, (_, i) => t0 + (i * 60) / bpm)

describe('analyze', () => {
  it('passes a clean track', () => {
    const times = grid(120, 16)
    const onsets = findOnsets(parseWav(makeWav(times, 9)), 0.2)
    expect(onsets).toHaveLength(16)
    const result = analyze(onsets, 120)
    expect(result.pass).toBe(true)
    expect(result.maxAbsMs).toBeLessThan(0.1)
  })

  it('fails and names an onset shifted 1.5 ms', () => {
    const times = grid(120, 16)
    times[7]! += 0.0015
    const result = analyze(findOnsets(parseWav(makeWav(times, 9)), 0.2), 120)
    expect(result.pass).toBe(false)
    expect(result.worstIndex).toBe(7)
  })

  it('fails on slow drift and --fit-period reports it as skew', () => {
    const times = grid(250, 40).map((t, n) => t + n * 0.0001)
    const onsets = findOnsets(parseWav(makeWav(times, 11)), 0.1)
    const result = analyze(onsets, 250, true)
    expect(result.pass).toBe(false)
    expect(result.fit!.ppm).toBeGreaterThan(300)
    expect(result.fit!.maxAbsMs).toBeLessThan(0.1)
  })

  it('reads 32-bit float WAV', () => {
    const onsets = findOnsets(parseWav(makeWav(grid(30, 4), 8, 32)), 0.8)
    expect(onsets).toHaveLength(4)
  })

  it('rejects non-WAV and silent input', () => {
    expect(() => parseWav(new Uint8Array(20))).toThrow('Not a WAV')
    expect(() => analyze(findOnsets(parseWav(makeWav([], 1)), 0.2), 120)).toThrow('Fewer than two')
  })
})

/** Re-encodes a 16-bit mono WAV as 24-bit stereo with a WAVE_FORMAT_EXTENSIBLE header. */
function to24Stereo(src: Uint8Array): Uint8Array {
  const wav = parseWav(src)
  const frames = wav.samples.length
  const out = new Uint8Array(12 + 48 + 8 + frames * 6)
  const v = new DataView(out.buffer)
  const put = (o: number, t: string) => [...t].forEach((c, i) => (out[o + i] = c.charCodeAt(0)))
  put(0, 'RIFF')
  v.setUint32(4, out.length - 8, true)
  put(8, 'WAVEfmt ')
  v.setUint32(16, 40, true)
  v.setUint16(20, 0xfffe, true)
  v.setUint16(22, 2, true)
  v.setUint32(24, RATE, true)
  v.setUint32(28, RATE * 6, true)
  v.setUint16(32, 6, true)
  v.setUint16(34, 24, true)
  v.setUint16(36, 22, true)
  v.setUint16(12 + 8 + 24, 1, true) // sub-format: PCM
  put(12 + 48, 'data')
  v.setUint32(12 + 52, frames * 6, true)
  wav.samples.forEach((s, i) => {
    const n = Math.round(s * 8388607)
    for (let c = 0; c < 2; c++) {
      const at = 12 + 56 + (i * 2 + c) * 3
      out[at] = n & 255
      out[at + 1] = (n >> 8) & 255
      out[at + 2] = (n >> 16) & 255
    }
  })
  return out
}

describe('wav decoding', () => {
  it('reads 24-bit stereo extensible', () => {
    const times = grid(120, 8)
    const wav = parseWav(to24Stereo(makeWav(times, 5)))
    expect(wav.sampleRate).toBe(RATE)
    const result = analyze(findOnsets(wav, 0.2), 120)
    expect(result.count).toBe(8)
    expect(result.pass).toBe(true)
  })
})

describe('cli', () => {
  const dir = mkdtempSync(join(tmpdir(), 'analyze-'))
  const run = (times: number[], extra: string[] = []) => {
    const file = join(dir, `t${times.length}-${Math.random()}.wav`)
    writeFileSync(file, makeWav(times, 9))
    return spawnSync('node', ['spike/analyze.ts', file, '--bpm', '120', ...extra], {
      encoding: 'utf8',
    })
  }
  it('exits 0 on pass, 1 on fail, 2 on bad input', () => {
    expect(run(grid(120, 16)).status).toBe(0)
    const bad = grid(120, 16)
    bad[5]! += 0.002
    const failed = run(bad)
    expect(failed.status).toBe(1)
    expect(failed.stdout).toContain('FAIL')
    expect(spawnSync('node', ['spike/analyze.ts'], { encoding: 'utf8' }).status).toBe(2)
  })
})
