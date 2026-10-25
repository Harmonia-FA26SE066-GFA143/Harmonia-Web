# Practice Assignments and Submissions

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 FE-08–FE-13, FE-41–FE-44, LI-03, LI-05

The Choir Director creates practice assignments for all members, selected skill groups, or individual members (FE-41). Members access sheet music, lyrics, sample audio and rehearsal materials (FE-08), mark materials Learned or Needing more practice (FE-09), and record and submit practice audio (FE-10–FE-11). Submission statuses are **Submitted, Passed, Needs Revision, Overdue** (FE-12). The Director listens to submissions, evaluates them as Passed or Needs Revision and enters feedback (FE-42–FE-44). Members view feedback and history (FE-13–FE-14); the Director tracks progress for upcoming events (FE-46).

Evaluation is manual (LI-03, LI-05); advanced AI performance analysis is excluded (EX-05).

## BE contract (verified `a6af23e`, re-checked `42e604e`)

- **Statuses**: `SubmissionStatus` = `Submitted`, `Passed`, `NeedsRevision`, `Overdue` (`SubmissionStatus.cs`). Assignment audience: `All`, `SkillGroup`, `Individual` (`AssignmentScope.cs`).
- **Endpoints**: `api/practice-assignments` (create, list, mine, submissions) and `api/practice-submissions` (list, detail, feedback, comments, mine) (`PracticeAssignmentsController.cs`, `PracticeSubmissionsController.cs`). Learning progress per material is `LearningStatus` = `NotStarted`, `NeedsPractice`, `Learned`.
- The Director's feedback and comments are the BE's review model; follow the DTOs rather than a separate "review" entity.

## Owner decisions still standing (BE silent)

- **Overdue**: a submission is overdue when its deadline has passed and the member has no Passed result; assignments therefore have a deadline.
- **Assignment** belongs to one liturgical event and one song of its approved song list; it has a title, instructions, a deadline (date and time) and an audience chosen among members who confirmed participation.
- **Resubmission**: after Needs Revision a member may submit again until the deadline; earlier submissions are kept.
- **Feedback** is required for Needs Revision and optional for Passed.
- Audio format, length and size are not decided (5a.3 fixes only sample audio as MP3).

## Open questions (the BE decides where it covers them; the rest belong in `design/tbd-backlog.md`)

Whether a submission made before the deadline but not reviewed by then is Overdue; whether the Director may change a result after the deadline; whether the audience follows later confirmation changes; deadline limits (future only, before the Mass); editing or deleting assignments; reminders to members who have not submitted.
