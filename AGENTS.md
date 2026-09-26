# Harmonia Agent Instructions

## Project Overview

Harmonia is intended to be a choir coordination and liturgical music management product for web and mobile. This Git checkout currently contains no application source, package manifests, tests, API contracts, database files, or README. The project notes available in the surrounding workspace describe intended scope; they do not prove that any feature is implemented. See [docs/AI-CONTEXT.md](docs/AI-CONTEXT.md) before making claims about the codebase.

## Repository Structure

At the time this file was written, the tracked project consists only of:

- `AGENTS.md` — project-wide instructions for coding agents.
- `docs/AI-CONTEXT.md` — reconnaissance findings, evidence limits, and project context.

The surrounding workspace has additional `.ai-skills/`, `.claude/`, `CLAUDE.md`, and `docs/decisions/` material, but those paths are outside this Git repository and are not included in its commit. Read them when available. Do not assume they will exist in another checkout; the context document records their relevant content and limitations.

## Tech Stack

No runtime or framework is verifiable from this repository because it has no application files or dependency manifests. The surrounding `CLAUDE.md` and architecture notes state an intended baseline of React 19, Vite, and TypeScript for web, and Flutter, Riverpod, and GoRouter for mobile. Treat those as project guidance, not proof of the implemented stack. Runtime versions, package manager, backend, database, authentication provider, validation libraries, and build/test tools are unknown.

## Architecture Rules

- Inspect the actual source and repository structure before proposing an architecture or adding files.
- Preserve existing architecture once source code is available; this checkout does not establish application layers, folder responsibilities, routing, state management, or service patterns.
- Keep API access outside presentation code if that matches the restored application's established pattern. The available architecture notes describe this as a preference, not a verified implementation convention.
- The surrounding `CLAUDE.md` marks backend code, API contracts, database schemas, migrations, and backend configuration as read-only. Follow that boundary when the file is available; do not infer that a backend exists here.
- Treat listed feature boundaries and data flows in the context notes as conceptual guidance until source confirms them.

## Coding Rules

- Follow conventions observed in nearby source files. No source-based naming, import ordering, formatting, typing, async, logging, or error-handling convention could be established in this checkout.
- Use domain terminology from the project notes, but do not infer entity schemas, endpoint names, enums, or workflows from terminology alone.
- Prefer the smallest change that satisfies the explicit task. Reuse existing components, services, utilities, and validation patterns after locating them in source.
- Avoid unrelated refactoring and new dependencies. Check manifests and existing packages before proposing a dependency.
- Do not create stubs or mock behavior that could be mistaken for a production API or implemented business rule.

## UI Rules

The surrounding design notes describe a restrained operational interface, a burgundy accent (`#8E3B4B`), neutral surfaces, readable hierarchy, accessible focus and labels, and reusable patterns for forms, tables, status, dialogs, and feedback states. These are documented design intentions; no rendered UI, design tokens, component library, typography implementation, or responsive behavior is present to verify. When source becomes available, inspect and reuse its actual components and styles before applying these notes. Stitch output is not a source of business rules.

## API Rules

- No API source or checked-in API contract is present. Do not invent endpoints, payloads, response fields, error formats, auth requirements, or available backend capabilities.
- Verify API-dependent work against a supplied contract or implementation before integrating it.
- Use the application's established request, mapping, authentication, and error-handling patterns once found.
- The surrounding project instructions reserve backend changes. If backend work appears necessary, report the missing capability and contract dependency rather than modifying backend code.

## Business Rules

The surrounding business notes summarize Report 1 requirements, but the Report 1 source itself is an external Google document and is not included in this repository. For traceability, treat the supplied business notes as documented requirements with the evidence limitation stated in [docs/AI-CONTEXT.md](docs/AI-CONTEXT.md). Keep these labels distinct:

- **IMPLEMENTED** — verified in application source; none can currently be confirmed.
- **PARTIALLY IMPLEMENTED** — some required behavior is verified in source and some is absent; none can currently be assessed.
- **PLANNED** — stated in the available product/business notes; not proof of implementation.
- **NOT FOUND** — absent from the inspected checkout; this does not establish whether it exists elsewhere.
- **UNKNOWN** — not defined by available sources, or impossible to verify from this checkout.

Do not turn interpretations or open decisions into requirements. In particular, role assignment for Instrumentalist, fine-grained permissions, roster matching inputs, event recurrence and lifecycle, song approval statuses/transitions, and detailed attendance semantics remain open in the available notes.

## Testing Rules

No test framework, test files, or test command is present. Do not claim tests passed or invent a command. When source is restored, inspect its test setup and follow its existing locations, naming, and commands. Add tests for behavior when the task and project setup call for them; for documentation-only changes, verify links, paths, factual support, and the diff.

## Validation Rules

No validation library, schema, or API validation convention is present. Do not invent business validation. Once application source is available, follow the existing field and server-validation patterns and treat frontend validation as a user-experience aid rather than a substitute for server enforcement.

## Error Handling

No application error-handling or logging convention can be verified. When implementing, inspect established patterns first; do not silently swallow failures or expose secrets and infrastructure details in user-facing errors.

## Environment Rules

No `.env.example`, runtime configuration, or environment-variable documentation is present in the Git checkout. Inspect configuration before adding variables. Never commit secrets, credentials, tokens, or secret-bearing environment files. The workspace `.mcp.json` configures a Playwright MCP command, but it is outside this Git repository and does not establish application dependencies.

## Development Commands

No install, dev, build, lint, type-check, or test command is discoverable because there are no package manifests or scripts. Do not run guessed commands. Determine commands from the actual manifests when supplied.

## Git Rules

- The available Git repository is `Harmonia-Web/`. At reconnaissance time it was on an unborn `main` branch, with no commits or remote-tracking branches; its configured `origin` URL names `Harmonia-Web`.
- No existing commit-message convention can be inferred from history. Use a clear, focused message and do not claim the project follows Conventional Commits unless later history establishes that.
- Keep each commit focused. Before committing, inspect status and diff and ensure only task-related files are included.
- Never rewrite history or commit secrets, generated artifacts, or unrelated changes.
- The surrounding workspace notes are outside this Git root; do not assume they are tracked by this repository.

## AI Agent Rules

Agents must:

1. Inspect the relevant source and existing implementation before designing a change.
2. Reuse existing components, services, and utilities where appropriate.
3. Avoid unnecessary refactoring and unrelated file changes.
4. Preserve existing APIs and business logic unless the task explicitly requires a change.
5. Check existing dependencies before adding packages.
6. Follow conventions demonstrated by source rather than inventing them.
7. Run relevant available validation after code changes; never claim unrun checks passed.
8. Review `git diff` and status before committing.
9. Keep commits small and focused.
10. Never commit secrets or generated artifacts.
11. Verify a feature in source before describing it as implemented.
12. Never invent endpoints, fields, statuses, permissions, or business rules.
13. Report conflicts between requirements and implementation before making broad changes.
14. Keep planned scope, verified implementation, interpretation, and unresolved decisions clearly distinguished.

## Change Safety

Before changing code, identify affected files, trace relevant dependencies, check for an existing implementation, make the smallest suitable change, run available relevant validation, inspect the diff, and summarize the outcome. If an essential source, API contract, or business decision is absent, document the specific uncertainty and its impact.
