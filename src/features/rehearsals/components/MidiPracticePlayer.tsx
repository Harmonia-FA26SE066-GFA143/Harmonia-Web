import { CaretRightFilled, PauseOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Flex, Skeleton, Slider, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  playbackInstrumentLabels,
  useMaterialPlayback,
  type MidiPlaybackNote,
  type MidiPlaybackNotes,
} from '@/features/music-library'
import { ApiError } from '@/lib/api/errors'
import { clock } from '@/shared/utils/media'
import { ErrorState } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'

const canvasHeight = 300
const visibleSeconds = 12
const pastSeconds = 3
const pitchGutter = 48

function lowerBound(notes: MidiPlaybackNote[], time: number) {
  let low = 0
  let high = notes.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (notes[middle].start < time) low = middle + 1
    else high = middle
  }
  return low
}

const pitchName = (pitch: number) => `C${Math.floor(pitch / 12) - 1}`

function drawPianoRoll(
  canvas: HTMLCanvasElement,
  score: MidiPlaybackNotes,
  currentTime: number,
  maxNoteDuration: number,
) {
  const context = canvas.getContext('2d')
  if (!context) return

  const width = Math.max(640, Math.round(canvas.clientWidth || 0))
  const ratio = window.devicePixelRatio || 1
  const pixelWidth = Math.round(width * ratio)
  const pixelHeight = Math.round(canvasHeight * ratio)
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, canvasHeight)
  context.fillStyle = colors.ivory
  context.fillRect(0, 0, width, canvasHeight)

  const plotWidth = width - pitchGutter
  const visibleStart = Math.max(0, currentTime - pastSeconds)
  const visibleEnd = visibleStart + visibleSeconds
  const pitchCount = Math.max(1, score.maxPitch - score.minPitch + 1)
  const rowHeight = canvasHeight / pitchCount
  const xAt = (seconds: number) => pitchGutter + ((seconds - visibleStart) / visibleSeconds) * plotWidth
  const yAt = (pitch: number) => (score.maxPitch - pitch) * rowHeight

  context.font = `${typography.metadata.fontSize}px ${typography.fontFamily}`
  context.textBaseline = 'top'
  for (let second = Math.ceil(visibleStart); second <= visibleEnd; second += 1) {
    const x = xAt(second)
    context.strokeStyle = second % 4 === 0 ? colors.mutedBorder : colors.border
    context.lineWidth = second % 4 === 0 ? 1.25 : 1
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, canvasHeight)
    context.stroke()
    if (second < visibleEnd) {
      context.fillStyle = colors.textMuted
      context.fillText(clock(second), x + 4, 4)
    }
  }

  for (let pitch = score.minPitch; pitch <= score.maxPitch; pitch += 1) {
    if (pitch % 12 !== 0) continue
    const y = yAt(pitch)
    context.strokeStyle = colors.border
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(pitchGutter, y)
    context.lineTo(width, y)
    context.stroke()
    context.fillStyle = colors.textMuted
    context.fillText(pitchName(pitch), 8, Math.max(2, y + 2))
  }

  const first = lowerBound(score.notes, visibleStart - maxNoteDuration)
  for (let index = first; index < score.notes.length; index += 1) {
    const note = score.notes[index]
    if (note.start > visibleEnd) break
    const noteEnd = note.start + note.duration
    if (noteEnd < visibleStart) continue
    const active = note.start <= currentTime && currentTime < noteEnd
    const x = Math.max(pitchGutter, xAt(note.start))
    const endX = Math.min(width, xAt(noteEnd))
    const y = yAt(note.pitch)
    context.globalAlpha = active ? 1 : Math.min(0.72, 0.36 + (note.velocity / 127) * 0.28)
    context.fillStyle = active ? colors.primaryHover : colors.primary
    const noteWidth = Math.max(2, endX - x)
    const noteHeight = Math.max(3, rowHeight - 2)
    context.fillRect(x, y + 1, noteWidth, noteHeight)
    if (active) {
      // A white outline distinguishes the current notes by shape as well as colour.
      context.strokeStyle = colors.surface
      context.lineWidth = 2
      context.strokeRect(x, y + 1, noteWidth, noteHeight)
    }
  }
  context.globalAlpha = 1

  const playheadX = xAt(currentTime)
  context.strokeStyle = colors.primaryHover
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(playheadX, 0)
  context.lineTo(playheadX, canvasHeight)
  context.stroke()

  context.fillStyle = colors.surface
  context.fillRect(0, 0, pitchGutter, canvasHeight)
  context.strokeStyle = colors.mutedBorder
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(pitchGutter, 0)
  context.lineTo(pitchGutter, canvasHeight)
  context.stroke()
  for (let pitch = score.minPitch; pitch <= score.maxPitch; pitch += 1) {
    if (pitch % 12 !== 0) continue
    context.fillStyle = colors.textMuted
    context.fillText(pitchName(pitch), 8, Math.max(2, yAt(pitch) + 2))
  }
}

function playbackDescription(error: Error) {
  if (error instanceof ApiError && error.code === 'MATERIAL_PLAYBACK_UNAVAILABLE') {
    return 'Bản MIDI này được tải lên trước khi có trình phát. Vui lòng thay lại tệp MIDI trong kho bài hát để tạo bản phát.'
  }
  if (error instanceof ApiError && error.code === 'MATERIAL_NOT_FOUND') {
    return 'Bản MIDI không còn tồn tại. Vui lòng chọn tài liệu khác.'
  }
  return undefined
}

