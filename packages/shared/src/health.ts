import { z } from 'zod'

export const ServiceName = z.enum(['api', 'agents', 'sync'])
export type ServiceName = z.infer<typeof ServiceName>

export const HealthResponse = z.object({
  service: ServiceName,
  status: z.literal('ok'),
  time: z.iso.datetime(),
})
export type HealthResponse = z.infer<typeof HealthResponse>

export function healthResponse(service: ServiceName): HealthResponse {
  return { service, status: 'ok', time: new Date().toISOString() }
}
