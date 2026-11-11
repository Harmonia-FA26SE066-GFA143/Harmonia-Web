import { Alert, ConfigProvider } from 'antd'
import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { env } from '@/config/env'
import { spacing } from '@/styles/tokens'
import { usePlaybackClock } from '../score/clock/usePlaybackClock'
import { FocusModeButton } from '../score/focus/FocusModeButton'
import { focusTheme, focusVars, inheritTheme } from '../score/focus/focusTheme'
import { useFocusMode } from '../score/focus/useFocusMode'
import { FollowButton } from '../score/controls/FollowButton'
import { LyricSelector } from '../score/controls/LyricSelector'
import { PlaybackControls } from '../score/controls/PlaybackControls'
import { readLyrics, useLyricSelection, type ScoreLyrics } from '../score/controls/useLyricSelection'
import { useScoreShortcuts } from '../score/controls/useScoreShortcuts'
import { countStaves, createVerovioEngine, MAX_SCORE_NOTES, ScoreEngineError, type ScoreEngine } from '../score/engine'
import { ScoreCredit } from '../score/license/ScoreCredit'
import { checkAlignment } from '../score/source/checkAlignment'
import { DevFixtureScoreSource } from '../score/source/DevFixtureScoreSource'
import { ScoreSourceError, type ScorePackage, type ScorePackageSource, type ScoreSourceErrorCode } from '../score/source/types'
import { useFollowScroll } from '../score/sync/useFollowScroll'
import { useLyricSync } from '../score/sync/useLyricSync'
import { useNoteSeek } from '../score/sync/useNoteSeek'
import { useScoreSync } from '../score/sync/useScoreSync'
import { createTimelineCursor, type TimelineCursor } from '../score/timeline/cursor'
import { parseTimemap } from '../score/timeline/parseTimemap'
import { parseTieMap } from '../score/timeline/tieMap'
import type { PlaybackTimeline } from '../score/timeline/types'
import { MIN_ENGINE_PAGE_WIDTH, ScoreViewer, toEnginePageWidth } from '../score/viewer'
import { MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH } from '../score/viewer/toEnginePageWidth'
import { LocalScoreFilePicker } from './LocalScoreFilePicker'
import '../score/focus/focusMode.css'

/** The page decides how tall the sheet is; the viewer only fills it and scrolls inside. Focus mode lets the sheet take what the screen leaves. */
const SHEET_FRAME_HEIGHT = 'min(60vh, 560px)'

const devSource = new DevFixtureScoreSource()

/** Whether trying the same source again can help. `aborted` only comes from this component's own cleanup. */
const RETRYABLE: Record<ScoreSourceErrorCode, boolean> = {
  'invalid-type': false,
  'too-large': false,
  unavailable: false,
  'read-failed': true,
  aborted: true,
}

type PlayerState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'rejected'; message: string }
  | {
      status: 'ready'
      fileName: string
      svgPages: string[]
      audioUrl: string
      cursor: TimelineCursor
      onsets: PlaybackTimeline['onsets']
      timelineSeconds: number
      /** Null for a score without lyrics: no lyric choice is shown. */
      lyrics: ScoreLyrics | null
      /**
       * The page shown was drawn by the multi-staff rule (two staves or more, at least the floor), so the stylesheet keeps
       * it at least the floor wide and the sheet scrolls under it. Follows the page drawn, never the one asked for.
       */
      multiStaff: boolean
    }

const TOO_COMPLEX = `Bản nhạc quá dài để hiển thị trên web (hơn ${MAX_SCORE_NOTES.toLocaleString('vi-VN')} nốt và dấu lặng). Vui lòng dùng bản ngắn hơn hoặc tách bài thành nhiều phần.`

function failureOf(error: unknown): PlayerState {
  if (error instanceof ScoreEngineError && error.code === 'too-complex') return { status: 'rejected', message: TOO_COMPLEX }
  return error instanceof ScoreSourceError && !RETRYABLE[error.code] ? { status: 'rejected', message: error.message } : { status: 'failed' }
}

