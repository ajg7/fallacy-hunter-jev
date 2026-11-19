# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working agreement (read first)

- **Sidekick mode, strict.** The user writes all feature code and tests. Claude names the files, insertion points, signatures, and the test cases to write, then reviews and runs checks. Claude may write config, tooling, and scaffolding. Never write feature code unless the user explicitly asks for that specific piece.
- **Evidence-gated milestones.** Work follows `docs/build-plan.md`. Each milestone gets a short spec with acceptance criteria before any code. A milestone is done only when its checks pass (`npm run check`, `npm run check:server`, and e2e where relevant) and the plan's checkpoint (predict, then run) has been done. Don't claim "done" without showing the command output.
- **The Notion Odyssey "Build Fallacy Hunter" is outdated on stack** (it says Pygame/Python). `docs/build-plan.md` is the source of truth: same phases and patterns, adapted to this web stack.
- Practices and rationale: `docs/ai-dev-practices.md`.

## What this is

Fallacy Hunter is a Jev (TypeSafe) game. In **Beat the Judge**, the player labels short arguments by fallacy against a timer while Jev, the Judge, rules on them asynchronously. In **Forge**, the player writes an argument that commits a drawn fallacy, and Jev judges whether it does and how subtly. Sessions are logged as commands so they can be re-scored under new thresholds without calling Jev again.

## Commands

Frontend (repo root):

- `npm run dev`: Vite dev server; proxies `/api` to `localhost:3000`
- `npm run check`: typecheck, ESLint, Prettier check, Vitest once. This is the main gate.
- `npx vitest run src/path/to/file.test.ts`: one test file (`-t "name"` filters by test name)
- `npm run test:e2e`: Playwright; builds and serves on port 4173. First run needs `npx playwright install chromium`.
- `npx playwright test e2e/home.spec.ts`: one e2e spec

Backend (`server/`, its own `package.json`; run `npm --prefix server install` once):

- `npm run dev:server`: Nest in watch mode on port 3000, all routes under `/api`
- `npm run check:server`: tsc, oxlint (type-aware), Prettier, Vitest unit tests, Vitest e2e
- `npm --prefix server exec vitest run src/path/file.spec.ts`: one server test

## Architecture

- **Two packages.** The React client is at the root (`src/`) and the NestJS API is in `server/`. They have separate deps, lint (ESLint vs oxlint), and test configs. Both are ESM, so server imports use `.js` suffixes.
- **Jev runs only on the server.** `@typesafe-ai/sdk` is a server dependency. `TYPESAFE_API_KEY` lives in `server/.env`, loaded by `process.loadEnvFile()` in `server/src/main.ts`. Never give it a `VITE_` prefix and never import the SDK in `src/`. The client reaches Jev only through `/api/...`.
- **Client HTTP** goes through `src/lib/api-client.ts` (Axios, base `VITE_API_URL ?? "/api"`). Server state uses TanStack Query (`src/lib/query-client.ts`), and client/game state uses Zustand stores in `src/stores/`.
- **Routing** is file-based TanStack Router in `src/routes/`. `src/routeTree.gen.ts` is generated, so don't edit it. The router context carries `queryClient`.
- **Game-architecture mapping** (from the plan): the game loop is time-based on `requestAnimationFrame`, not frame-counted. Jev verdicts come back asynchronously and pass through a client-side event queue that the loop drains, tagged by request so stale verdicts get dropped. Round flow is an explicit state machine. Fallacies are data (Type Object). Player actions and Jev answers are logged as commands for replay. Scoring is a pure function of saved Jev answers plus thresholds from config.
- The current `Counter` component and `counter-store` are template scaffolding.

## Conventions

- Double quotes (Prettier). No nested or redundant ternaries (lint).
- `@/` aliases `src/`. Add UI with `npx shadcn@latest add <name>`.
- Client unit tests are `src/**/*.test.{ts,tsx}` (jsdom + Testing Library). Server unit tests are `*.spec.ts`; e2e uses `vitest.config.e2e.ts`.
