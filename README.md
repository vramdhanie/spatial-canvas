# Spatial Canvas

A person and an AI thinking together on a shared, infinite, spatial canvas. This repo is the
**local prototype**: every component of the target stack running on one machine.

Planning docs (outside this repo): `~/Code/notes/Work/SpatialCanvas/` —
`Scope.md`, `MVP.md`, `TechEvaluation.md`, `PrototypePlan.md`.

## Prerequisites

- Node ≥ 24 and pnpm 10 (`corepack enable`)
- Docker Desktop
- Java 11+ and `firebase-tools` (`npm i -g firebase-tools`) — for the Auth emulator
- ngrok (optional, for remote access)
- An Anthropic API key (needed from M4)

## Quick start

```bash
pnpm install
cp .env.example .env          # local test values; add ANTHROPIC_API_KEY when needed
pnpm infra:up                 # Mongo (Atlas local), Redis, GCS emulator
pnpm dev                      # web + api + agents + sync + Auth emulator
pnpm seed                     # once: creates the local test users (see infra/local/seed-users.mjs)
```

Open <http://localhost:5173>. The home page shows a health check of every service, reached
through the web dev server's single-origin proxy.

## Layout

| Path                     | What                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `apps/web`               | Vite + React SPA; `vite.config.ts` is the single-origin proxy  |
| `services/api`           | Fastify — canvases, sharing, uploads                           |
| `services/agents`        | AI — Anthropic TS SDK, spatial context, tools, research brief  |
| `services/sync`          | Yjs WebSocket sync (Hocuspocus) with Mongo persistence         |
| `packages/shared`        | Shared types + zod schemas                                     |
| `packages/canvas-core`   | Canonical canvas model + tldraw adapter (no tldraw types leak) |
| `packages/design-system` | Tailwind v4 theme, tokens, components                          |
| `infra/local`            | docker-compose, Firebase emulator config, seed script          |
| `evals`                  | Spatial-context eval fixtures (M6)                             |

## Ports

| Port  | Service                                                                    |
| ----- | -------------------------------------------------------------------------- |
| 5173  | Web (the only origin the browser uses)                                     |
| 4100  | api (`/api/*`)                                                             |
| 4101  | sync (`/sync`, WebSocket)                                                  |
| 4102  | agents (`/agents/*`)                                                       |
| 9099  | Auth emulator (proxied: `/identitytoolkit…`, `/securetoken…`, `/emulator`) |
| 4010  | Emulator UI                                                                |
| 27017 | MongoDB · 6379 Redis · 4443 GCS emulator                                   |

## Scripts

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm format` ·
`pnpm infra:up` / `infra:down` / `infra:logs` · `pnpm seed`

## Notes

- Auth emulator state persists in `infra/local/.emulator-data/` (git-ignored), so test users keep
  their UIDs across restarts.
- TypeScript is pinned to 6.0.x because `typescript-eslint` does not yet support TypeScript 7.
- MinIO no longer publishes Docker images, so object storage uses `fake-gcs-server` (GCS-compatible,
  matching the production target).
