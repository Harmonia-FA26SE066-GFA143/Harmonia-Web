import { CaretRightFilled, PauseOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Flex, Slider, Tooltip, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { clock as formatTime } from '@/shared/utils/media'
import { colors, sizes, spacing } from '@/styles/tokens'
import type { PlaybackClock } from '../clock/usePlaybackClock'
import { SEEK_STEP } from './useScoreShortcuts'
import './PlaybackControls.css'

/** "44:44 / 44:44", the widest label, measures 101px in Be Vietnam Pro at the body size ("11:11 / 11:11" 65px). */
const TIME_LABEL_WIDTH = 104

const mmss = (seconds: number) => formatTime(seconds).padStart(5, '0')

function playLabel(playing: boolean, finished: boolean) {
  if (playing) return 'Tạm dừng'
  return finished ? 'Phát lại' : 'Phát'
}

function playIcon(playing: boolean, finished: boolean) {
  if (playing) return <PauseOutlined />
  return finished ? <ReloadOutlined /> : <CaretRightFilled />
}

/** Play/pause, position slider and time. React state changes once per second of playback, not per frame. */
export function PlaybackControls({ clock, title }: Readonly<{ clock: PlaybackClock; title: string }>) {
  const { playing, duration, error, play, pause, seek, getTime, subscribe } = clock
  // The state only asks for a render (once per second of playback, or on a seek); what is shown is always read from the
  // clock, so pausing, resuming or the end of the song never shows an older tick.
  const [, setRenderedAt] = useState(0)
  const shownSecond = useRef(0)

  useEffect(
    () =>
      subscribe((seconds) => {
        if (Math.floor(seconds) === shownSecond.current) return
        shownSecond.current = Math.floor(seconds)
        setRenderedAt(seconds)
      }),
    [subscribe],
  )

  const time = getTime()
  const finished = !playing && duration > 0 && time >= duration
  const label = playLabel(playing, finished)

  return (
    <div style={{ marginTop: spacing.md }}>
      {error && (
        <Typography.Paragraph role="alert" style={{ color: colors.primaryHover, margin: `0 0 ${spacing.sm}px` }}>
          Không thể phát âm thanh. Vui lòng thử lại hoặc chọn tệp khác.
        </Typography.Paragraph>
      )}
      <Flex align="center" gap={spacing.md} style={{ minHeight: sizes.controlHeight }}>
        <Tooltip title={`${label} (Space). ← → lùi hoặc tiến ${SEEK_STEP} giây, Home về đầu.`}>
          <Button
            type="primary"
            shape="circle"
            icon={playIcon(playing, finished)}
            aria-label={`${label} ${title}`}
            aria-keyshortcuts="Space ArrowLeft ArrowRight Home"
            onClick={() => {
              if (playing) pause()
              else void play()
            }}
          />
        </Tooltip>
        <Slider
          className="hm-playback-slider"
          min={0}
          max={duration}
          step={0.01}
          value={Math.min(time, duration)}
          disabled={duration <= 0}
          onChange={(seconds) => {
            seek(seconds)
            shownSecond.current = Math.floor(getTime())
            setRenderedAt(getTime())
          }}
          tooltip={{ formatter: (seconds) => mmss(seconds ?? 0) }}
          ariaLabelForHandle={`Vị trí phát ${title}`}
          ariaValueTextFormatterForHandle={(seconds) => `${mmss(seconds)} trên ${mmss(duration)}`}
          style={{ flex: 1, minWidth: 120, marginBlock: 0 }}
        />
        {/* Be Vietnam Pro has no tabular figures (DESIGN.md, Proportional Figures Rule): a fixed, right-aligned cell
            keeps the slider from moving as the digits change. */}
        <Typography.Text type="secondary" style={{ flexShrink: 0, minWidth: TIME_LABEL_WIDTH, textAlign: 'right' }}>
          {mmss(time)} / {mmss(duration)}
        </Typography.Text>
      </Flex>
    </div>
  )
}
