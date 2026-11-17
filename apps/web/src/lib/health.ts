import { HealthResponse, type ServiceName } from '@sc/shared'

export type Probe = { name: string; ok: boolean; detail: string }

const servicePaths: Record<ServiceName, string> = {
  api: '/api/health',
  agents: '/agents/health',
  sync: '/sync/health',
}

async function probeService(name: ServiceName): Promise<Probe> {
  try {
    const res = await fetch(servicePaths[name])
    const parsed = HealthResponse.safeParse(await res.json())
    return parsed.success
      ? { name, ok: true, detail: parsed.data.time }
      : { name, ok: false, detail: 'unexpected response' }
  } catch (err) {
    return { name, ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

async function probeAuthEmulator(): Promise<Probe> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-spatial-canvas'
  try {
    const res = await fetch(`/emulator/v1/projects/${projectId}/config`)
    return { name: 'auth emulator', ok: res.ok, detail: `HTTP ${res.status}` }
  } catch (err) {
    return {
      name: 'auth emulator',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function probeAll(): Promise<Probe[]> {
  return Promise.all([
    probeService('api'),
    probeService('agents'),
    probeService('sync'),
    probeAuthEmulator(),
  ])
}
