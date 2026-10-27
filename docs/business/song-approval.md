# Song-List Approval and Music Library

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`, 2026-10-26 at `main@43dfe31` and 2026-10-27 at `main@d1ca63e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 FE-17–FE-20, FE-30–FE-32, LI-03

- The Choir Director proposes a song list for a Mass, ceremony, or special event and submits it to the Parish Priest (FE-30–FE-31).
- The Priest reviews the list and may approve, reject, or request revision, with notes (FE-17–FE-19).
- The Choir Director revises the list based on feedback (FE-32); the final approved list is available for the event (FE-20).
- Approval depends on authorized users and is not fully automated (LI-03).

## BE contract (verified `a6af23e`, re-checked `d1ca63e`, `SongListService.cs`)

- **Statuses**: `Draft`, `Submitted`, `Approved`, `Rejected`, `NeedsRevision` (`SongListStatus.cs`). There is no Suspended, Superseded or Finalized state for a song list.
- **Versions**: each event has numbered versions. A new version is created only when there is none or the newest was Rejected or NeedsRevision; the new version starts as Draft, links to the previous one, and carries its own items (`:68-133`). A Draft is edited in place by replacing its items (`:135-179`). An event with an Approved version accepts no new version (`SONG_LIST_EVENT_HAS_APPROVED_VERSION`).
- **Preconditions**: the event is published and not cancelled; songs and liturgical slots exist and are active; at least one song; the same song only once per slot, a slot may hold several songs (`:77-107`, `CreateSongListRequestValidator`).
- **Submit**: newest version, Draft, not empty; notifies every active Parish Priest (`:181-231`).
- **Review**: one decision for the whole list: Approve, Reject or RequestRevision, by any Parish Priest. Notes are required for Reject and RequestRevision, optional for Approve. Only a Submitted list can be decided; the proposing Director is notified (`:233-288`, `ReviewSongListRequestValidator.cs`).
- **Per song** the Choir Director may add a note; the Priest does not decide per song.
- **Lead choir** (D8): only the lead choir's director creates, edits and submits a list (`CHOIR_NOT_LEAD`, `:84, 158, 209`); a new list records the lead choir (`:126`).
- **Deleting a song** sets it inactive, and is refused with `409 SONG_IN_USE` when the song is in a song list, a rehearsal or a practice assignment (`SongService.cs:60-68`, `718696c`). This enforces owner decision 5a.5; there is no archive or restore.
- The approved list is read by every role for a published event (`GET /api/song-lists/event/{eventId}/approved`).
- **Classification** (`d1ca63e`): besides season, Mass type, ceremony type and theme, a song is classified by **liturgical slot** (Nhập lễ, Đáp ca…, `ClassificationTarget.LiturgicalSlot`). **Themes form a tree** of any depth (`SongTheme.ParentId`): no cycle, no active theme under a switched-off one (`SONG_THEME_PARENT_INVALID`), no switching off a theme with active sub-themes (`SONG_THEME_HAS_ACTIVE_CHILDREN`) (`LookupService.cs:170-198`); filtering songs by a theme also finds its sub-themes' songs. Each vocal and instrument requirement of a song has a **count** (`requiredCount`, 1–50, default 1).
- **Song suggestions** for an event (`GET api/liturgical-events/{id}/song-suggestions?slotId=`, Parish Priest and Choir Director): +3 for the slot, +2 for the Mass or ceremony type, +2 for the season; a song classified only under another season or slot is left out, and a song with no classification at all is never suggested; ties go first to songs matching on more dimensions, then to the longest unsung, **never-sung first** (`SongSuggestionService.cs:14-54`). Suggestions are only proposals; any library song can still be chosen.
- **Personnel requirements are pre-filled** on create and edit of a list (see `roster.md`), so editing a list no longer drops the requirements already set.

## Owner decisions still standing (BE silent)

- Each song is classified from catalogs (5a.1); the BE now covers the dimensions (season, Mass type, ceremony type, theme tree, liturgical slot) and the requirements with counts, see above. Song title is required; an author/composer field exists (5a.4).
- Materials: sample audio as MP3, sheet music as PDF (5a.3); size limits for other material types are not decided.
- No revision-round limit (5b.7).

## Not in the BE (do not build)

Per-song accept/reject decisions, a rejection-reason catalog, Suspended / Superseded / Finalized list states, restoring an older approved version, and emergency handling from `confirmed-decisions-2026-10-01.md` have no endpoint or enum. List them in `docs/tbd-backlog.md` if still wanted.
