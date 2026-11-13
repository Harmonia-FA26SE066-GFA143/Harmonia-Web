# Playwright E2E

`smoke.spec.ts` needs no backend: each test answers the `/api` calls in the browser. Run it with
`npm run test:e2e -- smoke --workers=1`; on a slow machine several browsers plus the dev server can run out of memory.

The PDF score test uses the real backend contract and requires a rehearsal containing a PDF score.

Set these environment variables before running `npm run test:e2e`:

- `PLAYWRIGHT_REHEARSAL_URL`: full local rehearsal URL, for example `http://localhost:5173/director/rehearsals/<id>`.
- `PLAYWRIGHT_SCORE_SONG`: visible song title whose materials include a PDF score.
- Either `PLAYWRIGHT_EMAIL` and `PLAYWRIGHT_PASSWORD`, or `PLAYWRIGHT_STORAGE_STATE` pointing to a local Playwright storage-state file.

Keep storage-state files under `tests/e2e/.auth/`; that directory is ignored by Git.
