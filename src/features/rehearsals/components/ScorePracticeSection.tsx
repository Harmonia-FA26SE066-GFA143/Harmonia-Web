import { Alert, ConfigProvider } from 'antd'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { env } from '@/config/env'
import { Reveal } from '@/shared/ui/Reveal'
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
import { createVerovioEngine, type ScoreEngine } from '../score/engine'
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
    }

const failureOf = (error: unknown): PlayerState =>
  error instanceof ScoreSourceError && !RETRYABLE[error.code] ? { status: 'rejected', message: error.message } : { status: 'failed' }

/** Alignment guard of the plan: half a second, or 1% of a long song. */
const toleranceFor = (timelineSeconds: number) => Math.max(0.5, timelineSeconds * 0.01)

function misalignmentNote(audioSeconds: number, timelineSeconds: number): string | undefined {
  if (audioSeconds <= 0) return undefined
  const { ok, deltaSeconds } = checkAlignment(audioSeconds, timelineSeconds, toleranceFor(timelineSeconds))
  if (ok) return undefined
  const gap = Math.abs(deltaSeconds).toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  return `Âm thanh ${deltaSeconds > 0 ? 'dài' : 'ngắn'} hơn bản nhạc khoảng ${gap} giây, nên nốt sáng có thể không khớp tiếng. Vui lòng kiểm tra lại hai tệp.`
}

/** On failure the sheet keeps its previous layout: right notes, wrong width until the next resize. */
function relayoutOr(engine: ScoreEngine, pageWidth: number, previous: string[]): string[] {
  try {
    return engine.relayout(pageWidth)
  } catch {
    return previous
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
  const [sectionRoot, setSectionRoot] = useState<HTMLDivElement | null>(null)
  const focusButton = useRef<HTMLButtonElement>(null)
  const engineRef = useRef<ScoreEngine | null>(null)
  /** Frees what this attempt holds: the effect's cleanup and a refusal from the viewer both call it. */
  const releaseRef = useRef<() => void>(() => {})
  const pageWidth = useRef(MIN_ENGINE_PAGE_WIDTH)
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
        // Known limit (F2-I1, accepted for slice 1): Verovio parses and draws every page synchronously inside this call,
        // 1.8–4.6 s for a 27–67 page SATB score, and it cannot be cancelled. A Worker is P10 / Track A work.
        const loadWidth = pageWidth.current
        const loaded = await engine.load(scorePackage.score, { pageWidth: loadWidth })
        if (signal.aborted) return release()
        const { score, audioUrl } = scorePackage
        // The tie map only adds group info and finalOff (lyrics hold over tied notes); note on/off times and onsets stay as they were.
        const timeline = parseTimemap(loaded.timemap, loaded.aliases, parseTieMap(loaded.mei))
        // The sheet may have reported its real width while the engine was busy; draw at that width before showing it.
        const svgPages = pageWidth.current === loadWidth ? loaded.svgPages : relayoutOr(engine, pageWidth.current, loaded.svgPages)
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
    const next = toEnginePageWidth(width)
    if (next === pageWidth.current) return
    pageWidth.current = next
    const engine = engineRef.current
    // No engine yet: the load in progress compares widths when it ends. Redrawn here, not in a state updater, which
    // StrictMode runs twice.
    if (!engine || state.status !== 'ready') return
    setState({ ...state, svgPages: relayoutOr(engine, next, state.svgPages) })
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
        <div
          ref={setSectionRoot}
          className={active ? 'hm-score-section hm-score-section--focus' : 'hm-score-section'}
          style={active ? focusVars : { marginTop: spacing.lg }}
          role={active ? 'dialog' : undefined}
          aria-modal={active ? true : undefined}
          aria-label={active ? `Chế độ tập trung: ${title}` : undefined}
          // Focusable by script and by a click on its empty part, so the shortcuts keep a place to be heard.
          tabIndex={active ? -1 : undefined}
        >
          {!failed && (
            // Above the sheet, not over it: showing "Theo dõi" or the mode button moves nothing and covers no staff.
            <div className="hm-score-toolbar">
              {active && <span className="hm-score-focus-title">{title}</span>}
              {active && <span className="hm-score-focus-hint">Esc để thoát</span>}
              {ready && !following && <FollowButton onClick={resume} />}
              {(ready || active) && <FocusModeButton active={active} onToggle={focus.toggle} buttonRef={focusButton} />}
            </div>
          )}
          <div ref={setViewerRoot} className="hm-score-frame" style={{ height: failed || active ? undefined : SHEET_FRAME_HEIGHT }}>
            {viewer}
          </div>
          {warning && <Alert type="warning" showIcon title={warning} style={{ marginTop: spacing.md }} />}
          {ready && (
            <Reveal>
              <PlaybackControls clock={clock} title={title} />
            </Reveal>
          )}
          <LyricSelector
            parts={lyricChoice.parts}
            verses={lyricChoice.verses}
            selection={lyricChoice.selection}
            onPart={lyricChoice.choosePart}
            onVerse={lyricChoice.chooseVerse}
          />
        </div>
      </ConfigProvider>
      {failed && fallback}
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
