/**
 * Pure conversions between tldraw records and the canonical model.
 * Canonical fields always win; `ext.tldraw` keeps the full record for lossless round-trips.
 */
import { toRichText, type TLBinding, type TLPageId, type TLRecord, type TLShape } from 'tldraw'
import type { CanvasItem, CanvasLink, ItemKind, LinkTerminal } from '../model.ts'

const KIND_BY_TYPE: Record<string, ItemKind> = {
  geo: 'shape',
  note: 'note',
  text: 'text',
  arrow: 'arrow',
  frame: 'frame',
  group: 'group',
  draw: 'draw',
  highlight: 'draw',
  line: 'line',
  image: 'image',
  video: 'image',
  embed: 'embed',
  bookmark: 'embed',
}

type Props = Record<string, unknown>
type RichNode = { type?: string; text?: string; content?: RichNode[] }

export const isPageId = (id: string): boolean => id.startsWith('page:')

/** Plain text from tldraw rich text (ProseMirror JSON): one line per block. */
export function richTextToPlain(richText: unknown): string | undefined {
  if (!richText || typeof richText !== 'object') return undefined
  const inline = (node: RichNode): string =>
    node.type === 'text'
      ? (node.text ?? '')
      : node.type === 'hardBreak'
        ? '\n'
        : (node.content ?? []).map(inline).join('')
  const blocks = (richText as RichNode).content ?? []
  const text = blocks.map(inline).join('\n')
  return text.length > 0 ? text : undefined
}

export function shapeToItem(shape: TLShape, now: number = Date.now()): CanvasItem {
  const props = shape.props as Props
  const item: CanvasItem = {
    id: shape.id,
    kind: KIND_BY_TYPE[shape.type] ?? 'unknown',
    parentId: isPageId(shape.parentId) ? null : shape.parentId,
    index: shape.index,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation,
    updatedAt: now,
    ext: { tldraw: shape },
  }
  if (typeof props.w === 'number') item.w = props.w
  if (typeof props.h === 'number') item.h = props.h
  if (typeof props.geo === 'string') item.geo = props.geo
  const text =
    richTextToPlain(props.richText) ??
    (typeof props.name === 'string' && props.name ? props.name : undefined)
  if (text !== undefined) item.text = text
  return item
}

/**
 * Canonical item → tldraw shape. Returns null for items with no tldraw payload
 * (created by another client, e.g. the AI); constructing those from defaults
 * arrives with the agents work (M4).
 */
export function itemToShape(item: CanvasItem, pageId: TLPageId): TLShape | null {
  const base = item.ext?.tldraw as TLShape | undefined
  if (!base) return null
  const props: Props = { ...(base.props as Props) }
  if (item.w !== undefined && 'w' in props) props.w = item.w
  if (item.h !== undefined && 'h' in props) props.h = item.h
  if (item.geo !== undefined && 'geo' in props) props.geo = item.geo
  if (item.text !== undefined) {
    if ('richText' in props) {
      if (item.text !== richTextToPlain(props.richText)) props.richText = toRichText(item.text)
    } else if ('name' in props) {
      props.name = item.text
    }
  }
  return {
    ...base,
    parentId: (item.parentId ?? pageId) as TLShape['parentId'],
    index: item.index as TLShape['index'],
    x: item.x,
    y: item.y,
    rotation: item.rotation,
    props,
  } as TLShape
}

export const isArrowBinding = (record: TLRecord): record is TLBinding =>
  record.typeName === 'binding' && record.type === 'arrow'

export function bindingToLink(binding: TLBinding): CanvasLink {
  const props = binding.props as unknown as Props
  return {
    id: binding.id,
    arrowId: binding.fromId,
    targetId: binding.toId,
    terminal: (props.terminal === 'start' ? 'start' : 'end') satisfies LinkTerminal,
    ext: { tldraw: binding },
  }
}

export function linkToBinding(link: CanvasLink): TLBinding | null {
  const base = link.ext?.tldraw as TLBinding | undefined
  if (!base) return null
  return {
    ...base,
    fromId: link.arrowId,
    toId: link.targetId,
    props: { ...(base.props as unknown as Props), terminal: link.terminal },
  } as TLBinding
}
