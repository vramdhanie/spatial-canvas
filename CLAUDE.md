# Spatial Canvas — project memory

- **Fully isolated project.** Unrelated to any other app (incl. flamingo-fer/Sybill). Never borrow
  code, conventions, accounts, or infra from other repos; decide every choice on its own merits.
- **TypeScript-only** monorepo (pnpm + Turborepo). A narrow Python worker is a contingency only.
- Plans live outside the repo in `~/Code/notes/Work/SpatialCanvas/` (`PrototypePlan.md` is the
  build plan with component IDs F/C/S/A/M/I/AI/E/N and milestones M0–M6). Keep it updated.
- Working style: small, contained steps; confirm with Vincent before significant actions.

## Architecture rules

- The browser talks to **one origin** (Vite dev server, `apps/web/vite.config.ts`), which proxies
  `/api`, `/agents`, `/sync` (WebSocket) and the Firebase Auth emulator paths. Never call service
  ports directly from the client — this is what makes two-browser and ngrok use work.
- `packages/canvas-core` owns the canonical canvas model; **no tldraw types outside it**. The AI
  reads/writes the canonical model, never tldraw's store.
- Large content (extracted text, page bodies) lives in Mongo, referenced by id — not in the Yjs doc.
- Internal packages are consumed as TypeScript source (`exports` → `src/index.ts`); services run via
  `tsx`, the web app via Vite. Use `.ts` extensions in relative imports.
- Shared API contracts are zod schemas in `packages/shared`.
- Claude models: default `claude-opus-5-5` (Anthropic TS SDK, tool use via the Tool Runner).

## Commands

`pnpm infra:up` · `pnpm dev` · `pnpm seed` · `pnpm typecheck` · `pnpm lint` · `pnpm test` ·
`pnpm format`. Run typecheck + lint + test before considering a change done.
