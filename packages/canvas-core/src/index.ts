/**
 * canvas-core — the library-agnostic canonical canvas model.
 *
 * This package will own (PrototypePlan M1):
 *  - the canonical canvas schema stored in the Yjs document (items, edges, groups),
 *  - the tldraw adapter (the only place tldraw types are allowed),
 *  - custom shape definitions,
 *  - read/write helpers shared by the web app and the agents service.
 *
 * Rule: no tldraw types may leak out of this package.
 */
export const CANVAS_SCHEMA_VERSION = 1
