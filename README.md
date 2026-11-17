# Spatial Canvas

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A524-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?logo=turborepo&logoColor=white)](https://turborepo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![tldraw](https://img.shields.io/badge/tldraw-5-1D1D1D)](https://tldraw.dev/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-30BCED)](https://yjs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Claude](https://img.shields.io/badge/AI-Claude-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com/claude)

A person and an AI thinking together on a shared, infinite, spatial canvas. This repo is the
**local prototype**: every component of the target stack running on one machine.

This is my most ambitious experiment to date, a totally new way to interact with an agent!

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

## License

[MIT](LICENSE) © 2026 Vincent Ramdhanie.

Third-party dependencies keep their own licenses. Notably, the **tldraw SDK is not MIT**: it is
free in development but requires a tldraw license key for production deployments
(see [tldraw.dev/pricing](https://tldraw.dev/pricing)).
