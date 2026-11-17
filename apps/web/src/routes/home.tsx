import { Button, cn } from '@sc/design-system'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { probeAll } from '../lib/health.ts'

const newCanvasId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12)

/** Placeholder until M2: a "new canvas" button plus a stack health check. */
export function HomePage() {
  const navigate = useNavigate()
  const { data, isFetching, refetch } = useQuery({ queryKey: ['health'], queryFn: probeAll })

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your canvases</h1>
          <p className="text-muted">Canvas list arrives in M2. Below: local stack health.</p>
        </div>
        <Button
          onClick={() => void navigate({ to: '/c/$canvasId', params: { canvasId: newCanvasId() } })}
        >
          New canvas
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Services (via single-origin proxy)</h2>
          <Button variant="ghost" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Checking…' : 'Re-check'}
          </Button>
        </div>
        <ul className="space-y-2 font-mono text-sm">
          {(data ?? []).map((probe) => (
            <li key={probe.name} className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-block size-2.5 rounded-full',
                  probe.ok ? 'bg-success' : 'bg-danger',
                )}
              />
              <span className="w-28">{probe.name}</span>
              <span className="truncate text-muted">{probe.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
