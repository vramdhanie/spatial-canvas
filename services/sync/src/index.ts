// @sc/sync — Yjs WebSocket sync (Hocuspocus) with MongoDB persistence (PrototypePlan S1).
// One Yjs document per canvas, named `canvas:<id>`. Full document state is stored
// in Mongo `canvas_docs`, debounced by Hocuspocus.
// TODO(M2): onAuthenticate — verify the Firebase ID token and canvas membership.
import { Database } from '@hocuspocus/extension-database'
import { Server } from '@hocuspocus/server'
import { healthResponse } from '@sc/shared'
import { Binary, MongoClient } from 'mongodb'

const port = Number(process.env.SYNC_PORT ?? 4101)
const mongoUri =
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/spatial_canvas?directConnection=true'

/** Allowed document names; the name comes from the client, so validate it. */
const DOCUMENT_NAME = /^canvas:[A-Za-z0-9_-]{1,64}$/

interface CanvasDocRow {
  _id: string
  state: Binary
  bytes: number
  updatedAt: Date
}

const mongo = new MongoClient(mongoUri)
await mongo.connect()
const canvasDocs = mongo.db().collection<CanvasDocRow>('canvas_docs')

const log = (msg: string, extra: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ service: 'sync', time: new Date().toISOString(), msg, ...extra }))

const server = new Server({
  port,
  address: '127.0.0.1',
  quiet: true,
  debounce: 2000,
  maxDebounce: 10000,

  async onRequest({ request, response }) {
    if (request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify(healthResponse('sync')))
      // Rejecting with a falsy value tells Hocuspocus the request was handled.
      return Promise.reject()
    }
  },

  async onConnect({ documentName }) {
    if (!DOCUMENT_NAME.test(documentName)) throw new Error(`invalid document name: ${documentName}`)
    log('connect', { documentName })
  },

  async onDisconnect({ documentName, clientsCount }) {
    log('disconnect', { documentName, clientsCount })
  },

  async onDestroy() {
    await mongo.close()
  },

  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const row = await canvasDocs.findOne({ _id: documentName })
        log('load', { documentName, found: Boolean(row), bytes: row?.bytes ?? 0 })
        return row ? new Uint8Array(row.state.buffer) : null
      },
      store: async ({ documentName, state }) => {
        await canvasDocs.updateOne(
          { _id: documentName },
          { $set: { state: new Binary(state), bytes: state.byteLength, updatedAt: new Date() } },
          { upsert: true },
        )
        log('store', { documentName, bytes: state.byteLength })
      },
    }),
  ],
})

await server.listen()
log(`listening on ${server.URL}`)
