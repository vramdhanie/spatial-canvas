// @sc/sync — Yjs WebSocket sync (Hocuspocus) with Mongo persistence; Hocuspocus attaches in M1 (PrototypePlan S1/S2).
import Fastify from 'fastify'
import { healthResponse } from '@sc/shared'

const port = Number(process.env.SYNC_PORT ?? 4101)

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })

app.get('/health', async () => healthResponse('sync'))

try {
  await app.listen({ port, host: '127.0.0.1' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.close().then(() => process.exit(0))
  })
}
