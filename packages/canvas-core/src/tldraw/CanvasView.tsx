import { useEffect, useState } from 'react'
import { Tldraw, createTLStore, defaultBindingUtils, defaultShapeUtils } from 'tldraw'
import type * as Y from 'yjs'
import { bindStoreToDoc } from './bind.ts'

export interface CanvasViewProps {
  /** A Yjs document that is already synced with the server. */
  doc: Y.Doc
}

/**
 * The canvas surface. Renders tldraw bound to the canonical Yjs document.
 * Key this component by canvas id so a new canvas gets a fresh store.
 */
export function CanvasView({ doc }: CanvasViewProps) {
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils, bindingUtils: defaultBindingUtils }),
  )
  const [bound, setBound] = useState(false)

  useEffect(() => {
    const unbind = bindStoreToDoc(store, doc)
    setBound(true)
    return unbind
  }, [store, doc])

  if (!bound) return null
  return <Tldraw store={store} />
}
