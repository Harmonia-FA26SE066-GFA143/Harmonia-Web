# Harmonia Choir Skills

Cleaned 2026-10-20 against Harmonia-BE `main@a6af23e`; re-checked 2026-10-25 at `main@42e604e`. Where the BE covers a behavior it decides (owner decision 2026-10-07); owner decisions stay only where the BE says nothing.

## EXPLICIT — Report 1 FE-02–FE-04, FE-25, FE-49

Report 1 names Soprano, Alto, Tenor, Bass, Guitar, Organ, Solo Singing, and Psalmist as skills members may declare (FE-03). Members view their assigned vocal/instrument skills and approved capabilities, declare skills, and track each declaration's approval status (FE-02–FE-04). The Choir Director reviews and approves declared skills (FE-25). Admin configures skill categories, including vocal parts, instruments, solo singing, psalm reading, and conducting support (FE-49). LI-03: skill declarations depend on authorized users.

## BE contract (verified `a6af23e`, re-checked `42e604e`, `MemberSkillService.cs`)

- **Catalog**: skills belong to skill categories ("groups": vocal parts, instruments, …) that the Admin maintains; the skill names above are examples, not a fixed list.
- **Declaration** (Choir Member, mobile): the member must be Active; the skill and its category must be active; one active declaration per skill; an optional level `Beginner` / `Intermediate` / `Advanced`. It starts as `Pending` (`:18-53`).
- **Review** (Choir Director): `GET /api/member-skills/pending` lists Pending declarations, oldest first; approve or reject. Reject requires a reason of at most 500 characters. Only a Pending declaration can be decided, a decision cannot be changed, and another Director's earlier decision stands (`MEMBER_SKILL_ALREADY_REVIEWED`). The member is notified (`:92-135`).
- Statuses: `Pending`, `Approved`, `Rejected` (`ApprovalStatus.cs`). Only Approved skills appear on a member's profile and count for roster eligibility.

## Owner decisions still standing (BE silent)

- Catalog maintenance (2.7): the Admin adds, edits and removes catalog entries (skills and the FE-50 liturgical catalogs).
- Song vocal and instrument requirements are chosen from this catalog.
- Evidence, expiration and multiple simultaneous vocal-part declarations are not modelled; do not add them.
