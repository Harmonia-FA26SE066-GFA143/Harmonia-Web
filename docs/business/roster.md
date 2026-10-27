# Service Roster

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`, 2026-10-26 at `main@43dfe31` and 2026-10-27 at `main@d1ca63e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 §2, FE-35–FE-40

The Choir Director defines personnel requirements for each song, including numbers of singers per vocal part and required instrumentalists (FE-35). Report 1 describes skill-based roster recommendations (§2); the Director requests suggestions (FE-36), views shortage warnings for missing vocal skills, instruments or roles (FE-37), manually adjusts the suggested roster (FE-38), finalizes the service roster after song-list approval (FE-39), and sends assignment notifications to selected members (FE-40).

## INTERPRETATION — Report 1 FE-36–FE-40

A suggestion is a planning result and not a finalized roster.

## BE contract (verified `a6af23e`, re-checked `d1ca63e`, `RosterService.cs`, `ServiceRostersController.cs`)

- **Roster statuses**: `Draft`, `Suggested`, `Finalized` (`RosterStatus.cs`). Assignments are `Active` or `Replaced` and come from `Suggested` or `Manual` sources.
- **Three tiers** (`d1ca63e`, `doc/api-changelog.md` 2026-10-26): choral singing (S/A/T/B) is not assigned, members only confirm participation; **whole-service** roles (organ, guitar, conductor) are set on the event (`GET/PUT api/liturgical-events/{id}/personnel-requirements`, `LiturgicalEventsController.cs:107-120`) and staffed once, with `songListItemId = null`; **song** roles (psalmist, Alleluia cantor, soloist, Passion roles) are set per song list item (`api/song-list-items/{id}/personnel-requirements`). The whole-service requirements accept any active skill, vocal parts included (`EventPersonnelRequirementService.cs:51-52`).
- **A song needs only what the whole service lacks**: a song asking Guitar ×2 where the service has Guitar ×1 is short of one; a song asking no more than the service is covered. Counted on the whole-service **requirement**, so a vacant whole-service role is reported once, on its own line (`RosterService.cs:277-300`). Shortages are computed, never stored (the `RosterShortage` entity was dropped); a whole-service shortage has no song (`songListItemId` and `songTitle` null).
- **One tier per member and skill**: a member holding a skill for the whole service cannot also hold it on a song, and the reverse, in suggestions, in manual adds and in replacements (`ROSTER_ASSIGNMENT_DUPLICATE`, `RosterService.cs:437-443`). An event staffed per song before `d1ca63e` keeps those lines; to move the organist to the whole service, the per-song lines are removed first.
- **Endpoints**: suggestions, shortages, assignments (add, replace, remove, role note), whole-service finalization, finalization, assignment notifications. Suggestions and shortages work **before the song list is approved** when the event has whole-service roles; with neither, both answer `409 ROSTER_SONG_LIST_NOT_APPROVED` (`RosterService.cs:42-45, 118-121`, `ErrorStatusMap.cs:131`).
- **Role note** on a line (`PUT …/assignments/{id}/note`, ≤ 200, blank clears it), also accepted when adding or replacing; a replacement without a note keeps the old one (`RosterService.cs:348, 372`). Notifications describe a line as "Organ (cả buổi lễ)" or "Solo - <song>", followed by the note (`DescribeLine`).
- **Whole-service finalization** (`POST …/{id}/whole-service-finalization`, `RosterService.cs:169-195`): locks the whole-service lines before the song list is ready; they can still be **replaced**, but not added, removed or noted (`:428-430`), and their requirements can no longer change (`EventPersonnelRequirementService.cs:39-40`). Notifications can then be sent, for those lines only (`:216-230`).
- **Removing a requirement** that has someone assigned is refused, per song and for the whole service (`409 PERSONNEL_REQUIREMENT_IN_USE`, `SongPersonnelRequirementService.cs:57`, `EventPersonnelRequirementService.cs:61`).
- **Song requirements are pre-filled** when a song list is created or edited: the same song in the same slot keeps what the director left; a new song takes its mandatory library requirements outside the vocal parts plus the slot's defaults (e.g. psalmist for the psalm), the larger count winning; a skill the whole service already staffs is added only when the song needs more (`SongListService.cs:323-360`).
- **Finalization** needs an **approved song list** for the event (`ROSTER_SONG_LIST_NOT_APPROVED`) and every assignment still valid: the member is Active, holds the approved skill, and confirmed participation. It does **not** require zero shortages and asks for no reason; the shortages are returned with the finalized roster. A finalized roster is no longer editable (`RosterService.cs:142-167`).
- The suggestion is produced by the BE (an AI generator); the Web only shows and applies it.
- Eligibility: only members who answered Confirm for the event and hold an approved matching skill can be assigned. Since D8 they must also belong to a choir serving the event, when it has choirs (`:338-346`).
- **Lead choir** (D8): suggestions, assignments, finalization and notifications are the lead choir's director's (`CHOIR_NOT_LEAD`, `:36, 144, 183, 246, 282, 305`); personnel requirements too (`SongPersonnelRequirementService.cs:34`).

## Owner decisions still standing (BE silent)

None left: the owner's "positions for the whole program (for example conducting, main organ)" is now the BE's whole-service tier (`d1ca63e`).

## Not in the BE (do not build)

The "Finalize Program" action with a required reason when positions are short, locking everything afterwards (Q-10.20–Q-10.21 of `confirmed-decisions-2026-10-01.md`) is not implemented; the BE's roster finalization above is the contract.

## Open questions (the BE decides where it covers them; the rest belong in `tbd-backlog.md`)

Limits on how many positions one member can hold; what happens to an assignment when the member changes the answer or loses the skill before finalization; roster changes while the event is cancelled or past; timing of assignment notifications.

Decided 2026-10-27 (`open-business-decisions.md`): vocal-part counts and warnings (Report 1 FE-35 / FE-37) are set as whole-service requirements; a member assigned to two events at overlapping times should be refused by the BE (tbd-backlog B40, no such check today, `RosterService.cs:437-457`).
