# Harmonia Actors

Cleaned 2026-10-20. This file summarizes actor capabilities stated in Report 1. The BE decides what each role may call (`[Authorize(Roles = …)]`); see `roles-permissions.md`.

## Parish Priest / Liturgy Committee (BE role `ParishPriest`)

### EXPLICIT — Report 1 FE-15–FE-23

- Create or review liturgical programs and define event information (FE-15–FE-16).
- Review the Choir Director's proposed song lists; approve, reject, or request revision; provide notes; and view the final approved list (FE-17–FE-20).
- View choir preparation status for important events (FE-21).
- Access reports on choir service history, song usage, and event preparation (FE-22).
- Send general notes or requests to the Choir Director (FE-23).

## Choir Director (`ChoirDirector`)

### EXPLICIT — Report 1 FE-24–FE-46

- Manage choir members and review/approve their declared skills (FE-24–FE-25).
- Create rehearsal schedules for events (FE-26).
- Manage the music library; upload music and rehearsal materials; classify songs by the dimensions in FE-29 (FE-27–FE-29).
- Propose, submit, and revise song lists based on Priest feedback (FE-30–FE-32).
- Send participation-confirmation requests to members and view status in real time (FE-33–FE-34).
- Define personnel requirements per song, request roster suggestions, view shortage warnings, manually adjust suggestions, and finalize the roster after song approval (FE-35–FE-39).
- Send assignment notifications to selected members (FE-40).
- Create practice assignments, listen to audio, evaluate submissions as Passed or Needs Revision, and provide feedback (FE-41–FE-44).
- Take attendance at rehearsals or service-preparation sessions and track practice progress and attendance (FE-45–FE-46).

## Choir Member (`ChoirMember`; mobile app)

### EXPLICIT — Report 1 FE-01–FE-14

- Log in and view a personal profile, assigned role, vocal/instrument skills, and approved capabilities (FE-01–FE-02).
- Declare skills and track each declaration's approval status (FE-03–FE-04).
- View upcoming Masses, ceremonies, performances, and rehearsals; respond to an event with Confirm attendance, Decline attendance, or Unsure (FE-05–FE-06).
- View an event's approved song list and access sheet music, lyrics, sample audio, and rehearsal materials (FE-07–FE-08).
- Mark materials Learned or Needing more practice (FE-09).
- Receive practice assignments, record and submit audio, view submission status and Director feedback (FE-10–FE-13).
- View participation and practice history (FE-14).

"Instrumentalist" is a Choir Member with instrument skills, not a separate role (owner decision C3; the BE has four roles).

## Admin (`Admin`)

### EXPLICIT — Report 1 FE-47–FE-54

- Manage user accounts and assign roles (FE-47–FE-48).
- Configure skill categories (FE-49) and liturgical seasons, Mass types, ceremony types, and event categories (FE-50).
- Manage general system settings (FE-51).
- View user activity, attendance, participation-confirmation, and assignment-completion reports; export by month, event, or liturgical season (FE-52–FE-53).
- View activity history for role changes, skill approvals, song-list approvals, roster confirmation, attendance updates, and deleted materials (FE-54).
