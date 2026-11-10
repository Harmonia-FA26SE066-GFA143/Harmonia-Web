import { Alert } from 'antd'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { env } from '@/config/env'
import { spacing } from '@/styles/tokens'
import { usePlaybackClock } from '../score/clock/usePlaybackClock'
import { PlaybackControls } from '../score/controls/PlaybackControls'
import { createVerovioEngine, type ScoreEngine } from '../score/engine'
import { checkAlignment } from '../score/source/checkAlignment'
import { DevFixtureScoreSource } from '../score/source/DevFixtureScoreSource'
import { ScoreSourceError, type ScorePackage, type ScorePackageSource, type ScoreSourceErrorCode } from '../score/source/types'
import { useScoreSync } from '../score/sync/useScoreSync'
import { createTimelineCursor, type TimelineCursor } from '../score/timeline/cursor'
import { parseTimemap } from '../score/timeline/parseTimemap'
import { MIN_ENGINE_PAGE_WIDTH, ScoreViewer, toEnginePageWidth } from '../score/viewer'
import { LocalScoreFilePicker } from './LocalScoreFilePicker'

/** The page decides how tall the sheet is; the viewer only fills it and scrolls inside. */
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
  | { status: 'ready'; fileName: string; svgPages: string[]; audioUrl: string; cursor: TimelineCursor; timelineSeconds: number }

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
  const engineRef = useRef<ScoreEngine | null>(null)
  /** Frees what this attempt holds: the effect's cleanup and a refusal from the viewer both call it. */
  const releaseRef = useRef<() => void>(() => {})
  const pageWidth = useRef(MIN_ENGINE_PAGE_WIDTH)
  const ready = state.status === 'ready' ? state : undefined
  const clock = usePlaybackClock(ready?.audioUrl)
  useScoreSync(clock, viewerRoot, ready?.cursor ?? null)

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
        const timeline = parseTimemap(loaded.timemap, loaded.aliases)
        // The sheet may have reported its real width while the engine was busy; draw at that width before showing it.
        const svgPages = pageWidth.current === loadWidth ? loaded.svgPages : relayoutOr(engine, pageWidth.current, loaded.svgPages)
        engineRef.current = engine
        setState({
          status: 'ready',
          fileName: score.fileName,
          svgPages,
          audioUrl,
          cursor: createTimelineCursor(timeline),
          timelineSeconds: timeline.duration,
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

  if (state.status === 'failed') {
    return (
      <>
        <div style={{ marginTop: spacing.lg }}>
          <ScoreViewer status="error" svgPages={[]} title={title} onRetry={onRetry} />
        </div>
        {fallback}
      </>
    )
  }

  const warning = ready && misalignmentNote(clock.duration, ready.timelineSeconds)
  return (
    <div style={{ marginTop: spacing.lg }}>
      <div ref={setViewerRoot} style={{ height: SHEET_FRAME_HEIGHT }}>
        {ready ? (
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
        ) : (
          <ScoreViewer status="loading" svgPages={[]} title={title} onWidthChange={onWidthChange} />
        )}
      </div>
      {warning && <Alert type="warning" showIcon title={warning} style={{ marginTop: spacing.md }} />}
      {ready && <PlaybackControls clock={clock} title={title} />}
    </div>
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
