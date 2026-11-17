import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['{apps,services,packages}/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
