/**
 * Framework-agnostic design tokens. These are the source of truth and must stay
 * free of web-only concepts so they can be reused by the desktop/mobile apps later.
 * `styles.css` mirrors them as Tailwind theme variables for the web.
 */
export const tokens = {
  color: {
    background: '#fafaf9',
    surface: '#ffffff',
    foreground: '#1c1917',
    muted: '#78716c',
    border: '#e7e5e4',
    primary: '#4f46e5',
    primaryForeground: '#ffffff',
    success: '#16a34a',
    danger: '#dc2626',
  },
  radius: { sm: 4, md: 8, lg: 12 },
  font: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
} as const

export type Tokens = typeof tokens
