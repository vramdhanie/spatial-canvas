import { describe, expect, it } from 'vitest'
import { HealthResponse, healthResponse } from './health.ts'

describe('healthResponse', () => {
  it('produces a payload that validates against the shared schema', () => {
    const payload = healthResponse('api')
    expect(HealthResponse.parse(payload)).toEqual(payload)
  })

  it('rejects an unknown service name', () => {
    expect(() => HealthResponse.parse({ ...healthResponse('api'), service: 'nope' })).toThrow()
  })
})
