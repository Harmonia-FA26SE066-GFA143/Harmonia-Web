import { AudioOutlined, BorderOutlined, DeleteOutlined } from '@ant-design/icons'
import { App, Button, Flex, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { colors, spacing } from '@/styles/tokens'
import { useCreateRecording, useDeleteRecording, useRecordings } from '../hooks/useRehearsals'
import { rehearsalErrorMessage } from '../rehearsalErrors'

export interface RecordingPanelProps {
  /** Absent in the demo room: recording is off. */
  rehearsalId?: string
  songId: string
  songTitle: string
}

const canRecord = () => typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

const duration = (seconds?: number) =>
  seconds === undefined ? undefined : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/**
 * Records a take of the selected song with the browser microphone and keeps it on the rehearsal (BE 90af733, B43:
 * `POST /api/rehearsals/{id}/recordings`); members of the rehearsal's choir listen on mobile. Each song lists its takes,
 * newest first, to play back or delete.
 */
export function RecordingPanel({ rehearsalId, songId, songTitle }: Readonly<RecordingPanelProps>) {
  const { message, modal } = App.useApp()
  const recordings = useRecordings(rehearsalId)
  const create = useCreateRecording(rehearsalId ?? '')
  const remove = useDeleteRecording(rehearsalId ?? '')
  const recorder = useRef<MediaRecorder>(null)
  const [startedAt, setStartedAt] = useState<number>()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startedAt === undefined) return
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(timer)
  }, [startedAt])

  // Leaving the page or the song while recording stops it and releases the microphone; nothing is uploaded.
  useEffect(
    () => () => {
      if (recorder.current?.state === 'recording') {
        recorder.current.ondataavailable = null
        recorder.current.stop()
      }
    },
    [songId],
  )

  const start = async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      message.error('Không dùng được micro. Hãy cho phép trình duyệt truy cập micro rồi thử lại.')
      return
    }
    const chunks: Blob[] = []
    const media = new MediaRecorder(stream)
    const began = Date.now()
    media.ondataavailable = (event) => chunks.push(event.data)
    media.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      setStartedAt(undefined)
      if (!media.ondataavailable) return
      const type = media.mimeType || 'audio/webm'
      const extension = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm'
      const file = new File(chunks, `ban-thu-${dayjs().format('YYYYMMDD-HHmmss')}.${extension}`, { type })
      create.mutate(
        { file, songId, durationSeconds: Math.round((Date.now() - began) / 1000) },
        {
          onSuccess: () => message.success(`Đã lưu bản thu “${songTitle}”.`),
          onError: (error) => message.error(rehearsalErrorMessage(error, 'Không thể lưu bản thu. Vui lòng thử lại.')),
        },
      )
    }
    recorder.current = media
    media.start()
    setElapsed(0)
    setStartedAt(began)
  }

  const handleDelete = (id: string, name: string) =>
    modal.confirm({
      title: `Xoá ${name}?`,
      content: 'Ca viên sẽ không nghe được bản thu này nữa.',
      okText: 'Xoá bản thu',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      autoFocusButton: 'cancel',
      onOk: () =>
        remove
          .mutateAsync(id)
          .then(() => message.success('Đã xoá bản thu.'))
          .catch((error: Error) => message.error(rehearsalErrorMessage(error, 'Không thể xoá bản thu. Vui lòng thử lại.'))),
    })

  const recording = startedAt !== undefined
  const takes = (recordings.data ?? []).filter((take) => take.songId === songId).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
  const unavailable = !rehearsalId || !canRecord()

  return (
    <section aria-label={`Bản thu của ${songTitle}`} style={{ marginTop: spacing.md }}>
      <Flex wrap gap={spacing.sm} align="center">
        {recording ? (
          <Button danger icon={<BorderOutlined />} onClick={() => recorder.current?.stop()}>
            Dừng và lưu ({duration(elapsed)})
          </Button>
        ) : (
          <Button icon={<AudioOutlined />} onClick={start} disabled={unavailable} loading={create.isPending}>
            Thu âm
          </Button>
        )}
        {rehearsalId && !canRecord() && (
          <Typography.Text type="secondary">Trình duyệt này không ghi âm được. Hãy dùng Chrome, Edge hoặc Firefox.</Typography.Text>
        )}
        {recording && <Typography.Text type="secondary" role="status">Đang thu “{songTitle}”…</Typography.Text>}
      </Flex>
      {rehearsalId && recordings.isError && (
        <Flex align="center" gap={spacing.sm} style={{ marginTop: spacing.sm }}>
          <Typography.Text type="danger">Không thể tải các bản thu.</Typography.Text>
          <Button onClick={() => recordings.refetch()} loading={recordings.isFetching}>
            Thử lại
          </Button>
        </Flex>
      )}
      {takes.length > 0 && (
        <ol style={{ listStyle: 'none', margin: `${spacing.sm}px 0 0`, padding: 0 }}>
          {takes.map((take, index) => (
            <li key={take.id} style={{ padding: `${spacing.sm}px 0`, borderTop: `1px solid ${colors.border}` }}>
              <Flex wrap align="center" gap={spacing.sm}>
                <Typography.Text style={{ minWidth: 160, fontVariantNumeric: 'tabular-nums' }}>
                  {take.title ?? `Bản thu ${takes.length - index}`} · {dayjs(parseUtc(take.createdAt)).format('DD/MM HH:mm')}
                  {take.durationSeconds ? ` · ${duration(take.durationSeconds)}` : ''}
                </Typography.Text>
                <audio controls preload="none" src={take.audioUrl} aria-label={`Nghe bản thu ${takes.length - index} của ${songTitle}`} style={{ height: 40, flex: '1 1 240px' }} />
                <Tooltip title="Xoá bản thu" trigger={['hover', 'focus']}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`Xoá bản thu ${takes.length - index} của ${songTitle}`}
                    onClick={() => handleDelete(take.id, `bản thu ${takes.length - index} của “${songTitle}”`)}
                  />
                </Tooltip>
              </Flex>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
