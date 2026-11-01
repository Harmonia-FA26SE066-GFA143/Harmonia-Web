import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { App, Button, Flex, Typography } from 'antd'
import { useRef, useState } from 'react'
import { colors, spacing, typography } from '@/styles/tokens'
import { useFetchSubmission } from '../hooks/usePractice'
import { formatDuration } from '../practiceFormat'
import type { PracticeSubmission } from '../types'

export interface InlinePlayerProps {
  submission: PracticeSubmission
  /** The playing position in seconds, so a comment can name the moment it is about. */
  onTime: (seconds: number) => void
}

/**
 * Plays a recording in its row (brief §12.8). The signed URL expires, so the submission is read again on the first
 * play; Space on the focused button plays and pauses, and starting one recording pauses any other.
 */
export function InlinePlayer({ submission, onTime }: Readonly<InlinePlayerProps>) {
  const { message } = App.useApp()
  const fetchSubmission = useFetchSubmission()
  const audio = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle')
  const [time, setTime] = useState(0)
  const playing = state === 'playing'

  const toggle = async () => {
    const element = audio.current
    if (!element) return
    if (playing) return element.pause()
    if (state === 'idle') {
      setState('loading')
      try {
        element.src = (await fetchSubmission(submission.id)).audioUrl
      } catch {
        setState('idle')
        return message.error('Không thể tải bản thu. Vui lòng thử lại.')
      }
    }
    document.querySelectorAll('audio').forEach((other) => other !== element && other.pause())
    element.play().catch(() => {
      setState('idle')
      message.error('Không thể phát bản thu. Vui lòng thử lại.')
    })
  }

  return (
    <Flex align="center" gap={spacing.sm}>
      <Button
        icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        loading={state === 'loading'}
        onClick={toggle}
        aria-label={`${playing ? 'Tạm dừng' : 'Nghe'} bản thu của ${submission.memberName}`}
      >
        {playing ? 'Tạm dừng' : 'Nghe'}
      </Button>
      <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize, whiteSpace: 'nowrap' }}>
        {formatDuration(Math.floor(time))} / {formatDuration(submission.durationSeconds)}
      </Typography.Text>
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setState('playing')}
        onPause={() => setState('paused')}
        onTimeUpdate={(event) => {
          setTime(event.currentTarget.currentTime)
          onTime(event.currentTarget.currentTime)
        }}
      />
    </Flex>
  )
}
