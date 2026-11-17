// Prints the canonical model of a persisted canvas, read straight from Mongo.
// Uses only the renderer-free `@sc/canvas-core` model — exactly what the agents service will see.
// Usage: pnpm --filter @sc/sync inspect <canvasId>
import { getEdges, listItems } from '@sc/canvas-core'
import { MongoClient, type Binary } from 'mongodb'
import * as Y from 'yjs'

const canvasId = process.argv[2]
if (!canvasId) {
  console.error('usage: inspect <canvasId>')
  process.exit(1)
}

const mongo = new MongoClient(
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/spatial_canvas?directConnection=true',
)
await mongo.connect()
const row = await mongo
  .db()
  .collection<{ _id: string; state: Binary; updatedAt: Date }>('canvas_docs')
  .findOne({ _id: `canvas:${canvasId}` })
await mongo.close()

if (!row) {
  console.error(`no persisted document for canvas:${canvasId}`)
  process.exit(1)
}

const doc = new Y.Doc()
Y.applyUpdate(doc, new Uint8Array(row.state.buffer))

const items = listItems(doc)
console.log(`canvas:${canvasId} — persisted ${row.updatedAt.toISOString()}`)
console.log('\nitems:')
console.table(
  items.map((i) => ({
    id: i.id,
    kind: i.kind,
    geo: i.geo,
    text: i.text,
    x: Math.round(i.x),
    y: Math.round(i.y),
    w: i.w,
    h: i.h,
  })),
)
console.log('edges:')
const label = (id: string | null) => (id ? (items.find((i) => i.id === id)?.text ?? id) : '∅')
for (const e of getEdges(doc)) console.log(`  "${label(e.from)}"  →  "${label(e.to)}"`)