/** Alignment guard of the plan: half a second, or 1% of a long song. */
const toleranceFor = (timelineSeconds: number) => Math.max(0.5, timelineSeconds * 0.01)

function misalignmentNote(audioSeconds: number, timelineSeconds: number): string | undefined {
  if (audioSeconds <= 0) return undefined
  const { ok, deltaSeconds } = checkAlignment(audioSeconds, timelineSeconds, toleranceFor(timelineSeconds))
  if (ok) return undefined
  const gap = Math.abs(deltaSeconds).toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  return `Âm thanh ${deltaSeconds > 0 ? 'dài' : 'ngắn'} hơn bản nhạc khoảng ${gap} giây, nên nốt sáng có thể không khớp tiếng. Vui lòng kiểm tra lại hai tệp.`
}

/**
 * Above the sheet, not over it: showing "Theo dõi" or the mode button moves nothing and covers no staff. In focus mode
 * it also names the song and the way out, since the page's own title is hidden.
 */
function ScoreToolbar({
  title,
  active,
  ready,
  following,
  onResume,
  onToggle,
  buttonRef,
}: Readonly<{
  title: string
  active: boolean
  ready: boolean
  following: boolean
  onResume: () => void
  onToggle: () => void
  buttonRef: Ref<HTMLButtonElement>
}>) {
  return (
    <div className="hm-score-toolbar">
      {active && <span className="hm-score-focus-title">{title}</span>}
      {active && <span className="hm-score-focus-hint">Esc để thoát</span>}
      {ready && !following && <FollowButton onClick={onResume} />}
      {(ready || active) && <FocusModeButton active={active} onToggle={onToggle} buttonRef={buttonRef} />}
    </div>
  )
}

/** The pages at `pageWidth`, or undefined when the engine fails: the caller then keeps the page it has and its width. */
function tryRelayout(engine: ScoreEngine, pageWidth: number): string[] | undefined {
  try {
    return engine.relayout(pageWidth)
  } catch {
    return undefined
  }
}

