import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface Violation {
  file: string
  specifier: string
  reason: string
}

const SOURCE_FILE = /\.(ts|svelte)$/
const IMPORT_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g

function collectFiles(dir: string): string[] {
  const files: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) files.push(...collectFiles(path))
    else if (SOURCE_FILE.test(name)) files.push(path)
  }
  return files
}

/** The top-level layer a path under `srcDir` belongs to, or null if outside it. */
function layerOf(srcDir: string, path: string): string | null {
  const rel = relative(srcDir, path)
  if (rel.startsWith('..')) return null
  return rel.split(sep)[0] ?? null
}

/**
 * Layer rules (architecture spine): `core` imports nothing outside `core`;
 * `render`, `engine` and `persist` never import `ui`.
 */
export function findViolations(srcDir: string): Violation[] {
  const violations: Violation[] = []
  for (const file of collectFiles(srcDir)) {
    const layer = layerOf(srcDir, file)
    if (layer !== 'core' && layer !== 'render' && layer !== 'engine' && layer !== 'persist')
      continue
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(IMPORT_SPECIFIER)) {
      const specifier = match[1]!
      const isRelative = specifier.startsWith('.')
      const target = isRelative ? layerOf(srcDir, resolve(dirname(file), specifier)) : null
      if (layer === 'core' && (!isRelative || target !== 'core')) {
        violations.push({ file, specifier, reason: 'core may only import from core' })
      } else if (layer !== 'core' && target === 'ui') {
        violations.push({ file, specifier, reason: `${layer} must not import ui` })
      }
    }
  }
  return violations
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
  const violations = findViolations(srcDir)
  for (const v of violations) {
    console.error(`${relative(process.cwd(), v.file)}: import '${v.specifier}' — ${v.reason}`)
  }
  process.exit(violations.length > 0 ? 1 : 0)
}
