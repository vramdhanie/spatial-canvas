import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

/**
 * Single-origin dev server (PrototypePlan §3): the browser only ever talks to this
 * origin, which proxies to every backend. The same layout works on localhost and
 * through one ngrok tunnel.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '')

  const service = (port: string, prefix: string, ws = false): ProxyOptions => ({
    target: `${ws ? 'ws' : 'http'}://127.0.0.1:${port}`,
    ws,
    changeOrigin: true,
    rewrite: (path) => path.replace(new RegExp(`^${prefix}`), '') || '/',
  })

  const authEmulator: ProxyOptions = {
    target: `http://${env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'}`,
    changeOrigin: true,
  }

  return {
    envDir: repoRoot,
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.WEB_PORT ?? 5173),
      strictPort: true,
      allowedHosts: env.NGROK_DOMAIN ? [env.NGROK_DOMAIN] : [],
      proxy: {
        '/api': service(env.API_PORT ?? '4100', '/api'),
        '/agents': service(env.AGENTS_PORT ?? '4102', '/agents'),
        '/sync': service(env.SYNC_PORT ?? '4101', '/sync', true),
        // Firebase Auth emulator endpoints (client uses connectAuthEmulator(auth, origin)).
        '/identitytoolkit.googleapis.com': authEmulator,
        '/securetoken.googleapis.com': authEmulator,
        '/emulator': authEmulator,
      },
    },
  }
})