/** One attempt at one source: remounted (by key) for a retry or another source, so all it holds is freed on unmount. */
function ScorePlayer({
  source,
  title,
  fallback,
  onRetry,
}: Readonly<{ source: ScorePackageSource; title: string; fallback: ReactNode; onRetry: () => void }>) {
  const [state, setState] = useState<PlayerState>({ status: 'loading' })
  const [viewerRoot, setViewerRoot] = useState<HTMLDivElement | null>(null)
  // The part of the page the keyboard shortcuts belong to: the sheet, its controls and the follow button.
  const [sectionRoot, setSectionRoot] = useState<HTMLDialogElement | null>(null)
  const focusButton = useRef<HTMLButtonElement>(null)
  const engineRef = useRef<ScoreEngine | null>(null)
  /** Frees what this attempt holds: the effect's cleanup and a refusal from the viewer both call it. */
  const releaseRef = useRef<() => void>(() => {})
  /**
   * The width of the page on screen (or, before the load, of the page the load will draw). It moves only when a page at
   * that width is drawn, so a failed redraw leaves it on the old page and the next width report tries again.
   */
  const pageWidth = useRef(MIN_ENGINE_PAGE_WIDTH)
  /** The last width the sheet reported (NaN until it does), and the staves of the loaded score (1 until it is known). */
  const sheetWidth = useRef(Number.NaN)
  const staves = useRef(1)
  const drawnByMultiStaffRule = (drawnWidth: number) => staves.current >= 2 && drawnWidth >= MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH
  const ready = state.status === 'ready' ? state : undefined
  const clock = usePlaybackClock(ready?.audioUrl)
  useScoreSync(clock, viewerRoot, ready?.cursor ?? null)
  useNoteSeek(clock, viewerRoot, ready?.onsets ?? null)
  const { following, resume } = useFollowScroll(viewerRoot)
  useScoreShortcuts(sectionRoot, clock)
  const failed = state.status === 'failed'
  // A refused or failed score ends the mode: the error and the room's own content are for the page, not for the dark screen.
  const focus = useFocusMode(failed ? null : sectionRoot, focusButton)
  const lyricChoice = useLyricSelection(ready?.lyrics ?? null, ready?.fileName ?? '')
  useLyricSync(clock, viewerRoot, lyricChoice.index)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    let scorePackage: ScorePackage | undefined
    let engine: ScoreEngine | undefined
    // Each resource is freed once and forgotten, so calling this again (cleanup after a failure or a refusal) frees
    // nothing twice, while a package or engine that arrives later is still freed when it lands.
    const release = () => {
      scorePackage?.dispose()
      scorePackage = undefined
      engine?.dispose()
      engine = undefined
      engineRef.current = null
    }
    releaseRef.current = release

    void (async () => {
      try {
        scorePackage = await source.load(signal)
        if (signal.aborted) return release()
        engine = await createVerovioEngine()
        if (signal.aborted) return release()
        // Known limit (F2-I1): Verovio parses and draws every page synchronously inside this call and it cannot be
        // cancelled. The engine refuses a score over MAX_SCORE_NOTES (too-complex), which bounds it near 3.3 s (P10-A).
        const loadWidth = pageWidth.current
        const loaded = await engine.load(scorePackage.score, { pageWidth: loadWidth })
        if (signal.aborted) return release()
        const { score, audioUrl } = scorePackage
        // The tie map only adds group info and finalOff (lyrics hold over tied notes); note on/off times and onsets stay as they were.
        const timeline = parseTimemap(loaded.timemap, loaded.aliases, parseTieMap(loaded.mei))
        // Verovio accepts broken XML and draws an empty page; a score with no note to follow is refused like a wrong file.
        if (timeline.onsets.size === 0) throw new ScoreSourceError('invalid-type', 'Không đọc được nốt nhạc nào trong tệp này. Vui lòng kiểm tra lại tệp MusicXML.')
        // The sheet may have reported its real width while the engine was busy, and a score of several staves has a wider
        // floor (known only now, from the MEI): draw at the page they give before showing it, so at most one redraw.
        staves.current = countStaves(loaded.mei)
        const wanted = toEnginePageWidth(sheetWidth.current, staves.current)
        const relaid = wanted === loadWidth ? loaded.svgPages : tryRelayout(engine, wanted)
        pageWidth.current = relaid ? wanted : loadWidth
        const svgPages = relaid ?? loaded.svgPages
        engineRef.current = engine
        setState({
          status: 'ready',
          fileName: score.fileName,
          svgPages,
          audioUrl,
          cursor: createTimelineCursor(timeline),
          onsets: timeline.onsets,
          timelineSeconds: timeline.duration,
          lyrics: readLyrics(loaded.mei, timeline),
          multiStaff: drawnByMultiStaffRule(pageWidth.current),
        })
      } catch (error) {
        release()
        if (!signal.aborted) setState(failureOf(error))
      }
    })()

    return () => {
      controller.abort()
      release()
    }
  }, [source])

  const onWidthChange = (width: number) => {
    sheetWidth.current = width
    const next = toEnginePageWidth(width, staves.current)
    if (next === pageWidth.current) return
    const engine = engineRef.current
    // No engine yet: nothing is drawn, the load uses this width or compares it when it ends.
    if (!engine || state.status !== 'ready') {
      pageWidth.current = next
      return
    }
    // Redrawn here, not in a state updater, which StrictMode runs twice. A failure keeps the page and its width.
    const svgPages = tryRelayout(engine, next)
    if (!svgPages) return
    pageWidth.current = next
    setState({ ...state, svgPages, multiStaff: drawnByMultiStaffRule(next) })
  }

  if (state.status === 'rejected') {
    return (
      <>
        <Alert type="error" showIcon title={state.message} style={{ marginTop: spacing.lg }} />
        {fallback}
      </>
    )
  }

  const { active } = focus
  const warning = ready && misalignmentNote(clock.duration, ready.timelineSeconds)
  // An audio that never loaded (a corrupt WAV) can never sound, so the room's own player may come back beside the sheet.
  // A refused play() can still be retried, loaded or not: the fallback stays away then, or two players could sound at once.
  const audioDead = ready !== undefined && clock.sourceFailed === true && clock.duration <= 0
  // One ScoreViewer element for every state, so it is kept (not rebuilt) as the state moves from loading to ready to refused.
  let viewer: ReactNode
  if (failed) viewer = <ScoreViewer status="error" svgPages={[]} title={title} onRetry={onRetry} />
  else if (ready)
    viewer = (
      <ScoreViewer
        status="ready"
        scoreKey={ready.fileName}
        svgPages={ready.svgPages}
        title={title}
        onRetry={onRetry}
        onWidthChange={onWidthChange}
        // Refused pages end the ready state: the package (object URL) and the engine go now, not when the page is
        // left; the clock then drops the audio and the fallback comes back.
        onRefused={() => {
          releaseRef.current()
          setState({ status: 'failed' })
        }}
      />
    )
  else viewer = <ScoreViewer status="loading" svgPages={[]} title={title} onWidthChange={onWidthChange} />
  // One shell for loading, ready and failed, so the sheet is never rebuilt when the mode turns on or off. A refusal that
  // ends the ready state keeps the shell (and the mode) until the error is on screen; the fallback sits outside it.
  return (
    <>
      <ConfigProvider theme={active ? focusTheme : inheritTheme}>
        {/* A native <dialog open>, never opened as a modal (no showModal: that would put it in the top layer, under which Ant
            Design's popups would vanish, and rebuild the sheet): its dialog role is the element's own while the mode is on
            (aria-modal, backed by the inert page and the fixed overlay), and it presents as plain content when it is off. */}
        <dialog
          open
          ref={setSectionRoot}
          className={active ? 'hm-score-section hm-score-section--focus' : 'hm-score-section'}
          style={active ? focusVars : { marginTop: spacing.lg }}
          role={active ? undefined : 'presentation'}
          aria-modal={active ? true : undefined}
          aria-label={active ? `Chế độ tập trung: ${title}` : undefined}
          // Focusable by script and by a click on its empty part, so the shortcuts keep a place to be heard.
          tabIndex={active ? -1 : undefined}
        >
          {!failed && (
            <ScoreToolbar
              title={title}
              active={active}
              ready={ready !== undefined}
              following={following}
              onResume={resume}
              onToggle={focus.toggle}
              buttonRef={focusButton}
            />
          )}
          <div ref={setViewerRoot} className={ready?.multiStaff ? 'hm-score-frame hm-score-frame--multi-staff' : 'hm-score-frame'} style={{ height: failed || active ? undefined : SHEET_FRAME_HEIGHT }}>
            {viewer}
          </div>
          {warning && <Alert type="warning" showIcon title={warning} style={{ marginTop: spacing.md }} />}
          {ready && <PlaybackControls clock={clock} title={title} />}
          <LyricSelector
            parts={lyricChoice.parts}
            verses={lyricChoice.verses}
            selection={lyricChoice.selection}
            onPart={lyricChoice.choosePart}
            onVerse={lyricChoice.chooseVerse}
          />
          {ready && <ScoreCredit />}
        </dialog>
      </ConfigProvider>
      {(failed || audioDead) && fallback}
    </>
  )
}

/**
 * The score player of the practice room. The source is the dev fixture when that flag is on, otherwise files from this
 * computer (temporary, see `LocalScoreFilePicker`). `fallback` is the room's existing MIDI/audio content: it stays while
 * there is no package or the package failed, and gives way to the score otherwise, so only one player has sound.
 */
export function ScorePracticeSection({ title, fallback }: Readonly<{ title: string; fallback: ReactNode }>) {
  const [picked, setPicked] = useState<ScorePackageSource>()
  const [attempt, setAttempt] = useState(0)
  const nextAttempt = () => setAttempt((value) => value + 1)
  const source = env.useDevFixtures ? devSource : picked

  return (
    <>
      {!env.useDevFixtures && (
        <LocalScoreFilePicker
          onPick={(next) => {
            setPicked(next)
            nextAttempt()
          }}
        />
      )}
      {source ? <ScorePlayer key={attempt} source={source} title={title} fallback={fallback} onRetry={nextAttempt} /> : fallback}
    </>
  )
}
