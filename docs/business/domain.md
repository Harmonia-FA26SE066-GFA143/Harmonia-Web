# Harmonia Domain

Cleaned 2026-10-20. Requirements source: the official `Report1_Project Introduction` Google document. Labels: **EXPLICIT** (stated in Report 1), **INTERPRETATION** (a modeling reading, not a requirement). Where Harmonia-BE covers a behavior it decides (owner decision 2026-10-07); see `docs/tbd-backlog.md` for what the BE lacks.

## Product Scope

### EXPLICIT — Report 1 §1.1, §2, §5, FE-01–FE-54

Harmonia is a web and mobile choir coordination and liturgical music management system. Report 1 places member functions in a mobile app and Priest, Choir Director, and Admin functions in the web system. The feature scope covers member profiles and skills, liturgical programs, song lists and resources, rehearsals, participation responses, roster suggestions, practice assignments and submissions, attendance, reports, and activity history.

### EXPLICIT — Report 1 LI-01, LI-04, LI-06, LI-07, EX-01–EX-09

The system supports choir coordination and liturgical music management within a parish or church organization. It requires Internet access and excludes full offline operation of core management functions. It is intended for small-to-medium choir organizations and may not suit multiple dioceses. It primarily supports common choir roles, vocal parts, and instrumental capabilities configured by an administrator.

Report 1 excludes financial management; general parish management beyond choir information; live streaming; automatic song composition or arrangement; advanced AI analysis of performance; commercial transactions for music resources; integration with external musical hardware; third-party platform integrations (EX-08, now partly implemented for the liturgical calendar, see `liturgical-program.md`); and full offline operation.

### EXPLICIT — Report 1 FE-29

Song classification dimensions: liturgical season, Mass type, ceremony type, theme, vocal requirements, and instrument requirements. The BE classifies by season, Mass type, ceremony type and song theme (`ClassificationTarget`) from Admin-managed catalogs, with vocal and instrument requirements from the skill catalog.

## Numeric targets (UNSUPPORTED by Report 1)

Targets such as participation confirmation under one minute, dashboards within three seconds, or cross-platform status consistency are not stated in Report 1. Apply them only if an authoritative source is supplied.
