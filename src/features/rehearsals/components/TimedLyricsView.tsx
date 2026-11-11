import { Button, Flex, Typography } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import { timedLinePhase, useTimedLyrics, type SongMaterial } from '@/features/music-library'
import { spacing, typography } from '@/styles/tokens'
import type { PlaybackClock } from '../score/clock/usePlaybackClock'

/**
 * Lyrics timed line by line against the audio being played (`/api/music-materials/{id}/timed-lyrics`). A different
 * source from the note-by-note lyrics inside a MusicXML score, which `useLyricSync` lights on the sheet.
 * `untimed` is what shows when this audio has no timing.
 */
export function TimedLyricsView({
  material,
  clock,
  onStale,
  untimed = null,
}: Readonly<{
  material: SongMaterial
  clock: Pick<PlaybackClock, 'getTime' | 'subscribe'>
  /** The timing belongs to a newer file than the material list knows: the list should be read again. */
  onStale?: () => void
  untimed?: ReactNode
}>) {
  const timing = useTimedLyrics(material.id, material.fileRevision)
  const stale = timing.data != null && timing.data.audioRevision !== material.fileRevision
  const lines = timing.data && !stale ? timing.data.lines : undefined
  const { getTime, subscribe } = clock
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (stale) onStale?.()
  }, [stale, onStale])

  useEffect(() => {
    if (!lines) return
    const update = (seconds: number) => setPhase(timedLinePhase(lines, seconds))
    update(getTime())
    return subscribe(update)
  }, [getTime, lines, subscribe])

  if (timing.isPending) return <Typography.Text type="secondary" style={{ display: 'block', marginTop: spacing.md }}>Đang tải lời theo thời gian…</Typography.Text>
  if (timing.isError) {
    return (
      <Flex align="center" gap={spacing.sm} style={{ marginTop: spacing.md }}>
        <Typography.Text type="secondary">Không tải được lời theo thời gian.</Typography.Text>
        <Button size="small" loading={timing.isFetching} onClick={() => timing.refetch()}>Thử lại</Button>
      </Flex>
    )
  }
  if (stale) return <Typography.Text type="secondary" style={{ display: 'block', marginTop: spacing.md }}>Đang cập nhật lời theo bản âm thanh mới…</Typography.Text>
  if (!lines) return untimed

  const index = Math.floor(phase / 2)
  const sounding = phase >= 0 && phase % 2 === 1 ? lines[index] : undefined
  // Before the first line nothing is next; while a line sounds the one after it is, between lines the coming one.
  const nextIndex = sounding ? index + 1 : index
  const nextLine = phase < 0 ? undefined : lines[nextIndex]
  return (
    <section aria-label="Lời theo mốc thời gian của âm thanh" style={{ marginTop: spacing.md, textAlign: 'center' }}>
      <Typography.Text type="secondary" style={{ fontSize: typography.metadata.fontSize, color: 'inherit', opacity: 0.72 }}>
        Lời theo mốc thời gian
      </Typography.Text>
      <p aria-live="off" style={{ margin: `${spacing.xs}px 0 0`, minHeight: '1.3em', fontFamily: typography.displayFontFamily, ...typography.pageTitle }}>
        {sounding?.text}
      </p>
      <p style={{ margin: 0, minHeight: '1.6em', opacity: 0.72 }}>{nextLine?.text}</p>
    </section>
  )
}
