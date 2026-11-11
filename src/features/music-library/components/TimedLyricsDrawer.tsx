import { CaretRightFilled, DeleteOutlined, FieldTimeOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, App, Button, Flex, Input, InputNumber, Select, Skeleton, Tooltip, Typography, type FormInstance } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { ErrorState, Form, FormDrawer } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { useDeleteTimedLyrics, useMaterialPlayback, useSaveTimedLyrics, useTimedLyrics } from '../hooks/useSongs'
import { timedLyricsErrorMessage } from '../songErrors'
import {
  lineEndProblem,
  lineStartProblem,
  lineTextProblem,
  MAX_TIMED_LINES,
  splitLyricsText,
  type TimedLineRow,
} from '../timedLyricsRules'
import { rendersPlayback, type SongMaterial } from '../types'

interface FormValues {
  lyricsMaterialId?: string
  lines: TimedLineRow[]
}

const rowColumns = '28px minmax(0, 1fr) 112px 32px 112px 32px 32px 32px'
const check = (problem: string | undefined) => (problem ? Promise.reject(new Error(problem)) : Promise.resolve())

/** Says which line the audio is on, from the form as it stands: the check before saving. */
function PreviewLine({ audio, form }: Readonly<{ audio: HTMLAudioElement | null; form: FormInstance<FormValues> }>) {
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (!audio) return
    const update = () => setTime(audio.currentTime)
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('seeked', update)
    return () => {
      audio.removeEventListener('timeupdate', update)
      audio.removeEventListener('seeked', update)
    }
  }, [audio])

  const rows: TimedLineRow[] = form.getFieldValue('lines') ?? []
  const line = rows.find((row) => row.startSeconds != null && row.endSeconds != null && row.startSeconds <= time && time < row.endSeconds)
  return (
    <Typography.Paragraph style={{ margin: `${spacing.sm}px 0 0`, minHeight: '1.6em' }}>
      <Typography.Text type="secondary">{time.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} giây · </Typography.Text>
      {line?.text ?? <Typography.Text type="secondary">Không có dòng nào ở thời điểm này</Typography.Text>}
    </Typography.Paragraph>
  )
}

