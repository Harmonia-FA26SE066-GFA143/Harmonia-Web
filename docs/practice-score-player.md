# Practice room: interactive score player

What the Web does when a rehearsal's practice room shows a MusicXML score that follows an audio file: how the code is cut up, where the score comes from today, how to try it, what is known to be limited, and what is left. Written from the code in `src/features/rehearsals/` (`components/ScorePracticeSection.tsx` and `score/*`). Not a business document: no rule here is decided by the BE or the owner beyond what is stated.

## Architecture (`src/features/rehearsals/score/`)

One audio element is the only clock. Everything else is derived from it, and time never goes through React state per frame.

| Module | Job |
|---|---|
| `clock/` | `usePlaybackClock`: owns one `HTMLAudioElement` per source. `currentTime` is the only time; subscribers are notified outside React, state changes about once per second (`playing`, `duration`, `error`). |
| `engine/` | Wraps Verovio (`createVerovioEngine`, WASM, its own lazy chunk): `load` (parse, MEI, timemap, SVG pages, ids of repeated notes), `relayout(pageWidth)`, `dispose`. Refuses a score above `MAX_SCORE_NOTES` (6 400 `<note>` elements, rests included) with `too-complex`. `countStaves` reads the staves from the MEI. |
| `timeline/` | `parseTimemap` turns Verovio's timemap into sorted on/off events keyed by the note ids the SVG draws; `tieMap` chains tied notes; `cursor` tells which notes sound at a time; `occurrence` picks which pass of a repeated note a click means. |
| `viewer/` | `ScoreViewer`: sanitises each SVG page (`sanitizeSvg`, size limits) and mounts it in one scroll region. `toEnginePageWidth` maps the sheet's CSS width to Verovio's page width (see limits). |
| `sync/` | `useScoreSync` lights the sounding notes by class on the SVG; `useLyricSync` lights the sung syllable; `useFollowScroll` scrolls the sheet to the sounding note until the user scrolls away; `useNoteSeek` / `findNoteAt`: click a note to jump there. |
| `lyrics/` | `parseLyrics` reads `<verse><syl>` from the MEI; `selectLyrics` maps each staff to a part (one staff = one part, label from the `staffDef`). |
| `controls/` | Play/pause, position slider, time; part and verse selectors (`useLyricSelection`); the "Theo dõi" button; keyboard (Space, ←/→ 5 s, Home) scoped to the practice section. |
| `focus/` | Focus mode: the section becomes a full-screen dark `<dialog open>` (never `showModal`), the rest of the page is `inert`; `F` toggles, `Esc` leaves. |
| `source/` | Where the files come from (next section) and `checkAlignment` (audio length against timeline length, 0.5 s or 1 %). |
| `license/` | The credit line under a score on screen and its licence dialog (Verovio, LGPL-3.0-only). The facts live in `verovioNotice.ts` and the two licence texts are kept verbatim next to it; a test checks the facts against `package.json` and the installed package. |

`ScorePracticeSection` ties them together: one `ScorePlayer` per attempt (remounted by key for a retry or another source, so the engine and object URLs are freed on unmount), and the room's own MIDI/audio content stays as the fallback until a score is ready.

## Where the score comes from

