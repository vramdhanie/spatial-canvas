// @sc/agents — AI: canvas serializer, spatial signals, tools, research brief, ingestion (PrototypePlan AI1-AI6, I1-I2).
import Fastify from 'fastify'
import { healthResponse } from '@sc/shared'

const port = Number(process.env.AGENTS_PORT ?? 4102)

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })

app.get('/health', async () => healthResponse('agents'))

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
