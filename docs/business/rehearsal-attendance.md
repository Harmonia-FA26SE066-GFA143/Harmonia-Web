# Rehearsals, Confirmation, and Attendance

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e` and 2026-10-26 at `main@43dfe31`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 FE-05–FE-06, FE-21, FE-26, FE-33–FE-34, FE-45–FE-46, FE-52–FE-53

Members view upcoming Masses, ceremonies, performances, and rehearsal schedules (FE-05) and respond with Confirm attendance, Decline attendance, or Unsure (FE-06). The Choir Director creates rehearsal schedules for each event (FE-26), sends confirmation requests (FE-33), views status in real time (FE-34), takes attendance at rehearsals or service-preparation sessions (FE-45), and tracks practice progress and attendance (FE-46). The Priest views preparation status (FE-21). Admin reports include attendance and participation confirmation (FE-52–FE-53).

## BE contract (verified `a6af23e`, re-checked `43dfe31`)

- **Participation** (`EventParticipationService.cs`): requests go to chosen active members (or to every active member not yet asked, when no ids are sent) for a **published**, not cancelled event that has not started; status `Invited` → `Confirmed` / `Declined` / `Unsure` (`ParticipationStatus.cs`). Each member is asked **once** per event (`EVENT_PARTICIPATION_ALREADY_REQUESTED`); there is no resend or reminder. A member answers **once** (`EVENT_PARTICIPATION_ALREADY_RESPONDED`), with an optional note, only while active and before the event starts (`EVENT_PARTICIPATION_CLOSED`). Since D8 only the lead choir's director sends requests (`CHOIR_NOT_LEAD`, `:34`) and only members of the serving choirs can be invited (`:208-218`).
- **Rehearsal** (`RehearsalService.cs`): has a start and end time (end after start); the event, the place (catalog) and the songs are **optional**; an event, when given, must not be cancelled. No status field. A rehearsal that has ended cannot be edited (`REHEARSAL_ALREADY_PASSED`); one with recorded attendance cannot be deleted (`REHEARSAL_HAS_ATTENDANCE`); a rehearsal at the same place with an overlapping time is refused (`REHEARSAL_TIME_CONFLICT`). Editing, and deleting a rehearsal that has not ended, notify the rehearsal's choir (`NotificationType.RehearsalChanged`, `RehearsalService.cs:221-235`); creating one notifies nobody.
- **Rehearsal choir** (D8, `718696c`): a new rehearsal needs `choirId`, a choir the director leads (`CHOIR_NOT_FOUND`), active (`CHOIR_INACTIVE`) and, when an event is given, serving it (`CHOIR_NOT_SERVING_EVENT`) (`ChoirScopeService.cs:34-57`). A Choir Director lists and edits only rehearsals of their choirs; attendance is recorded only for members of the rehearsal's choir (`RehearsalAttendanceService.cs:52-57`).
- **Attendance** (`RehearsalAttendanceService.cs`): values `Present`, `Absent`, `Late`, `Excused` (`AttendanceStatus.cs`); recorded once per member per rehearsal, for active members only, and only from a configurable number of minutes before the rehearsal starts (system setting; `REHEARSAL_NOT_STARTED` before that).
- Per-member reports count attendance, participation confirmation and assignment completion (`ReportType.RehearsalAttendance`, `Participation`, `AssignmentCompletion`); the Admin and the Choir Director read and export them, optionally for one choir (`choirId`) (`446f429`, `ReportsController.cs:44-70`).

## Owner decisions still standing (BE silent)

- A service-preparation session is created as a rehearsal; no recurrence.
- Confirmation round: the Director chooses recipients (all active members by default). A later send reaches only members not asked yet; resending to non-responders is not possible in the BE.
- No reminders for rehearsals and no attendance at the Mass itself.
- Report metrics (3.1): attendance rate = sessions present ÷ practice sessions of one event; confirmation rate = members who confirmed ÷ members sent the request.

## Open questions (the BE decides where it covers them; the rest belong in `design/tbd-backlog.md`)

Whether rehearsal songs must come from an approved list (the BE accepts any active song; the Web only offers to fill them from the approved list); reminders to members who have not answered; whether instrumentalists are invited through the same member list; what happens to attendance when a rehearsal is edited.