function SynchronizedPlayer({ title, score, audioUrl, durationSeconds }: Readonly<{
  title: string
  score: MidiPlaybackNotes
  audioUrl: string
  durationSeconds: number
}>) {
  const audio = useRef<HTMLAudioElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const frame = useRef<number | undefined>(undefined)
  const time = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioFailed, setAudioFailed] = useState(false)
  const duration = Math.max(durationSeconds, score.durationSeconds)
  const maxNoteDuration = useMemo(
    () => score.notes.reduce((longest, note) => Math.max(longest, note.duration), 0),
    [score.notes],
  )

  useEffect(() => {
    const tick = () => {
      if (audio.current) {
        time.current = audio.current.currentTime
        setCurrentTime(time.current)
      }
      frame.current = requestAnimationFrame(tick)
    }
    if (playing) frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    }
  }, [playing])

  useEffect(() => {
    if (canvas.current) drawPianoRoll(canvas.current, score, currentTime, maxNoteDuration)
  }, [currentTime, maxNoteDuration, score])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const observer = new ResizeObserver(() => drawPianoRoll(element, score, time.current, maxNoteDuration))
    observer.observe(element)
    return () => observer.disconnect()
  }, [maxNoteDuration, score])

  const toggle = async () => {
    const element = audio.current
    if (!element) return
    if (!element.paused) {
      element.pause()
      return
    }
    if (element.ended) element.currentTime = 0
    try {
      await element.play()
    } catch {
      setAudioFailed(true)
    }
  }

  const seek = (seconds: number) => {
    if (audio.current) audio.current.currentTime = seconds
    time.current = seconds
    setCurrentTime(seconds)
  }

  return (
    <div>
      <Flex justify="space-between" align="baseline" wrap gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: typography.cardHeading.fontSize }}>
          Bản nốt đồng bộ
        </Typography.Title>
        <Typography.Text type="secondary">
          {score.notes.length.toLocaleString('vi-VN')} nốt · {score.tracks.length} track
        </Typography.Text>
      </Flex>
      <div
        style={{ border: `1px solid ${colors.border}`, borderRadius: radius.lg, overflow: 'hidden', background: colors.ivory }}
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label={`Bản nốt MIDI của ${title}. Đường dọc màu đỏ sẫm chỉ vị trí đang phát.`}
          style={{ display: 'block', width: '100%', height: canvasHeight }}
        />
      </div>
      <audio
        ref={audio}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setAudioFailed(true)}
      />
      {audioFailed && (
        <Typography.Paragraph role="alert" style={{ color: colors.primaryHover, margin: `${spacing.sm}px 0 0` }}>
          Không thể phát bản MIDI. Vui lòng tải lại bản phát rồi thử lại.
        </Typography.Paragraph>
      )}
      <Flex align="center" gap={spacing.md} style={{ marginTop: spacing.md }}>
        <Button
          type="primary"
          shape="circle"
          icon={playing ? <PauseOutlined /> : <CaretRightFilled />}
          onClick={() => void toggle()}
          disabled={audioFailed}
          aria-label={`${playing ? 'Tạm dừng' : 'Phát'} ${title}`}
        />
        <Slider
          min={0}
          max={duration}
          step={0.01}
          value={Math.min(currentTime, duration)}
          onChange={seek}
          tooltip={{ formatter: (value) => clock(value ?? 0) }}
          aria-label={`Vị trí phát ${title}`}
          style={{ flex: 1, minWidth: 120 }}
        />
        <Typography.Text type="secondary" style={{ flexShrink: 0 }}>
          {clock(currentTime)} / {clock(duration)}
        </Typography.Text>
      </Flex>
    </div>
  )
}

export function MidiPracticePlayer({ materialId, title }: Readonly<{ materialId: string; title: string }>) {
  const playback = useMaterialPlayback(materialId)

  if (playback.isPending) return <Skeleton active paragraph={{ rows: 8 }} title={{ width: '28%' }} />
  if (playback.isError) {
    return (
      <ErrorState
        headingLevel={3}
        title="Không thể tải bản MIDI"
        description={playbackDescription(playback.error)}
        error={playback.error}
        onRetry={() => playback.refetch()}
        retrying={playback.isFetching}
      />
    )
  }

  return (
    <div>
      <Flex wrap gap={spacing.sm} justify="space-between" style={{ marginBottom: spacing.md }}>
        <Typography.Text type="secondary">
          Âm sắc {playbackInstrumentLabels[playback.data.playback.instrument]}. Nốt sáng lên theo âm thanh đang phát.
        </Typography.Text>
        <Button size="small" icon={<ReloadOutlined />} loading={playback.isFetching} onClick={() => playback.refetch()}>
          Tải lại bản phát
        </Button>
      </Flex>
      <SynchronizedPlayer
        key={playback.data.playback.audioUrl}
        title={title}
        score={playback.data.notes}
        audioUrl={playback.data.playback.audioUrl}
        durationSeconds={playback.data.playback.durationSeconds}
      />
    </div>
  )
}
