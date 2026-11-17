import { HocuspocusProvider } from '@hocuspocus/provider'
import { CanvasView } from '@sc/canvas-core/tldraw'
import { cn } from '@sc/design-system'
import { useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import * as Y from 'yjs'

type Status = 'connecting' | 'connected' | 'disconnected'

/** Sync endpoint on the single origin (works on localhost and via ngrok). */
const syncUrl = () => `${window.location.origin.replace(/^http/, 'ws')}/sync`

export function CanvasPage() {
  const { canvasId } = useParams({ from: '/c/$canvasId' })
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [status, setStatus] = useState<Status>('connecting')
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    const ydoc = new Y.Doc()
    const provider = new HocuspocusProvider({
      url: syncUrl(),
      name: `canvas:${canvasId}`,
      document: ydoc,
      onStatus: ({ status }) => setStatus(status as Status),
      onSynced: ({ state }) => {
        if (state) setSynced(true)
      },
    })
    setDoc(ydoc)
    return () => {
      provider.destroy()
      ydoc.destroy()
      setDoc(null)
      setSynced(false)
    }
  }, [canvasId])

  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        {doc && synced ? (
          <CanvasView key={canvasId} doc={doc} />
        ) : (
          <div className="grid h-full place-items-center text-muted">Loading canvas…</div>
        )}
      </div>
      <div className="pointer-events-none absolute top-2 right-2 z-[1000] rounded-full border border-border bg-surface/90 px-3 py-1 font-mono text-xs shadow-sm">
        <span
          className={cn(
            'mr-2 inline-block size-2 rounded-full',
            status === 'connected' ? 'bg-success' : 'bg-danger',
          )}
        />
        canvas:{canvasId} · {status}
      </div>
    </div>
  )
}
