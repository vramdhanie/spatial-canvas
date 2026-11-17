/**
 * canvas-core — the library-agnostic canonical canvas model.
 *
 * Entry points:
 *  - `@sc/canvas-core`            canonical model (no renderer; safe for servers)
 *  - `@sc/canvas-core/tldraw`     tldraw adapter + <CanvasView> (the only place tldraw is used)
 *  - `@sc/canvas-core/styles.css` renderer styles
 *
 * Rule: no tldraw types may leak out of this package.
 */
export * from './model.ts'