function TimedLyricsEditor({ material, lyricsMaterials, form, initialValues, hasTiming, onSubmit, onDelete, deleting, submitProblem }: Readonly<{
  material: SongMaterial
  lyricsMaterials: SongMaterial[]
  form: FormInstance<FormValues>
  /** Read once when the form opens: a list read again must not overwrite what is being edited. */
  initialValues: FormValues
  hasTiming: boolean
  onSubmit: (values: FormValues) => void
  onDelete: () => void
  deleting: boolean
  submitProblem?: string
}>) {
  const { modal } = App.useApp()
  const rendered = rendersPlayback(material.fileName)
  // A MIDI or a score is timed against the WAV the server rendered from it, not against its own file.
  const playback = useMaterialPlayback(rendered ? material.id : undefined)
  const freshUrl = rendered ? playback.data?.playback.audioUrl : (material.url ?? undefined)
  // Every read signs a new link: keep the one being listened to until it fails.
  const [audioUrl, setAudioUrl] = useState(freshUrl)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [audioSeconds, setAudioSeconds] = useState<number>()
  const [audioFailed, setAudioFailed] = useState(false)
  if (freshUrl !== audioUrl && freshUrl && (!audioUrl || audioFailed)) {
    setAudioUrl(freshUrl)
    setAudioFailed(false)
  }
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopAt = useRef<number | undefined>(undefined)
  const chosenId = Form.useWatch('lyricsMaterialId', form)
  const chosenText = lyricsMaterials.find((lyrics) => lyrics.id === chosenId)?.lyricsText

  const markNow = (name: number, field: 'startSeconds' | 'endSeconds') => {
    if (audioRef.current) form.setFieldValue(['lines', name, field], Math.round(audioRef.current.currentTime * 100) / 100)
  }

  const playLine = (name: number) => {
    const row: TimedLineRow | undefined = form.getFieldValue(['lines', name])
    const player = audioRef.current
    if (!player || row?.startSeconds == null) return
    player.currentTime = row.startSeconds
    stopAt.current = row.endSeconds ?? undefined
    void player.play()
  }

  const fill = () => {
    const current: TimedLineRow[] = form.getFieldValue('lines') ?? []
    const apply = () => form.setFieldValue('lines', splitLyricsText(chosenText ?? '').map((text, index) => ({ ...current[index], text })))
    if (!current.some((row) => row.text?.trim())) return apply()
    modal.confirm({
      title: 'Thay lời của các dòng hiện có?',
      content: 'Lời các dòng sẽ được lấy lại từ tài liệu đã chọn. Mốc thời gian giữ nguyên theo thứ tự dòng.',
      okText: 'Thay lời',
      cancelText: 'Hủy',
      autoFocusButton: 'cancel',
      onOk: apply,
    })
  }

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={initialValues}
      onFinish={onSubmit}
      scrollToFirstError
    >
      <Typography.Paragraph type="secondary">
        Lời có mốc thời gian đi theo đúng bản âm thanh này. Khi thay tệp âm thanh, máy chủ sẽ xoá mốc và cần soạn lại. Lời nằm trong bản MusicXML sáng theo từng nốt và không đổi ở đây.
      </Typography.Paragraph>

      {audioUrl ? (
        <section aria-label="Nghe thử" style={{ marginBottom: spacing.md }}>
          <audio
            ref={(element) => {
              audioRef.current = element
              setAudio(element)
            }}
            src={audioUrl}
            controls
            preload="metadata"
            aria-label={`Nghe ${material.title}`}
            style={{ width: '100%' }}
            onLoadedMetadata={(event) => {
              setAudioFailed(false)
              if (Number.isFinite(event.currentTarget.duration)) setAudioSeconds(event.currentTarget.duration)
            }}
            onError={() => setAudioFailed(true)}
            onTimeUpdate={(event) => {
              if (stopAt.current !== undefined && event.currentTarget.currentTime >= stopAt.current) {
                stopAt.current = undefined
                event.currentTarget.pause()
              }
            }}
          />
          <PreviewLine audio={audio} form={form} />
        </section>
      ) : (
        rendered && playback.isPending && <Skeleton.Input active block style={{ marginBottom: spacing.md }} />
      )}
      {(audioFailed || playback.isError) && (
        <Alert
          type="warning"
          showIcon
          title="Không nghe thử được âm thanh. Liên kết có thể đã hết hạn."
          description="Bạn vẫn có thể nhập mốc bằng tay. Đóng rồi mở lại để lấy liên kết mới."
          style={{ marginBottom: spacing.md }}
        />
      )}

      <Form.Item name="lyricsMaterialId" label="Tài liệu lời" rules={[{ required: true, message: 'Vui lòng chọn tài liệu lời của bài hát.' }]}>
        <Select
          placeholder="Chọn tài liệu lời"
          options={lyricsMaterials.map((lyrics) => ({ value: lyrics.id, label: lyrics.title }))}
          notFoundContent="Bài hát chưa có tài liệu lời"
        />
      </Form.Item>
      {lyricsMaterials.length === 0 && (
        <Alert type="info" showIcon title="Bài hát chưa có tài liệu lời. Vui lòng thêm lời trong nhóm Lời trước khi soạn mốc." style={{ marginBottom: spacing.md }} />
      )}

      <Flex justify="space-between" align="center" gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: typography.cardHeading.fontSize }}>Các dòng</Typography.Title>
        {chosenText && <Button onClick={fill}>Điền dòng từ lời đã chọn</Button>}
      </Flex>

      <Form.List name="lines">
        {(fields, { add, remove }) => (
          <>
            {fields.length > 0 && (
              <div aria-hidden style={{ display: 'grid', gridTemplateColumns: rowColumns, gap: spacing.xs, color: colors.textMuted, fontSize: typography.metadata.fontSize, marginBottom: spacing.xs }}>
                <span />
                <span>Lời</span>
                <span>Bắt đầu (giây)</span>
                <span />
                <span>Kết thúc (giây)</span>
              </div>
            )}
            {fields.map(({ key, name }, index) => {
              const rows = (): TimedLineRow[] => form.getFieldValue('lines') ?? []
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: rowColumns, gap: spacing.xs, alignItems: 'start', marginBottom: spacing.xs }}>
                  <span style={{ lineHeight: '40px', color: colors.textMuted, textAlign: 'right' }}>{index + 1}</span>
                  <Form.Item name={[name, 'text']} style={{ margin: 0 }} rules={[{ validator: () => check(lineTextProblem(rows()[name] ?? {})) }]}>
                    <Input aria-label={`Lời dòng ${index + 1}`} />
                  </Form.Item>
                  <Form.Item name={[name, 'startSeconds']} style={{ margin: 0 }} rules={[{ validator: () => check(lineStartProblem(rows(), name)) }]}>
                    <InputNumber aria-label={`Giây bắt đầu dòng ${index + 1}`} min={0} step={0.1} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                  <Tooltip title="Lấy thời điểm đang nghe" trigger={['hover', 'focus']}>
                    <Button type="text" icon={<FieldTimeOutlined />} aria-label={`Đặt giây bắt đầu dòng ${index + 1} theo thời điểm đang nghe`} onClick={() => markNow(name, 'startSeconds')} />
                  </Tooltip>
                  <Form.Item name={[name, 'endSeconds']} style={{ margin: 0 }} rules={[{ validator: () => check(lineEndProblem(rows(), name, audioSeconds)) }]}>
                    <InputNumber aria-label={`Giây kết thúc dòng ${index + 1}`} min={0} step={0.1} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                  <Tooltip title="Lấy thời điểm đang nghe" trigger={['hover', 'focus']}>
                    <Button type="text" icon={<FieldTimeOutlined />} aria-label={`Đặt giây kết thúc dòng ${index + 1} theo thời điểm đang nghe`} onClick={() => markNow(name, 'endSeconds')} />
                  </Tooltip>
                  <Tooltip title="Nghe dòng này" trigger={['hover', 'focus']}>
                    <Button type="text" icon={<CaretRightFilled />} aria-label={`Nghe dòng ${index + 1}`} onClick={() => playLine(name)} />
                  </Tooltip>
                  <Tooltip title="Bỏ dòng" trigger={['hover', 'focus']}>
                    <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Bỏ dòng ${index + 1}`} onClick={() => remove(name)} />
                  </Tooltip>
                </div>
              )
            })}
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                const last = (form.getFieldValue('lines') as TimedLineRow[] | undefined)?.at(-1)
                add({ startSeconds: last?.endSeconds ?? undefined })
              }}
            >
              Thêm dòng
            </Button>
            <Typography.Text type="secondary" style={{ marginInlineStart: spacing.sm }}>Tối đa {MAX_TIMED_LINES} dòng, lần lượt và không chồng nhau.</Typography.Text>
          </>
        )}
      </Form.List>

      {submitProblem && <Alert type="error" showIcon title={submitProblem} style={{ marginTop: spacing.md }} />}

      {hasTiming && (
        <Flex justify="flex-start" style={{ marginTop: spacing.lg }}>
          <Button danger loading={deleting} icon={<DeleteOutlined />} onClick={onDelete}>Xoá mốc thời gian</Button>
        </Flex>
      )}
    </Form>
  )
}

/**
 * Choir Director: creates, corrects or removes the timed lyrics of one audio material
 * (`PUT`/`DELETE /api/music-materials/{id}/timed-lyrics`). Saving replaces the whole timing.
 */
export function TimedLyricsDrawer({ material, materials, onClose }: Readonly<{
  /** The drawer is open while a material is set. */
  material?: SongMaterial
  materials: SongMaterial[]
  onClose: () => void
}>) {
  return material ? <OpenDrawer key={`${material.id}:${material.fileRevision}`} material={material} materials={materials} onClose={onClose} /> : null
}

function OpenDrawer({ material, materials, onClose }: Readonly<{ material: SongMaterial; materials: SongMaterial[]; onClose: () => void }>) {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const timing = useTimedLyrics(material.id, material.fileRevision)
  const save = useSaveTimedLyrics(material.id, material.fileRevision)
  const remove = useDeleteTimedLyrics(material.id, material.fileRevision)
  const [submitProblem, setSubmitProblem] = useState<string>()
  const lyricsMaterials = materials.filter((item) => item.kind === 'lyrics')

  const handleSubmit = (values: FormValues) => {
    if (save.isPending) return
    const rows = values.lines ?? []
    if (rows.length === 0) return setSubmitProblem('Vui lòng thêm ít nhất một dòng.')
    if (rows.length > MAX_TIMED_LINES) return setSubmitProblem(`Vui lòng giữ tối đa ${MAX_TIMED_LINES} dòng.`)
    setSubmitProblem(undefined)
    save.mutate(
      {
        lyricsMaterialId: values.lyricsMaterialId!,
        lines: rows.map((row, index) => ({ order: index + 1, text: row.text!.trim(), startSeconds: row.startSeconds!, endSeconds: row.endSeconds! })),
      },
      {
        onSuccess: () => {
          message.success('Đã lưu lời theo thời gian.')
          onClose()
        },
        onError: (error) => setSubmitProblem(timedLyricsErrorMessage(error)),
      },
    )
  }

  const handleDelete = () =>
    modal.confirm({
      title: `Xoá mốc thời gian của “${material.title}”?`,
      content: 'Phòng tập sẽ không còn hiện lời theo thời gian cho âm thanh này. Tài liệu lời vẫn được giữ.',
      okText: 'Xoá mốc thời gian',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      autoFocusButton: 'cancel',
      onOk: () =>
        remove
          .mutateAsync()
          .then(() => {
            message.success('Đã xoá mốc thời gian.')
            onClose()
          })
          .catch((error: Error) => message.error(timedLyricsErrorMessage(error))),
    })

  return (
    <FormDrawer
      open
      size={880}
      title={`Lời theo thời gian: ${material.title}`}
      okText="Lưu mốc thời gian"
      okButtonProps={{ loading: save.isPending }}
      onOk={() => {
        if (timing.data !== undefined) form.submit()
      }}
      onCancel={onClose}
      destroyOnHidden
    >
      {timing.isPending && <Skeleton active paragraph={{ rows: 8 }} />}
      {timing.isError && <ErrorState headingLevel={3} title="Không thể tải mốc thời gian" error={timing.error} onRetry={() => timing.refetch()} retrying={timing.isFetching} />}
      {timing.data !== undefined && (
        <TimedLyricsEditor
          material={material}
          lyricsMaterials={lyricsMaterials}
          form={form}
          initialValues={{
            lyricsMaterialId: timing.data?.lyricsMaterialId ?? (lyricsMaterials.length === 1 ? lyricsMaterials[0].id : undefined),
            lines: timing.data?.lines ?? [],
          }}
          hasTiming={timing.data !== null}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          deleting={remove.isPending}
          submitProblem={submitProblem}
        />
      )}
    </FormDrawer>
  )
}
