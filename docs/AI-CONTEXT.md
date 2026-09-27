# Harmonia Codebase Context

Reconnaissance date: 2026-09-26

> **Update (2026-09-26):** after this reconnaissance, a web scaffold was added (Vite + React 19 + TypeScript + Ant Design 6, React Router, TanStack Query, Vitest). Sections below describing an empty checkout are historical. For the current stack, structure, and commands see `AGENTS.md`. No business feature is implemented yet.

## Evidence Boundary

The Git root inspected for this document is `Harmonia-Web/`. Before this documentation change, it contained only Git metadata: no commits, application source, package manifests, tests, API contracts, database schemas, or README. The branch is an unborn `main`; `origin/main` is absent. No feature implementation was found, so features below are **NOT FOUND in this checkout**; whether they exist elsewhere is **UNKNOWN**. Requirements stated in the surrounding notes are labeled **PLANNED**, not implemented.

The surrounding workspace `F:\user\Harmonia` contains project planning and AI guidance outside the Git root: `CLAUDE.md`, `.ai-skills/`, `.claude/`, and `docs/decisions/open-business-decisions.md`. These files informed this summary but are not part of this repository or the documentation commit. A future checkout of this Git repository will not contain them unless they are separately added. Their own authority notes cite an external Google Docs Report 1, which is not present locally and was not independently inspected. Treat their Report 1 citations as claims recorded in the supplied notes, not as direct verification of that external document.

## What Harmonia Is

The supplied project notes describe Harmonia as a web and mobile choir coordination and liturgical music management system for parish/church organizations. The described scope includes profiles and skills, liturgical programs and events, songs and music materials, song-list review, participation responses, rehearsals, service-roster planning, practice assignments and submissions, attendance, reports, notifications, and administrative configuration.

The notes state that the product is intended for small-to-medium choir organizations, requires Internet access to use and synchronize centralized information, and excludes full offline operation of core management functions. They also list financial management, general parish management beyond choir needs, live broadcasting, automatic composition/arrangement, advanced AI performance analysis, music sales, direct hardware integration, and third-party platform integrations as out of core scope. These are **PLANNED/documented scope statements**, not verified product behavior.

## Repository and Available Materials

### Git repository (`Harmonia-Web/`)

- Before this documentation change, the working tree was empty; no code, documentation, scripts, assets, or tests were present.
- No README, package files, lockfiles, runtime version files, CI configuration, deployment files, or environment templates were found.
- Git has no commits or commit-message history. The configured remote URL is `https://github.com/Harmonia-FA26SE066-GFA143/Harmonia-Web.git`; the remote-tracking branch is missing. No remote branches or commit content could be inspected.

### Surrounding workspace (outside the Git root)

- `CLAUDE.md`: project identity, source hierarchy, intended web/mobile technology baselines, backend read-only constraint, UI/implementation guidance, verification, security, and Git guidance.
- `.ai-skills/architecture/`: architecture overview, frontend boundaries, and API integration principles. The files explicitly describe many diagrams and capability lists as conceptual and say actual source/API evidence is absent.
- `.ai-skills/business/`: role, skills, event, song approval, roster, practice, rehearsal/attendance, and domain summaries. These cite Report 1 feature IDs but the source report itself is unavailable locally.
- `.ai-skills/design/`: visual direction, UI rules, screen architecture, and conceptual role surfaces. These do not prove screens or components exist.
- `.claude/agents/` and `.claude/skills/`: business review, UI review, feature implementation, issue investigation, review, and Stitch workflows.
- `docs/decisions/open-business-decisions.md`: an audit register of unresolved Report 1 questions and prior unsupported claims.
- `.mcp.json`: Playwright MCP configuration. It is not an app dependency manifest.

No root `AGENTS.md` existed. The only `CLAUDE.md` is outside the Git root. `.claude/` contains agent and skill files but no additional instruction file at its root; `commands/` and `hooks/` were empty in the inspected workspace.

## Technology and Tooling

### Stated project baseline — not verified implementation

