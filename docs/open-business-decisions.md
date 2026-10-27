# Business Decisions Register

Cleaned 2026-10-20. The earlier "Report 1 Business Rule Audit" (a 49-row change table, the long UNRESOLVED list, self-registration and "Stitch behavior not adopted" sections) was removed: it recorded how rules changed before the BE existed and most of its questions are now answered by the BE.

## Authority

1. The BE code (controllers, DTOs, validators, enums, `ErrorCodes.cs`) decides every behavior it covers (owner decision 2026-10-07).
2. Where the BE has no endpoint or rule, the capability stays `TBD: Backend API missing` in `docs/tbd-backlog.md`, and the owner decisions below describe the intended behavior.
3. Requirements source: the official [Report 1 – Project Introduction](https://docs.google.com/document/d/1AWlef2YGpVZlhaPrV9ga_QsX3DdT8XTLVe2BKkMStpM/edit). FE, LI and EX references point to its functional requirements, limitations and exclusions.

Labels used in `docs/business/`: **EXPLICIT** (Report 1), **INTERPRETATION** (a reasonable modeling reading), **BE contract** (verified in the BE with `path:line`), **Owner decisions still standing** (BE silent).

## Where the owner's earlier decisions lost to the BE

| Earlier decision | What the BE does |
|---|---|
| Self-registration with Admin confirmation, pending and rejected accounts | No registration endpoint; the Admin creates accounts and the BE emails a first password (`roles-permissions.md`). |
| Google sign-in not adopted | `POST /api/auth/google` exists for pre-created accounts. |
| Programs per week or per day, "Draft → Confirmed → Cancelled", 7-step preparation, recurring events | Individual events, `Draft` / `Published` / `Cancelled`, no series or readiness states (`liturgical-program.md`). |
| Per-song review with aggregation, rejection-reason catalog, Suspended / Superseded / Finalized | One decision for the whole list; five list states with versions (`song-approval.md`). |
| Attendance values Present / Absent only | `Present`, `Absent`, `Late`, `Excused` (`rehearsal-attendance.md`). |
| A member may change a participation answer until a lock date | One answer per invitation (`rehearsal-attendance.md`). |
| "Finalize Program" with a required reason when short | Roster finalization needs an approved song list, no reason (`roster.md`). |

## Owner answers still in force (Daniel, 2026-09-30 and 2026-10-01)

Stored in the business files (`roles-permissions.md`, `choir-skills.md`, `liturgical-program.md`, `song-approval.md`, `rehearsal-attendance.md`, `practice-submission.md`, `roster.md`). Items kept elsewhere:

- **Reports**: export is a downloadable PDF; metric definitions for attendance rate, overdue and confirmation rate are in the business files. The BE also offers CSV, XLSX, XML and JSON (`ReportFormat.cs`).
- **Activity history**: record important actions only; keep entries for 5 years. Which actions beyond the six FE-54 kinds count as important is to be clarified.
- **Still open**: notification channels beyond what the BE sends (C5), material size limits. Choir Director reports were decided on 2026-10-25: the Web uses the BE per-member reports (Web #199, tbd-backlog B24). General Settings content is the BE's (`SystemSettingKeys`, labels and groups from the BE since `718696c`).

## Owner decisions 2026-10-26

- **Choirs (D8)**: a separate Choirs page for the Admin (`/admin/choirs`: create, edit, set the director, members); the Choir Director's page shows only their choirs, read only for the choir itself (Web #205).
- **Liturgical names**: use the BE translations and give the Admin a translation tab on the liturgical catalog page; the Web's own name list is removed (Web #207, tbd-backlog B25).
- **Trend charts**: attendance and practice by period for the Choir Director and the Admin, from `GET /api/reports/activity-trend` (Web #209).
- **Delivery**: fewer, larger Web PRs per BE update.

## Owner decisions 2026-10-27

- **Song classification and three-tier roster** (BE `d1ca63e`): the Web follows the BE, delivered in three PRs (Web #223 Admin and library, #225 song suggestions, #227 roster tiers). The BE answered the Web's questions on 2026-10-26 (extra people per song, replacing after early finalization, earlier data kept, theme tree rules, suggestion ranking).

- **Suggestion ranking** (decided 2026-10-27): keep the BE's order, never-sung songs first at equal score (`SongSuggestionService.cs:53`). The Web shows how often and when each song was sung, so the director weighs a familiar song against a fresh one.
- **Vocal parts at the whole-service level** (decided 2026-10-27): keep them. The BE pre-fills song requirements without the vocal parts but accepts any skill as a whole-service requirement; the Web offers the vocal parts there, which covers Report 1 FE-35 / FE-37 (singers per vocal part, warnings for missing vocal skills).
- **Overlapping events** (decided 2026-10-27): the BE should refuse to assign a member to two events at overlapping times; requested as tbd-backlog B40.

## Confirmed BA decisions — Daniel, 2026-10-01

The owner's "Confirmed Business Decisions" of 2026-10-01 (kept locally, not published) is the owner-supplied record of intent for the event lifecycle, music program versioning, readiness and emergency handling. It carries a BE-override note at the top; follow the BE where they differ.

## Use of this register

When implementation depends on something neither the BE nor an owner decision settles, record the dependency and ask the owner. Do not turn an interpretation into a requirement or fill gaps with general Catholic liturgical assumptions, UI conventions or guessed API behavior.
