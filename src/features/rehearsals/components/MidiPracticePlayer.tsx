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
import { usePlaybackClock } from '../score/clock/usePlaybackClock'

const canvasHeight = 300
const visibleSeconds = 12
const pastSeconds = 3
const pitchGutter = 48
const midiPlaybackError = 'Không thể phát bản MIDI. Vui lòng tải lại bản phát rồi thử lại.'

interface PianoRollGeometry {
  width: number
  visibleStart: number
  visibleEnd: number
  rowHeight: number
  xAt: (seconds: number) => number
  yAt: (pitch: number) => number
}

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

function prepareCanvas(
  canvas: HTMLCanvasElement,
  score: MidiPlaybackNotes,
  currentTime: number,
): { context: CanvasRenderingContext2D; geometry: PianoRollGeometry } | undefined {
  const context = canvas.getContext('2d')
  if (!context) return undefined

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
  return { context, geometry: { width, visibleStart, visibleEnd, rowHeight, xAt, yAt } }
}

function drawTimeGrid(context: CanvasRenderingContext2D, geometry: PianoRollGeometry) {
  for (let second = Math.ceil(geometry.visibleStart); second <= geometry.visibleEnd; second += 1) {
    const x = geometry.xAt(second)
    context.strokeStyle = second % 4 === 0 ? colors.mutedBorder : colors.border
    context.lineWidth = second % 4 === 0 ? 1.25 : 1
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, canvasHeight)
    context.stroke()
    if (second < geometry.visibleEnd) {
      context.fillStyle = colors.textMuted
      context.fillText(clock(second), x + 4, 4)
    }
  }
}

function drawPitchGrid(context: CanvasRenderingContext2D, score: MidiPlaybackNotes, geometry: PianoRollGeometry) {
  for (let pitch = score.minPitch; pitch <= score.maxPitch; pitch += 1) {
    if (pitch % 12 !== 0) continue
    const y = geometry.yAt(pitch)
    context.strokeStyle = colors.border
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(pitchGutter, y)
    context.lineTo(geometry.width, y)
    context.stroke()
  }
}

function drawNotes(
  context: CanvasRenderingContext2D,
  score: MidiPlaybackNotes,
  currentTime: number,
  maxNoteDuration: number,
  geometry: PianoRollGeometry,
) {
  const first = lowerBound(score.notes, geometry.visibleStart - maxNoteDuration)
  for (let index = first; index < score.notes.length; index += 1) {
    const note = score.notes[index]
    if (note.start > geometry.visibleEnd) break
    const noteEnd = note.start + note.duration
    if (noteEnd < geometry.visibleStart) continue
    const active = note.start <= currentTime && currentTime < noteEnd
    const x = Math.max(pitchGutter, geometry.xAt(note.start))
    const endX = Math.min(geometry.width, geometry.xAt(noteEnd))
    const y = geometry.yAt(note.pitch)
    context.globalAlpha = active ? 1 : Math.min(0.72, 0.36 + (note.velocity / 127) * 0.28)
    context.fillStyle = active ? colors.primaryHover : colors.primary
    const noteWidth = Math.max(2, endX - x)
    const noteHeight = Math.max(3, geometry.rowHeight - 2)
    context.fillRect(x, y + 1, noteWidth, noteHeight)
    if (active) {
      // A white outline distinguishes the current notes by shape as well as colour.
      context.strokeStyle = colors.surface
      context.lineWidth = 2
      context.strokeRect(x, y + 1, noteWidth, noteHeight)
    }
  }
  context.globalAlpha = 1
}

function drawPlayhead(context: CanvasRenderingContext2D, currentTime: number, geometry: PianoRollGeometry) {
  const playheadX = geometry.xAt(currentTime)
  context.strokeStyle = colors.primaryHover
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(playheadX, 0)
  context.lineTo(playheadX, canvasHeight)
  context.stroke()
}

function drawPitchGutter(context: CanvasRenderingContext2D, score: MidiPlaybackNotes, geometry: PianoRollGeometry) {
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
    context.fillText(pitchName(pitch), 8, Math.max(2, geometry.yAt(pitch) + 2))
  }
}

function drawPianoRoll(
  canvas: HTMLCanvasElement,
  score: MidiPlaybackNotes,
  currentTime: number,
  maxNoteDuration: number,
) {
  const prepared = prepareCanvas(canvas, score, currentTime)
  if (!prepared) return
  const { context, geometry } = prepared
  drawTimeGrid(context, geometry)
  drawPitchGrid(context, score, geometry)
  drawNotes(context, score, currentTime, maxNoteDuration, geometry)
  drawPlayhead(context, currentTime, geometry)
  drawPitchGutter(context, score, geometry)
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
  const canvas = useRef<HTMLCanvasElement>(null)
  const time = useRef(0)
  const displayedSecond = useRef(0)
  const [currentTime, setCurrentTime] = useState(0)
  const fallbackDuration = Math.max(durationSeconds, score.durationSeconds)
  const { playing, duration, error, play, pause, seek: seekPlayback, getTime, subscribe } =
    usePlaybackClock(audioUrl, fallbackDuration)
  const maxNoteDuration = useMemo(
    () => score.notes.reduce((longest, note) => Math.max(longest, note.duration), 0),
    [score.notes],
  )

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const drawAt = (seconds: number) => {
      time.current = seconds
      drawPianoRoll(element, score, seconds, maxNoteDuration)
      const wholeSecond = Math.floor(seconds)
      if (wholeSecond !== displayedSecond.current) {
        displayedSecond.current = wholeSecond
        setCurrentTime(seconds)
      }
    }
    drawAt(getTime())
    return subscribe(drawAt)
  }, [getTime, maxNoteDuration, score, subscribe])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const observer = new ResizeObserver(() => drawPianoRoll(element, score, time.current, maxNoteDuration))
    observer.observe(element)
    return () => observer.disconnect()
  }, [maxNoteDuration, score])

  const toggle = async () => {
    if (playing) {
      pause()
      return
    }
    await play()
  }

  const seek = (seconds: number) => {
    seekPlayback(seconds)
    const actualTime = getTime()
    time.current = actualTime
    displayedSecond.current = Math.floor(actualTime)
    setCurrentTime(actualTime)
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
      <figure
        aria-label={`Bản nốt MIDI của ${title}. Đường dọc màu đỏ sẫm chỉ vị trí đang phát.`}
        style={{ margin: 0, border: `1px solid ${colors.border}`, borderRadius: radius.lg, overflow: 'hidden', background: colors.ivory }}
      >
        <canvas
          ref={canvas}
          aria-hidden="true"
          style={{ display: 'block', width: '100%', height: canvasHeight }}
        />
      </figure>
      {error && (
        <Typography.Paragraph role="alert" style={{ color: colors.primaryHover, margin: `${spacing.sm}px 0 0` }}>
          {midiPlaybackError}
        </Typography.Paragraph>
      )}
      <Flex align="center" gap={spacing.md} style={{ marginTop: spacing.md }}>
        <Button
          type="primary"
          shape="circle"
          icon={playing ? <PauseOutlined /> : <CaretRightFilled />}
          onClick={() => void toggle()}
          disabled={Boolean(error)}
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