- Web: React 19, Vite, TypeScript.
- Mobile: Flutter, Riverpod, GoRouter.

These technologies are named by the surrounding `CLAUDE.md` as baselines. No `package.json`, lockfile, `pubspec.yaml`, source, or runtime-version file exists in the Git checkout, so versions actually in use, package managers, build tools, UI libraries, state/data fetching packages, and commands are unknown.

### Unknown from the available checkout

- Backend language/framework, API routes and contracts, authentication provider, authorization enforcement, database, ORM, migrations, and validation.
- Frontend/mobile folder layout, routing implementation, component library, styling method, state management implementation, logging, and error-handling conventions.
- Test/lint/format frameworks, test locations, CI, deployment, and required environment variables.

The architecture notes call the backend a conceptual capability list and explicitly caution that it is not evidence that endpoints exist. The surrounding `CLAUDE.md` says backend source, contracts, schema, migrations, and backend configuration are read-only for the project work described there.

## Architecture Guidance in the Supplied Notes

The project notes describe separate Web, Mobile, Backend API, and centralized storage areas, with conceptual feature boundaries such as Liturgical Programs, Song Approval, Members, Skills, Rehearsals, Participation, Roster, Practice, Attendance, Music Library, and Reports. The stated conceptual web flow is UI → feature state/hook/controller → API service → backend; the mobile baseline names Riverpod and GoRouter. These are **PLANNED guidance**, not discovered code architecture.

When code is available, determine actual feature folders, shared modules, routing, state flow, request abstractions, and models from source before adding to them. Do not create an architecture from these conceptual diagrams alone.

## Domain Workflows and Status

No implementation was found for any item because the Git checkout contains no application code. Each is **NOT FOUND in this checkout** and **PLANNED in the supplied notes**; whether implementation exists elsewhere is **UNKNOWN**. The following summarizes those documented requirements:

| Capability | Planned/documented behavior | Status in inspected checkout |
| --- | --- | --- |
| Actors and roles | Priest/Liturgy Committee, Choir Director, Choir Member, Admin are listed as assignable roles; “Choir Member / Instrumentalist” is an actor heading. | NOT FOUND; planned in notes |
| Skills | Members declare named vocal/instrument/music skills; Director reviews/approves declarations; Admin configures skill categories. | NOT FOUND; planned in notes |
| Liturgical programs | Priest creates or reviews weekly programs and defines event information within a week. Listed fields: name, date, season, Mass type, ceremony type, special requirements. | NOT FOUND; planned in notes |
| Song lists | Director proposes/submits lists; Priest may approve, reject, or request revision and provide notes; Director revises; final approved list is available. | NOT FOUND; planned in notes |
| Music library | Director manages songs/materials and classifies by season, Mass type, ceremony type, theme, vocal requirements, and instrument requirements. | NOT FOUND; planned in notes |
| Participation | Members view upcoming events and respond Confirm attendance, Decline attendance, or Unsure; Director sends requests and views response status. | NOT FOUND; planned in notes |
| Rehearsals and attendance | Director schedules rehearsals for events and takes attendance during rehearsals or service-preparation sessions. | NOT FOUND; planned in notes |
| Roster | Director sets personnel requirements, requests suggestions, sees shortage warnings, adjusts the suggestion, finalizes after song approval, and notifies selected members. | NOT FOUND; planned in notes |
| Practice | Director assigns practice to all members, selected skill groups, or individuals; members submit audio; Director manually evaluates as Passed or Needs Revision and provides feedback. Listed submission statuses also include Submitted and Overdue. | NOT FOUND; planned in notes |
| Reports/admin | Priest and Admin have described reports; Admin manages accounts/roles/configuration, exports reports, and views activity history. | NOT FOUND; planned in notes |

The notes say skill approval, song-list approval, roster finalization, and practice evaluation depend on authorized users and are not fully automated. Do not implement or describe these as automatic workflows based on the notes.

## Open Business Decisions and Conflicts

The surrounding decision register marks these questions unresolved. Do not settle them by assumption:

