import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.turbo/**', 'infra/local/.emulator-data/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'apps/web/**/*.{ts,tsx}',
      'packages/design-system/**/*.{ts,tsx}',
      'packages/canvas-core/**/*.{ts,tsx}',
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['services/**/*.ts', 'infra/**/*.{js,mjs}', '*.{js,ts}', '**/vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
)
