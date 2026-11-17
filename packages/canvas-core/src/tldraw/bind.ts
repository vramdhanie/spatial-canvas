/**
 * Two-way binding between a tldraw store and the canonical Yjs document.
 *
 *  - Local user edits (store, source 'user', scope 'document') → one Y transaction
 *    tagged with this binding's origin.
 *  - Any other Y transaction (remote peers, server, AI) → applied to the store via
 *    `mergeRemoteChanges`, so it never echoes back and never enters undo history
 *    (which also gives per-user undo for free).
 */
import {
  PageRecordType,
  type IndexKey,
  type TLPageId,
  type TLRecord,
  type TLShape,
  type TLStore,
} from 'tldraw'
import * as Y from 'yjs'
import { ensureSchema, getCanvasMaps, type CanvasItem, type CanvasLink } from '../model.ts'
import {
  bindingToLink,
  isArrowBinding,
  itemToShape,
  linkToBinding,
  shapeToItem,
} from './mapping.ts'

export const DEFAULT_PAGE_ID = PageRecordType.createId('main')

export function bindStoreToDoc(store: TLStore, doc: Y.Doc): () => void {
  const { items, links, renderer } = getCanvasMaps(doc)
  const origin = { binding: 'tldraw' }
  const tracked = new Set<unknown>([renderer, items, links])

  const currentPageId = (): TLPageId =>
    (store.allRecords().find((r) => r.typeName === 'page')?.id as TLPageId | undefined) ??
    DEFAULT_PAGE_ID

  // ---- Y → store -----------------------------------------------------------
  const recordFor = (map: Y.Map<unknown>, key: string): TLRecord | null => {
    const value = map.get(key)
    if (value === undefined) return null
    if (map === (items as Y.Map<unknown>))
      return itemToShape(value as CanvasItem, currentPageId()) as TLRecord | null
    if (map === (links as Y.Map<unknown>))
      return linkToBinding(value as CanvasLink) as TLRecord | null
    return value as TLRecord
  }

  /** Apply keys from the given maps; renderer records first, then parents before children, then links. */
  const applyToStore = (changed: Map<Y.Map<unknown>, Iterable<string>>) => {
    const puts: TLRecord[] = []
    const removes: TLRecord['id'][] = []
    for (const map of [renderer, items, links] as Y.Map<unknown>[]) {
      const keys = changed.get(map)
      if (!keys) continue
      const batch: TLRecord[] = []
      for (const key of keys) {
        const record = recordFor(map, key)
        if (record) batch.push(record)
        else if (!map.has(key) && store.has(key as TLRecord['id']))
          removes.push(key as TLRecord['id'])
      }
      if (map === (items as Y.Map<unknown>)) {
        batch.sort((a, b) => depth(a as TLShape, batch) - depth(b as TLShape, batch))
      }
      puts.push(...batch)
    }
    if (puts.length === 0 && removes.length === 0) return
    store.mergeRemoteChanges(() => {
      if (removes.length > 0) store.remove(removes)
      if (puts.length > 0) store.put(puts)
    })
  }

  const onAfterTransaction = (tr: Y.Transaction) => {
    if (tr.origin === origin) return
    const changed = new Map<Y.Map<unknown>, Iterable<string>>()
    for (const [type, keys] of tr.changed) {
      if (tracked.has(type)) {
        changed.set(
          type as unknown as Y.Map<unknown>,
          [...keys].filter((k): k is string => k !== null),
        )
      }
    }
    if (changed.size > 0) applyToStore(changed)
  }

  // ---- store → Y -----------------------------------------------------------
  const write = (record: TLRecord) => {
    if (record.typeName === 'shape') items.set(record.id, shapeToItem(record as TLShape))
    else if (isArrowBinding(record)) links.set(record.id, bindingToLink(record))
    else renderer.set(record.id, record)
  }
  const erase = (id: string) => {
    items.delete(id)
    links.delete(id)
    renderer.delete(id)
  }

  // ---- initial sync ----------------------------------------------------------
  applyToStore(
    new Map<Y.Map<unknown>, Iterable<string>>([
      [renderer, [...renderer.keys()]],
      [items as Y.Map<unknown>, [...items.keys()]],
      [links as Y.Map<unknown>, [...links.keys()]],
    ]),
  )
  doc.transact(() => {
    ensureSchema(doc)
    // Deterministic page id so two fresh clients never create two different pages.
    if (!store.allRecords().some((r) => r.typeName === 'page')) {
      store.put([
        PageRecordType.create({ id: DEFAULT_PAGE_ID, name: 'Page 1', index: 'a1' as IndexKey }),
      ])
    }
    // Push document records the doc doesn't have yet (fresh canvas).
    for (const record of store.allRecords()) {
      if (store.scopedTypes.document.has(record.typeName) && !hasKey(record.id)) write(record)
    }
  }, origin)

  function hasKey(id: string) {
    return items.has(id) || links.has(id) || renderer.has(id)
  }

  const unlisten = store.listen(
    ({ changes }) => {
      doc.transact(() => {
        for (const record of Object.values(changes.added)) write(record)
        for (const [, to] of Object.values(changes.updated)) write(to)
        for (const record of Object.values(changes.removed)) erase(record.id)
      }, origin)
    },
    { source: 'user', scope: 'document' },
  )
  doc.on('afterTransaction', onAfterTransaction)

  return () => {
    unlisten()
    doc.off('afterTransaction', onAfterTransaction)
  }
}

/** Nesting depth within a batch, so parents are put before their children. */
function depth(shape: TLShape, batch: TLRecord[]): number {
  let d = 0
  let parent = batch.find((r) => r.id === shape.parentId) as TLShape | undefined
  while (parent && d < 32) {
    d++
    const next = parent.parentId
    parent = batch.find((r) => r.id === next) as TLShape | undefined
  }
  return d
}
