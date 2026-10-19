import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findViolations } from './check-boundaries.ts'

let srcDir: string

function put(path: string, content: string) {
  const full = join(srcDir, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content)
}

beforeEach(() => {
  srcDir = mkdtempSync(join(tmpdir(), 'boundaries-'))
})

afterEach(() => {
  rmSync(srcDir, { recursive: true, force: true })
})

describe('findViolations', () => {
  it('lets core tests import the test runner but not other layers', () => {
    put('core/a.test.ts', `import { it } from 'vitest'\nimport { x } from '../engine/x'\n`)
    const v = findViolations(srcDir)
    expect(v.map((x) => x.specifier)).toEqual(['../engine/x'])
  })

  it('flags core importing another layer', () => {
    put('core/a.ts', `import { x } from '../engine/x'\n`)
    const v = findViolations(srcDir)
    expect(v).toHaveLength(1)
    expect(v[0]).toMatchObject({
      specifier: '../engine/x',
      reason: 'core may only import from core',
    })
  })

  it('flags core importing a package', () => {
    put('core/a.ts', `import { mount } from 'svelte'\n`)
    expect(findViolations(srcDir)).toHaveLength(1)
  })

  it.each(['render', 'engine', 'persist'])('flags %s importing ui', (layer) => {
    put(`${layer}/a.ts`, `import { s } from '../ui/settings.svelte'\n`)
    const v = findViolations(srcDir)
    expect(v).toHaveLength(1)
    expect(v[0]!.reason).toBe(`${layer} must not import ui`)
  })

  it('allows ui -> core, main -> anything, and core -> core', () => {
    put('core/a.ts', `import { b } from './b'\nexport const a = 1\n`)
    put('core/b.ts', `export const b = 1\n`)
    put('ui/c.ts', `import { a } from '../core/a'\n`)
    put('main.ts', `import '../src/ui/c'\nimport { mount } from 'svelte'\n`)
    put('engine/e.ts', `import { a } from '../core/a'\nimport { x } from 'vitest'\n`)
    expect(findViolations(srcDir)).toEqual([])
  })

  it('catches dynamic imports', () => {
    put('render/a.ts', `const m = await import('../ui/x')\n`)
    expect(findViolations(srcDir)).toHaveLength(1)
  })
})

describe('repository src/', () => {
  it('has no boundary violations', () => {
    const repoSrc = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
    expect(findViolations(repoSrc)).toEqual([])
  })
})
