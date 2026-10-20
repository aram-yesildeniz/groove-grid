import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

const EXPECTED: Record<string, string> = {
  surface: '#f7f3ea',
  'surface-raised': '#fffdf8',
  'surface-pressed': '#e8e1d2',
  'surface-pulse': '#f0eadd',
  ink: '#1c1b19',
  'ink-secondary': '#5c5850',
  'ink-disabled': '#9c968b',
  'grid-quarter': '#1c1b19',
  'grid-eighth': '#4a463f',
  'grid-sixteenth': '#7a746a',
  accent: '#b4361c',
  'border-hairline': '#d9d2c3',
  scrim: '#1c1b19',
  'bpm-numeral-size': '72px',
  'bpm-unit-size': '13px',
  'beat-label-size': '15px',
  'chip-caption-size': '11px',
  'label-size': '15px',
  'body-size': '16px',
  'caption-size': '13px',
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '24px',
  'space-6': '32px',
  'space-7': '48px',
  gutter: '16px',
  'target-min': '48px',
  'control-lg': '56px',
  'column-max': '480px',
  'chip-padding-x': '12px',
  'top-bar-height': '66px',
  'radius-md': '12px',
  'radius-lg': '20px',
  'radius-full': '9999px',
}

describe('design tokens', () => {
  it.each(Object.entries(EXPECTED))('--%s is %s', (name, value) => {
    expect(css).toContain(`--${name}: ${value};`)
  })

  it('declares the system font stack and no dark theme', () => {
    expect(css).toContain('system-ui')
    expect(css).not.toContain('prefers-color-scheme')
  })
})
