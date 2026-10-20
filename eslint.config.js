import svelte from 'eslint-plugin-svelte'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'dev-dist/', 'node_modules/', '_bmad/', '_bmad-output/', '.claude/'] },
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
)
