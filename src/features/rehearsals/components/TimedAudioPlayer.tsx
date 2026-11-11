import { Button, Flex, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { supportsTimedLyrics, type SongMaterial } from '@/features/music-library'
import { spacing } from '@/styles/tokens'
import { usePlaybackClock } from '../score/clock/usePlaybackClock'
import { PlaybackControls } from '../score/controls/PlaybackControls'
import { TimedLyricsView } from './TimedLyricsView'

/** A sample audio with its timed lyrics. `untimedLyrics` stays when it has none, or cannot hold a timing (RehearsalMaterial). */
export function TimedAudioPlayer({
  material,
  title,
  untimedLyrics,
  onStale,
}: Readonly<{ material: SongMaterial; title: string; untimedLyrics: ReactNode; onStale: () => void }>) {
  // The list is read again on window focus and every answer signs a new link: keep the one playing until it fails.
  const [src, setSrc] = useState(material.url ?? undefined)
  const clock = usePlaybackClock(src)
  if (clock.error && material.url && material.url !== src) setSrc(material.url)
  const untimed = <div className="karaoke-lyrics" aria-live="off">{untimedLyrics}</div>
  // The fieldset names the player as a group; its buttons say only the verb ("Phát …"), not "Phát Nghe …".
  return (
    <fieldset className="hm-plain-group" aria-label={`Nghe ${title}`}>
      {supportsTimedLyrics(material) ? <TimedLyricsView material={material} clock={clock} onStale={onStale} untimed={untimed} /> : untimed}
      <PlaybackControls clock={clock} title={title} />
      {/* The signed link may have expired while the page stayed open; a new list brings a new one. */}
      {clock.error && (
        <Flex align="center" gap={spacing.sm} style={{ marginTop: spacing.sm }}>
          <Typography.Text type="secondary">Liên kết âm thanh có thể đã hết hạn.</Typography.Text>
          <Button size="small" onClick={() => onStale()}>Tải lại liên kết</Button>
        </Flex>
      )}
    </fieldset>
  )
}
