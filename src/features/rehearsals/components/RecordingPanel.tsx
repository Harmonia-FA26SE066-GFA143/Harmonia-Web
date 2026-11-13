import { AudioOutlined, BorderOutlined, DeleteOutlined } from '@ant-design/icons'
import { App, Button, Flex, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { clock } from '@/shared/utils/media'
import { saveFile } from '@/shared/utils/saveFile'
import { colors, spacing } from '@/styles/tokens'
import { useCreateRecording, useDeleteRecording, useRecordings } from '../hooks/useRehearsals'
import { rehearsalErrorMessage } from '../rehearsalErrors'

export interface RecordingPanelProps {
  /** Absent in the demo room: recording is off. */
  rehearsalId?: string
  songId: string
  songTitle: string
}

/** A recorded take with the song it belongs to, which may no longer be the one shown. */
interface Take {
  file: File
  songId: string
  songTitle: string
  durationSeconds: number
}

/** Just under the backend's 20 MB (RehearsalRecordingService.MaxAudioSizeBytes), leaving room for the last chunk. */
const stopAtBytes = 19 * 1024 * 1024

const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`

const canRecord = () => typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

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
  const [recordedBytes, setRecordedBytes] = useState(0)
  const [unsaved, setUnsaved] = useState<Take>()

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

  // A take that could not be saved stays on the page, to save again or keep as a file: it cannot be sung again.
  const upload = (take: Take) =>
    create.mutate(
      { file: take.file, songId: take.songId, durationSeconds: take.durationSeconds },
      {
        onSuccess: () => {
          setUnsaved(undefined)
          message.success(`Đã lưu bản thu “${take.songTitle}”.`)
        },
        onError: (error) => {
          setUnsaved(take)
          message.error(rehearsalErrorMessage(error, 'Không thể lưu bản thu. Bản thu vẫn còn trên trang này.'))
        },
      },
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
    let bytes = 0
    media.ondataavailable = (event) => {
      chunks.push(event.data)
      bytes += event.data.size
      setRecordedBytes(bytes)
      // A take the server would refuse cannot be sung again: stop while it still fits.
      if (bytes >= stopAtBytes && media.state === 'recording') {
        message.warning('Bản thu đã gần 20 MB nên được dừng và lưu. Hãy thu tiếp thành một bản mới.')
        media.stop()
      }
    }
    media.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      setStartedAt(undefined)
      if (!media.ondataavailable) return
      const type = media.mimeType || 'audio/webm'
      const extension = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm'
      const file = new File(chunks, `ban-thu-${dayjs().format('YYYYMMDD-HHmmss')}.${extension}`, { type })
      upload({ file, songId, songTitle, durationSeconds: Math.round((Date.now() - began) / 1000) })
    }
    recorder.current = media
    // A chunk a second, so the size is known while recording.
    media.start(1000)
    setRecordedBytes(0)
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
            Dừng và lưu ({clock(elapsed)} · {megabytes(recordedBytes)})
          </Button>
        ) : (
          // One take at a time: a new one would replace the take still waiting to be saved.
          <Button icon={<AudioOutlined />} onClick={start} disabled={unavailable || unsaved !== undefined} loading={create.isPending}>
            Thu âm
          </Button>
        )}
        {rehearsalId && !canRecord() && (
          <Typography.Text type="secondary">Trình duyệt này không ghi âm được. Hãy dùng Chrome, Edge hoặc Firefox.</Typography.Text>
        )}
        {recording && <Typography.Text type="secondary" role="status">Đang thu “{songTitle}”…</Typography.Text>}
      </Flex>
      {unsaved && (
        <Flex wrap align="center" gap={spacing.sm} role="alert" style={{ marginTop: spacing.sm }}>
          <Typography.Text type="danger">
            Bản thu “{unsaved.songTitle}” ({megabytes(unsaved.file.size)}) chưa lưu được.
          </Typography.Text>
          <Button type="primary" onClick={() => upload(unsaved)} loading={create.isPending}>
            Lưu lại
          </Button>
          <Button onClick={() => saveFile(unsaved.file, unsaved.file.name)}>Tải về máy</Button>
          <Button type="text" danger onClick={() => setUnsaved(undefined)} disabled={create.isPending}>
            Bỏ bản thu
          </Button>
        </Flex>
      )}
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
                  {take.durationSeconds ? ` · ${clock(take.durationSeconds)}` : ''}
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
