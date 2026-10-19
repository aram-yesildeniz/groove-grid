import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const html = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../index.html'), 'utf8')
const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1] ?? ''

describe('index.html CSP', () => {
  it.each(['script-src', 'worker-src', 'media-src'])("restricts %s to 'self'", (directive) => {
    const value = csp.split(';').find((d) => d.trim().startsWith(directive))
    expect(value?.trim()).toBe(`${directive} 'self'`)
  })

  it('names no external origin', () => {
    expect(csp).not.toMatch(/https?:|\*/)
  })
})
