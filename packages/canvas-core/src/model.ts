/**
 * Canonical, library-agnostic canvas model stored in a Yjs document.
 *
 * This module must never import a renderer (tldraw or otherwise): it is shared by
 * the web app and the server-side agents.
 *
 * Y.Doc layout (schema v1):
 *   meta      Y.Map  — { schemaVersion }
 *   items     Y.Map<CanvasItem>  — every visual object (notes, shapes, arrows, frames…)
 *   links     Y.Map<CanvasLink>  — arrow endpoints attached to items
 *   renderer  Y.Map<unknown>     — renderer-only document records (pages, assets…)
 *
 * Values are plain JSON objects, replaced wholesale on change (record-level
 * last-writer-wins). Large content (extracted text, page bodies) does NOT live
 * here — it is stored in Mongo and referenced by id.
 */
import * as Y from 'yjs'

export const CANVAS_SCHEMA_VERSION = 1

export type ItemKind =
  | 'note'
  | 'text'
  | 'shape'
  | 'arrow'
  | 'frame'
  | 'group'
  | 'draw'
  | 'line'
  | 'image'
  | 'embed'
  | 'unknown'

export interface CanvasItem {
  id: string
  kind: ItemKind
  /** Containing frame/group id, or null when the item sits directly on the canvas. */
  parentId: string | null
  /** Fractional z-order key; sorts lexicographically. */
  index: string
  x: number
  y: number
  rotation: number
  w?: number
  h?: number
  /** Plain-text projection of the item's content (what the AI reads). */
  text?: string
  /** Geometry for kind 'shape' (rectangle, ellipse, …). */
  geo?: string
  updatedAt: number
  /**
   * Renderer-specific payload for lossless round-trips, keyed by renderer
   * (e.g. `ext.tldraw`). Canonical fields always win over it.
   */
  ext?: Record<string, unknown>
}

export type LinkTerminal = 'start' | 'end'

export interface CanvasLink {
  id: string
  arrowId: string
  targetId: string
  terminal: LinkTerminal
  ext?: Record<string, unknown>
}

/** A derived connection: an arrow item and the items its ends attach to. */
export interface CanvasEdge {
  arrowId: string
  from: string | null
  to: string | null
  label?: string
}

export interface CanvasMaps {
  meta: Y.Map<unknown>
  items: Y.Map<CanvasItem>
  links: Y.Map<CanvasLink>
  renderer: Y.Map<unknown>
}

export function getCanvasMaps(doc: Y.Doc): CanvasMaps {
  return {
    meta: doc.getMap('meta'),
    items: doc.getMap('items'),
    links: doc.getMap('links'),
    renderer: doc.getMap('renderer'),
  }
}

/** Stamp the schema version on a fresh document (no-op if already set). */
export function ensureSchema(doc: Y.Doc): void {
  const { meta } = getCanvasMaps(doc)
  if (meta.get('schemaVersion') === undefined) meta.set('schemaVersion', CANVAS_SCHEMA_VERSION)
}

export function listItems(doc: Y.Doc): CanvasItem[] {
  return [...getCanvasMaps(doc).items.values()]
}

export function getEdges(doc: Y.Doc): CanvasEdge[] {
  const { items, links } = getCanvasMaps(doc)
  const ends = new Map<string, { from: string | null; to: string | null }>()
  for (const link of links.values()) {
    const entry = ends.get(link.arrowId) ?? { from: null, to: null }
    if (link.terminal === 'start') entry.from = link.targetId
    else entry.to = link.targetId
    ends.set(link.arrowId, entry)
  }
  const edges: CanvasEdge[] = []
  for (const item of items.values()) {
    if (item.kind !== 'arrow') continue
    const end = ends.get(item.id) ?? { from: null, to: null }
    edges.push({ arrowId: item.id, ...end, ...(item.text ? { label: item.text } : {}) })
  }
  return edges
}