- `ScorePackageSource.load(signal)` returns a `ScorePackage`: the score (`musicxml` text or `mxl` bytes), an `audioUrl`, and `dispose()` for the object URLs. A source throws only `ScoreSourceError` (`invalid-type`, `too-large`, `read-failed`, `aborted`, `unavailable`).
- **Dev fixture** (`DevFixtureScoreSource`): `sample.mxl` (self-written, 4 bars, one part, repeat with volta, two verses) and `sample.wav` (FluidSynth from the same MIDI, GeneralUser GS SoundFont). Used only when `env.useDevFixtures` (`import.meta.env.DEV && VITE_USE_DEV_FIXTURES === 'true'`); the files are imported dynamically after that guard, so the default production build (`npm run build`, with neither `NODE_ENV` nor the fixture flag set) has neither in `dist/` (checked by `devFixtureAssets.test.ts` and by grepping `dist/` after such a build).
- **Local files** (`BrowserFileScoreSource` through `LocalScoreFilePicker`): temporary. The user picks a `.musicxml`/`.mxl` (up to 20 MB, the BE's upload limit) and a `.wav` (up to 100 MB, a Web-only limit). Nothing leaves the browser. Shown only when the dev flag is off.
- **API source: not written.** The BE already has `GET api/music-materials/{id}/score` (`MusicMaterialsController.cs:82-85` at BE `d74096c`; tbd-backlog B47), which returns fresh signed URLs of the score and of the WAV rendered from the same revision. An `ApiScorePackageSource` has to call it, fetch both files, keep the revision and hashes, and hand the result to the same `ScorePackage` shape. Until then the picker is the only production source.

## Try it

Set `VITE_USE_DEV_FIXTURES` to `true` (read in `src/config/env.ts`; any other value is off) and start the dev server. The flag is meant for `npm run dev`: `env.useDevFixtures` is `import.meta.env.DEV && VITE_USE_DEV_FIXTURES === 'true'`, and `DEV` follows `NODE_ENV`. The default `npm run build` leaves `DEV` false, so the flag is off even if the variable is set; a trial build outside the repo confirmed that (no `sample.*`/`.wav`/`.mxl` in the output). A build run with `NODE_ENV=development` makes `DEV` true, and with `VITE_USE_DEV_FIXTURES=true` as well the sample files can reach the output (the same trial put `sample-*.wav` there): do not release such a build.

```
# bash / zsh
VITE_USE_DEV_FIXTURES=true npm run dev

# PowerShell
$env:VITE_USE_DEV_FIXTURES='true'; npm run dev

# cmd (no space before &&: a trailing space would make the value "true " and turn the flag off)
set VITE_USE_DEV_FIXTURES=true&& npm run dev
```

Or put `VITE_USE_DEV_FIXTURES=true` in `.env.local` (git ignores `.env.*`) and run `npm run dev` as usual.

Open a rehearsal's practice room: the sample loads by itself. Without the variable, pick `sample.mxl` and `sample.wav` from `src/features/rehearsals/score/source/fixtures/` with the two buttons. Tests: `npx vitest run src/features/rehearsals`.

## Known limits

| Area | Limit |
|---|---|
| Audio | A score has one WAV. Changing the part only changes which lyrics are lit, not what is heard. |
| Audio | A recording made in the room can play over the score. |
| Labels | The sheet's group label "Bản nhạc" is the same for the PDF/image viewer and for the new score. |
| Speed | The engine runs on the main thread: parse and timemap are 85–90 % of the load. Above 6 400 notes the score is refused; an `.mxl` is counted only after Verovio has read it (about 5.7 s for 800 bars); a score at the limit on a narrow sheet takes about 5.1 s. A Web Worker and page-by-page rendering are not done (inserting the SVG of a 27-page SATB score takes about 614 ms). |
| Page width | One staff keeps a 300 px step (a phone-width sheet gets a fixed 750 page and scrolls sideways). Two staves or more get a floor of 900 and scroll sideways on a narrower sheet. A piano part counts as two staves. |
| Repeats and lyrics | A melisma that crosses a volta ends early. The verse is fixed by the user and does not follow the pass of a repeat. One staff is one part, so a part written on two staves shows as two. |
| Counting | The note counter can count a `<note>` inside a processing instruction or DOCTYPE. |
| Colour | A lit note differs from ink by 2.36:1 in luminance, so the state is carried mainly by hue. |
| Controls | `Reveal` was removed from the playback controls because it made the button invisible. |
| Not measured | Safari and Firefox; a real multi-part choral score. Timings were taken in Chromium (Playwright). |

## Licence

Verovio 6.4.1 is `LGPL-3.0-only`, used unmodified from npm and loaded as a separate lazy chunk. The credit and the dialog state the library, version, licence, source (<https://github.com/rism-digital/verovio>) and the full LGPL-3.0 and GPL-3.0 texts, as facts only. No legal advice was taken; the owner accepted the risk on 2026-11-07.

## Left to do

1. `ApiScorePackageSource` on the BE endpoint above, then remove `LocalScoreFilePicker` (or keep it for the Choir Director only, if the owner wants).
2. One WAV per part, so changing the part changes the sound.
3. Move parse and layout to a Web Worker; render pages on demand for long scores.
4. Measure Safari and Firefox and a real SATB score; revisit `MAX_SCORE_NOTES` with those numbers.
5. Lyrics that follow the repeat pass; melisma across a volta.
