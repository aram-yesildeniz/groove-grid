import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SAMPLE_RATE = 44100
const DURATION = 0.03

/** Mono 16-bit PCM WAV of a decaying cosine burst; the peak is at sample 0 (AD-11). */
function burst(frequency: number): Buffer {
  const count = Math.round(SAMPLE_RATE * DURATION)
  const data = Buffer.alloc(count * 2)
  for (let i = 0; i < count; i++) {
    const t = i / SAMPLE_RATE
    const fade = Math.min(1, (count - i) / 64)
    const value = Math.cos(2 * Math.PI * frequency * t) * Math.exp(-t * 150) * fade
    data.writeInt16LE(Math.round(value * 0.9 * 32767), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/sounds')
mkdirSync(outDir, { recursive: true })
writeFileSync(resolve(outDir, 'click-beep-accent.wav'), burst(1800))
writeFileSync(resolve(outDir, 'click-beep-normal.wav'), burst(1200))
