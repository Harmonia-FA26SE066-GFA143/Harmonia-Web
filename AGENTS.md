# Harmonia Web — Agent Baseline

## Project and current state

Harmonia is a choir coordination and liturgical music management product. This Git repository contains the web client for Parish Priest/Liturgy Committee, Choir Director, and Admin. Mobile and backend are separate repositories. This checkout currently has a web scaffold and route placeholders; no business feature is implemented.

`docs/AI-CONTEXT.md` is historical reconnaissance. Confirm current facts in source and manifests before relying on it. On the owner's local workstation, read root `CLAUDE.md` first; it routes local rules and authorizes on-demand knowledge. That file and `docs/local/` are intentionally not included in GitHub.

## Verified web stack

Verified in `package.json`: React 19, TypeScript 6, Vite 8, Ant Design 6, React Router 8, TanStack Query 5, Vitest 5, Testing Library, and oxlint. Web forms use Ant Design `Form`; React Hook Form and Zod are not installed. See local-only `docs/local/decisions/0001-ui-library.md` for the owner's decision when it is available and authorized.

## Code organization

```text
src/
  app/           # app wiring, theme, router, app-level pages
  config/        # typed Vite environment access
  features/      # business capabilities; create only needed subfolders
  layouts/       # application shells
  lib/           # infrastructure, including API client
  shared/        # code reused by multiple features
  styles/        # tokens and global styles
  test/          # Vitest setup
tests/e2e/       # reserved for a configured E2E runner
```

Use existing patterns. New features may use `api/`, `components/`, `hooks/`, `pages/`, `types/`, and `index.ts` as needed. Feature imports cross boundaries through `index.ts`; shared code belongs in `src/shared/` only when reuse is established. Tests sit beside source files as `*.test.ts(x)`.

API calls belong in feature API modules and use `src/lib/api/client.ts`; presentation components must not call `fetch` directly. Use the `@/` alias. Use Ant Design and the existing theme/tokens; do not add a second UI system without an approved decision.

## Backend boundary

Backend code, API contracts, database schemas, migrations, and backend configuration are read-only. Never modify them. Do not invent endpoints, payloads, fields, statuses, permissions, or business rules. If a required API is missing, record `TBD: Backend API missing` and report the needed capability. Do not create fake permanent API behavior.

Stitch output is a design reference, not a source of business truth. Do not claim an item is implemented unless source verifies it.

## Local-only project guidance

`.claude/`, `CLAUDE.md`, `.mcp.json`, and `docs/local/` are local-only. Do not stage or commit them. Do not automatically scan `docs/local/`; use only documents the owner names or explicitly authorizes. `.mcp.json` and secrets must never be committed.

## Development and Git

Available commands: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Do not claim a check passed unless it ran. Run tests only when requested.

Never commit directly to `main`. The owner's local Git workflow defines branch/commit naming and permissions. Create a branch only when implementation and its issue number are explicitly supplied; commit only when explicitly requested. Never push or create a PR without explicit permission.
