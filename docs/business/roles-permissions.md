# Roles and Permissions

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`, 2026-10-26 at `main@c091c07` and 2026-10-27 at `main@d1ca63e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions below stay only where the BE says nothing.

## EXPLICIT — Report 1 LI-02, FE-01–FE-54

Report 1 requires a valid registered account and says system functions are provided according to the user's assigned role (LI-02). FE-48 names these assignable roles: Parish Priest/Liturgy Committee, Choir Director, Choir Member, and Admin.

- Priest: weekly program work and song-list review/decision, preparation status, reports, and notes (FE-15–FE-23).
- Choir Director: member management, skill approval, rehearsals, music library, song proposals, participation requests, roster workflow, practice assignments/evaluation, attendance, and progress tracking (FE-24–FE-46).
- Choir Member: profile, skills, event responses, approved music, materials, practice submission, feedback, and history (FE-01–FE-14).
- Admin: user accounts, role assignment, configuration, reports/exports, and activity history (FE-47–FE-54).

LI-03: skill declarations, song-list approval, roster finalization, and practice evaluation depend on authorized users and are not fully automated.

## BE contract (verified `a6af23e`, re-checked `d1ca63e`)

- **Four roles**: `Admin`, `ParishPriest`, `ChoirDirector`, `ChoirMember`. **One role per account** (`User.RoleId`). Instrumentalist is not a role: it is a Choir Member with instrument skills (owner decision C3). Liturgy Committee is not a separate role.
- **No public registration.** `AuthController` has no register endpoint. The Admin creates accounts with a role (`UsersController.cs:27-30`); the BE generates a 12-character first password and emails it (`UserService.cs:44-81, 170-180`); the account must replace it at the first sign-in (`isPasswordChangeRequired`, `AuthController.cs:46-52`). Password reset by email link and Google sign-in (existing active accounts only) exist (`AuthController.cs:19-24, 71-83`).
- **Only the Admin** creates, edits (email, name, phone), deactivates or reactivates accounts and assigns roles (`UsersController.cs:14-15`). The Admin cannot deactivate or change the role of their own account, and the last active Admin cannot be deactivated or moved to another role (`UserService.cs:116-124, 149-157`). A role change or deactivation revokes the user's sessions.
- **Every user** edits their own full name and phone (`PUT /api/auth/me`); email changes go through the Admin.
- **Choir Member on the web** signs in but only sees the message to use the mobile app (Web `LoginPage.tsx`). There is no self-registration on mobile either.
- **Reports** (`ReportsController.cs`, `446f429`, `718696c`): service history and song usage for the Parish Priest and the Admin; user activity and the list of exports for the Admin only; rehearsal attendance, participation and assignment completion, their export and the activity trend, for the Admin and the Choir Director; report columns for every role that reads reports.
- **Song classification and roster tiers** (`d1ca63e`): the Admin edits the people a liturgical slot always needs (`PUT api/lookups/liturgical-slots/{id}/requirements`; every role reads) and the song theme tree; the Parish Priest and the Choir Director read song suggestions and an event's whole-service roles; the lead choir's director sets those roles, notes assignments and finalizes the whole-service lines early (`LookupsController.cs:141-151`, `LiturgicalEventsController.cs:99-120`, `ServiceRostersController.cs:55-66`).
- **Authorization** is `[Authorize(Roles = …)]` per endpoint; the Web hides what a role cannot do but the BE is authoritative.
- **Choirs (D8, `718696c`)**: only the Admin creates and edits choirs and sets each choir's one director (`ChoirsController.cs:17-30`, `ChoirService.cs:22-80`, `CHOIR_DIRECTOR_INVALID`). The Admin and the Parish Priest see every choir, a Choir Director only the choirs they direct; another director's choir answers `404 CHOIR_NOT_FOUND` (`ChoirsController.cs:15`, `ChoirService.cs:45-50, 284-291`). The Parish Priest sets the choirs serving an event and its lead choir (`LiturgicalEventsController.cs:83-91`); the Choir Director only reads them. A choir's members are listed, added and taken out by the Admin and its director (`ChoirsController.cs:37-51`); both search member profiles to add them (`MemberProfilesController.cs:39-40`, `c091c07`).
- **Choir scope (D8, `718696c`)**: on an event served by several choirs only the director of the lead choir writes; the others read and get `403 CHOIR_NOT_LEAD`. With choirs but no lead, the director of any serving choir writes; an event with no choir is open to every Choir Director as before (`ChoirScopeService.cs:59-96`).

## INTERPRETATION

Role-based access enforcement is an interpretation of LI-02; Report 1 does not specify the enforcement mechanism.

## Open (BE silent)

Fine-grained resource permissions, delegated or temporary roles, and whether the Priest and a Liturgy Committee are separate identities are not modelled. Track needs in `docs/tbd-backlog.md`.
