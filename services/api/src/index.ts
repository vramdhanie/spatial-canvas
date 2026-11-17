// @sc/api — App gateway: canvases, members/sharing, uploads, ingestion trigger (PrototypePlan A1/A3).
import Fastify from 'fastify'
import { healthResponse } from '@sc/shared'

const port = Number(process.env.API_PORT ?? 4100)

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })

app.get('/health', async () => healthResponse('api'))

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
