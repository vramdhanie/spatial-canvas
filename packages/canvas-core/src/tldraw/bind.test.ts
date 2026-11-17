import {
  GeoShapeUtil,
  createShapeId,
  createTLStore,
  defaultBindingUtils,
  defaultShapeUtils,
  toRichText,
  type IndexKey,
  type TLShape,
  type TLStore,
} from 'tldraw'
import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { getCanvasMaps, listItems } from '../model.ts'
import { DEFAULT_PAGE_ID, bindStoreToDoc } from './bind.ts'
import { itemToShape, shapeToItem } from './mapping.ts'

const newStore = () =>
  createTLStore({ shapeUtils: defaultShapeUtils, bindingUtils: defaultBindingUtils })

/** Two docs wired together the way the sync server relays updates between browsers. */
function connectedPair() {
  const docA = new Y.Doc()
  const docB = new Y.Doc()
  docA.on(
    'update',
    (u: Uint8Array, origin: unknown) => origin !== 'relay' && Y.applyUpdate(docB, u, 'relay'),
  )
  docB.on(
    'update',
    (u: Uint8Array, origin: unknown) => origin !== 'relay' && Y.applyUpdate(docA, u, 'relay'),
  )
  const storeA = newStore()
  const storeB = newStore()
  bindStoreToDoc(storeA, docA)
  bindStoreToDoc(storeB, docB)
  return { docA, docB, storeA, storeB }
}

function geoShape(text = 'hello'): TLShape {
  const defaults = new GeoShapeUtil(null as never).getDefaultProps()
  return {
    id: createShapeId(),
    typeName: 'shape',
    type: 'geo',
    parentId: DEFAULT_PAGE_ID,
    index: 'a1' as IndexKey,
    x: 100,
    y: 200,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    meta: {},
    props: { ...defaults, w: 120, h: 80, richText: toRichText(text) },
  } as TLShape
}

const shapes = (store: TLStore) =>
  store.allRecords().filter((r) => r.typeName === 'shape') as TLShape[]

describe('tldraw ↔ Yjs binding', () => {
  it('creates one deterministic page on both fresh clients', () => {
    const { storeA, storeB } = connectedPair()
    const pages = (s: TLStore) =>
      s
        .allRecords()
        .filter((r) => r.typeName === 'page')
        .map((r) => r.id)
    expect(pages(storeA)).toEqual([DEFAULT_PAGE_ID])
    expect(pages(storeB)).toEqual([DEFAULT_PAGE_ID])
  })

  it('propagates create, move, text edit and delete between clients', () => {
    const { storeA, storeB, docB } = connectedPair()
    const shape = geoShape('first')

    storeA.put([shape])
    expect(shapes(storeB).map((s) => s.id)).toEqual([shape.id])

    storeA.update(shape.id, (s) => ({ ...s, x: 500 }))
    expect(shapes(storeB)[0]?.x).toBe(500)

    storeA.update(
      shape.id,
      (s) =>
        ({
          ...s,
          props: { ...(s.props as object), richText: toRichText('second') },
        }) as TLShape,
    )
    expect(listItems(docB).find((i) => i.id === shape.id)?.text).toBe('second')

    storeA.remove([shape.id])
    expect(shapes(storeB)).toEqual([])
  })

  it('applies canonical-model edits (e.g. from the AI) to the renderer', () => {
    const { storeA, docA, storeB } = connectedPair()
    const shape = geoShape('draft')
    storeA.put([shape])

    // Another client edits only canonical fields — no tldraw knowledge.
    const { items } = getCanvasMaps(docA)
    const item = items.get(shape.id)!
    docA.transact(() => items.set(shape.id, { ...item, text: 'rewritten by AI', x: 42 }), 'ai')

    for (const store of [storeA, storeB]) {
      const s = shapes(store)[0]!
      expect(s.x).toBe(42)
      expect(itemToShape(shapeToItem(s), DEFAULT_PAGE_ID)).toEqual(s)
      expect(shapeToItem(s).text).toBe('rewritten by AI')
    }
  })

  it('round-trips a shape losslessly through the canonical item', () => {
    const shape = geoShape('lossless')
    const item = shapeToItem(shape, 0)
    expect(item).toMatchObject({
      kind: 'shape',
      geo: 'rectangle',
      w: 120,
      h: 80,
      text: 'lossless',
      parentId: null,
    })
    expect(itemToShape(item, DEFAULT_PAGE_ID)).toEqual(shape)
  })

  it('does not echo remote changes back into the document', () => {
    const { storeA, docB } = connectedPair()
    let writesOnB = 0
    docB.on('update', (_u: Uint8Array, origin: unknown) => origin !== 'relay' && writesOnB++)
    storeA.put([geoShape()])
    expect(writesOnB).toBe(0)
  })
})
