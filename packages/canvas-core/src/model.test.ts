import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { getCanvasMaps, getEdges, type CanvasItem } from './model.ts'

const item = (
  id: string,
  kind: CanvasItem['kind'],
  extra: Partial<CanvasItem> = {},
): CanvasItem => ({
  id,
  kind,
  parentId: null,
  index: 'a1',
  x: 0,
  y: 0,
  rotation: 0,
  updatedAt: 0,
  ...extra,
})

describe('getEdges', () => {
  it('derives from → to connections from arrow items and their links', () => {
    const doc = new Y.Doc()
    const { items, links } = getCanvasMaps(doc)
    items.set('a', item('a', 'note'))
    items.set('b', item('b', 'note'))
    items.set('arrow1', item('arrow1', 'arrow', { text: 'supports' }))
    items.set('arrow2', item('arrow2', 'arrow'))
    links.set('l1', { id: 'l1', arrowId: 'arrow1', targetId: 'a', terminal: 'start' })
    links.set('l2', { id: 'l2', arrowId: 'arrow1', targetId: 'b', terminal: 'end' })

    expect(getEdges(doc)).toEqual([
      { arrowId: 'arrow1', from: 'a', to: 'b', label: 'supports' },
      { arrowId: 'arrow2', from: null, to: null },
    ])
  })
})
