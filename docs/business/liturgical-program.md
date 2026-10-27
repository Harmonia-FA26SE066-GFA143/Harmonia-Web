# Liturgical Programs and Events

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`, 2026-10-26 at `main@c091c07` and 2026-10-27 at `main@d1ca63e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 §2, FE-05, FE-15–FE-16, FE-30

The Parish Priest creates or reviews liturgical programs (FE-15) and defines the information of liturgical events (FE-16): event name, date, liturgical season, Mass type, ceremony type, special requirements. Masses, ceremonies, feast days, parish events and performances appear as contexts (§2, FE-05, FE-30).

## BE contract (verified `a6af23e`, re-checked `d1ca63e`)

- **No weekly program object.** Each liturgical event is its own record. A program on the Web is an event.
- **Event status**: `Draft` → `Published` → `Cancelled` (`EventStatus.cs`). Create, edit and generate produce or change Drafts without notifying anyone; **publish** notifies the active Choir Directors and Choir Members of the choirs serving the event, or everyone when no choir is set; cancelling a published event notifies the same people; a Draft cancel sends nothing (`LiturgicalEventService.cs:123-239`, `UserRepository.cs:158-170`).
- **Fields**: date, time, place (required); Mass type or ceremony type (one required); liturgical season (required to publish); event category, title (≤ 200), special requirements (≤ 1000) optional (`CreateLiturgicalEventRequestValidator.cs`). Left empty on create, the season is filled with the active season **containing the date** (`d1ca63e`, `LiturgicalEventService.cs:47`); an evening vigil on 24/12 therefore gets Advent, and the Priest picks Christmas by hand (BE choice, `doc/api-changelog.md` 2026-10-26).
- **Whole-service roles** of an event (organ, conductor…) are read by the Parish Priest and the Choir Director and set by the lead choir's director (`LiturgicalEventsController.cs:107-120`); see `roster.md`.
- **Rules**: date + time + place is unique among non-cancelled events; the date lies inside the chosen season, or on the day before it starts for an evening vigil Mass (`c93eac6`, `LookupService.cs:216-217`); catalog entries are active; a cancelled event is not editable; a past event cannot be published or cancelled (`LiturgicalEventRepository.cs:18-23`, `LookupService.cs:199-218`, `LiturgicalEventService.cs:88-91, 174-177, 201-222`).
- **Generation**: Draft events for a date range (today or later, at most 62 days) from the Admin's fixed weekly Mass times; occupied slots are skipped (`MassScheduleService.cs:80-125`).
- **Liturgical days**: the Priest syncs a civil year from an online Liturgical Calendar API, which overwrites the cached days (`LiturgicalDayService.cs:38-70`). EX-08 (third-party calendar integration out of core scope) is superseded by this implemented endpoint.
- **Visibility**: the Choir Director lists only published and cancelled events; drafts are the Priest's (`LiturgicalEventsController.cs:21-28`). Since D8 a Choir Director sees only events served by one of their choirs, or with no choir (`ChoirScopeService.cs:59-68`).
- **Serving choirs** (D8, `718696c`): the Parish Priest replaces the choirs of an event and names the lead (`PUT …/{id}/choirs`, `{ choirIds, leadChoirId }`), choosing among every choir of the parish (`GET /api/choirs`, open to the Priest since `c091c07`). The event must not be cancelled or past; an inactive choir may stay but cannot be added; the lead must be one of the choirs and is empty when there are none (`CHOIR_LEAD_INVALID` inside `VALIDATION_FAILED`) (`ChoirService.cs:198-250`, `UpdateEventChoirsRequestValidator.cs`). The lead choir's director prepares the event (see `roles-permissions.md`).
- **Liturgical day names** arrive in Vietnamese too (`celebrationNameVi`, `rankVi`, `seasonNameVi`, `LiturgicalDayDto.cs:17-21`), from a translation table the Admin edits (`api/liturgical-name-translations`).

## Owner decisions still standing (BE silent)

- Only the Priest edits, publishes and cancels events (also the BE rule).
- The Choir Director also uses the liturgical calendar (4.7).
- Preparation status of a published event is shown to the Priest as progress of song list, participation, roster, rehearsals and practice (`GET …/preparation-status`).

## Not in the BE (do not build)

Recurring events as one series, per-field unlock after approval, replacement events, "Confirmed" status, the 7-step preparation sequence, Readiness (Not Ready / Pending / Ready) and a Choir Director "Confirm Event Ready" action have no endpoint or enum. List them in `docs/tbd-backlog.md` if still wanted.
