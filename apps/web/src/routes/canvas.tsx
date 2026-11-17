import { CANVAS_SCHEMA_VERSION } from '@sc/canvas-core'
import { useParams } from '@tanstack/react-router'

/** M0 placeholder — the tldraw ↔ Yjs canvas arrives in M1. */
export function CanvasPage() {
  const { canvasId } = useParams({ from: '/c/$canvasId' })
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Canvas {canvasId}</h1>
      <p className="text-muted">Canvas arrives in M1 (schema v{CANVAS_SCHEMA_VERSION}).</p>
    </div>
  )
}
