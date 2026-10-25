# Song-List Approval and Music Library

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 FE-17–FE-20, FE-30–FE-32, LI-03

- The Choir Director proposes a song list for a Mass, ceremony, or special event and submits it to the Parish Priest (FE-30–FE-31).
- The Priest reviews the list and may approve, reject, or request revision, with notes (FE-17–FE-19).
- The Choir Director revises the list based on feedback (FE-32); the final approved list is available for the event (FE-20).
- Approval depends on authorized users and is not fully automated (LI-03).

## BE contract (verified `a6af23e`, re-checked `42e604e`, `SongListService.cs`)

- **Statuses**: `Draft`, `Submitted`, `Approved`, `Rejected`, `NeedsRevision` (`SongListStatus.cs`). There is no Suspended, Superseded or Finalized state for a song list.
- **Versions**: each event has numbered versions. A new version is created only when there is none or the newest was Rejected or NeedsRevision; the new version starts as Draft, links to the previous one, and carries its own items (`:68-133`). A Draft is edited in place by replacing its items (`:135-179`). An event with an Approved version accepts no new version (`SONG_LIST_EVENT_HAS_APPROVED_VERSION`).
- **Preconditions**: the event is published and not cancelled; songs and liturgical slots exist and are active; at least one song; the same song only once per slot, a slot may hold several songs (`:77-107`, `CreateSongListRequestValidator`).
- **Submit**: newest version, Draft, not empty; notifies every active Parish Priest (`:181-231`).
- **Review**: one decision for the whole list: Approve, Reject or RequestRevision, by any Parish Priest. Notes are required for Reject and RequestRevision, optional for Approve. Only a Submitted list can be decided; the proposing Director is notified (`:233-288`, `ReviewSongListRequestValidator.cs`).
- **Per song** the Choir Director may add a note; the Priest does not decide per song.
- The approved list is read by every role for a published event (`GET /api/song-lists/event/{eventId}/approved`).

## Owner decisions still standing (BE silent)

- Each song is classified from catalogs: liturgical season, Mass type, ceremony type, theme (BE `ClassificationTarget`), plus vocal and instrument requirements from the skill catalog (5a.1). Song title is required; an author/composer field exists (5a.4).
- Materials: sample audio as MP3, sheet music as PDF (5a.3); size limits for other material types are not decided.
- Deleting a song is a soft delete: the BE sets it inactive (`SongService.cs:60-66`) and does not check whether it served a Mass, so decision 5a.5 ("only if never used") is not enforced by the BE; inactive songs cannot be chosen for new lists (`SONG_INACTIVE`). Owner decision 2026-10-25: keep 5a.5 and ask the BE to refuse deleting a used song (tbd-backlog B35); no archive or restore.
- No revision-round limit (5b.7).

## Not in the BE (do not build)

Per-song accept/reject decisions, a rejection-reason catalog, Suspended / Superseded / Finalized list states, restoring an older approved version, and emergency handling from `confirmed-decisions-2026-10-01.md` have no endpoint or enum. List them in `docs/tbd-backlog.md` if still wanted.
