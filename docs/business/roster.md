# Service Roster

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 §2, FE-35–FE-40

The Choir Director defines personnel requirements for each song, including numbers of singers per vocal part and required instrumentalists (FE-35). Report 1 describes skill-based roster recommendations (§2); the Director requests suggestions (FE-36), views shortage warnings for missing vocal skills, instruments or roles (FE-37), manually adjusts the suggested roster (FE-38), finalizes the service roster after song-list approval (FE-39), and sends assignment notifications to selected members (FE-40).

## INTERPRETATION — Report 1 FE-36–FE-40

A suggestion is a planning result and not a finalized roster.

## BE contract (verified `a6af23e`, re-checked `42e604e`, `RosterService.cs`, `ServiceRostersController.cs`)

- **Roster statuses**: `Draft`, `Suggested`, `Finalized` (`RosterStatus.cs`). Assignments are `Active` or `Replaced` and come from `Suggested` or `Manual` sources.
- **Endpoints**: suggestions, shortages, assignments (add, replace, remove), finalization, assignment notifications; personnel requirements per song list item are under `api/song-list-items/{id}/personnel-requirements`.
- **Finalization** needs an **approved song list** for the event (`ROSTER_SONG_LIST_NOT_APPROVED`) and every assignment still valid: the member is Active, holds the approved skill, and confirmed participation. It does **not** require zero shortages and asks for no reason; the shortages are returned with the finalized roster. A finalized roster is no longer editable (`RosterService.cs:134-167`).
- The suggestion is produced by the BE (an AI generator); the Web only shows and applies it.
- Eligibility: only members who answered Confirm for the event and hold an approved matching skill can be assigned.

## Owner decisions still standing (BE silent)

- Requirements are set per song and, in addition, as positions for the whole program (for example conducting, main organ); each is a skill from the catalog and a number of people.

## Not in the BE (do not build)

The "Finalize Program" action with a required reason when positions are short, locking everything afterwards (Q-10.20–Q-10.21 of `confirmed-decisions-2026-10-01.md`) is not implemented; the BE's roster finalization above is the contract.

## Open questions (the BE decides where it covers them; the rest belong in `design/tbd-backlog.md`)

Limits on how many positions one member can hold; what happens to an assignment when the member changes the answer or loses the skill before finalization; roster changes while the event is cancelled or past; timing of assignment notifications.