- Whether Instrumentalist is a distinct assignable role or a Choir Member subtype; whether Director member management includes instrumentalists; multiple roles per account; identity/delegation details; and fine-grained permissions.
- Event recurrence/generation, weekly templates, field validation, Draft/Published states, season calculation, and configuration lifecycle.
- Song approval status names and persisted values, transition graph, partial approval, approver count, revision limits, and edits after approval.
- Roster matching algorithm and inputs, eligibility, fairness, conflicts, assignment limits, refresh behavior, and changes after finalization.
- Terminology and values for prospective participation versus actual attendance, excused/late absences, attendance scope, rehearsal recurrence/cancellation, and “real time” latency.
- Practice audio limits/formats, due dates, resubmission, overdue calculation, and feedback edits.
- Notification channels/timing and report metrics, filters, freshness, and export formats.
- Skill rejection/resubmission, proficiency, evidence, expiration, and category lifecycle.

Two source-note conflicts require attention:

1. `.ai-skills/development/development-rules.md` tells implementers to preserve numeric performance targets and cross-platform status consistency “documented in `.ai-skills/business/domain.md`.” The current domain note explicitly says those targets are unsupported by Report 1 and were removed from Report 1-based business rules. Do not treat those numbers or consistency claim as requirements without an authoritative source.
2. `.ai-skills/design/role-surfaces.md` lists Director management of “members and instrumentalists,” while `.ai-skills/business/actors.md` and `roles-permissions.md` say the business requirement only explicitly names choir members and leaves instrumentalist management unresolved. The role-surface file also labels its screens conceptual. Do not infer that permission.

The workspace `CLAUDE.md` gives project code `GFA26SE143`, while the configured Git remote slug contains `FA26SE066-GFA143`. This identity discrepancy is not resolved by available evidence.

## UI/UX Notes

The supplied design notes describe a restrained operational style, neutral backgrounds/surfaces, dark readable text, and liturgical burgundy `#8E3B4B` for primary/active states. They recommend clear hierarchy, structured tables where useful, accessible labels/focus, responsive reorganization, and explicit loading/empty/error/validation/permission feedback where applicable. They also advise reusing recurring buttons, inputs, tables, tabs, status badges, dialogs, drawers, pagination, and notifications.

No UI source, screenshots, design token file, typography choice, reusable component, form/table/modal implementation, or responsive behavior could be inspected. Apply these notes only after reconciling them with actual code and approved design decisions. The role surfaces and page structures are conceptual candidates, not confirmed routes.

## API, Authentication, and Data

No API endpoint, request/response model, database entity, schema, auth mechanism, token handling, authorization rule implementation, or error response was found. The architecture notes explicitly say capability summaries do not establish endpoint availability. Obtain or inspect the API contract before implementing integrations. The business notes support only a broad assigned-role relationship; enforcement layers and detailed permissions remain unresolved.

## Development, Validation, and Git

- There are no verified development, build, lint, type-check, or test commands in this checkout.
- No test framework or testing convention can be reported.
- The Git repository had no commits, so no branch workflow or commit-message convention can be inferred.
- The workspace-level `.mcp.json` configures Playwright through `npx @playwright/mcp@latest`; this does not verify a project package or browser-test suite.
- Inspect real manifests and scripts before running commands. For documentation changes, validate factual claims against available source material, confirm all referenced paths exist or are explicitly labeled external, inspect the rendered/plain text, and run `git diff --check`.

## Agent Change Checklist

Before a future code change:

1. Confirm that application source and the relevant requirements/API/design materials are available.
2. Identify the user, role, workflow, and affected feature from authoritative sources.
3. Search for the existing implementation and closest reusable patterns.
4. Verify endpoints, fields, permissions, and states instead of inferring them from conceptual notes.
5. Keep the change focused; respect the stated backend read-only boundary unless project instructions are explicitly changed.
6. Run only validation commands present in the restored project and report exactly what ran.
7. Review status and diff, and distinguish verified behavior from planned scope and unresolved decisions in the final report.
