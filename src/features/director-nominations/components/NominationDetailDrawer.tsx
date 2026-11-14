import { UploadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, DatePicker, Drawer, Flex, Input, Modal, Radio, Select, Skeleton, Steps, Timeline, Typography, Upload } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState, type ReactNode } from 'react'
import { useChoirs } from '@/features/choirs'
import { parseUtc } from '@/lib/api/dates'
import { getSession } from '@/lib/auth/session'
import { ErrorState, Form, StatusTag, type StatusTagColor } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import {
  appointNomination,
  approveNomination,
  cancelNomination,
  createTraining,
  deleteTraining,
  getNomination,
  listTrainings,
  recordTrainingResult,
  rejectNomination,
  uploadCertificate,
  waiveTraining,
  withdrawNomination,
} from '../api/nominationsApi'
import { nominationErrorMessage } from '../nominationErrors'
import {
  nominationActions,
  nominationSteps,
  statusColors,
  statusLabels,
  trainingResultLabels,
  type NominationDetail,
  type Training,
} from '../types'
import { NominationStatsList } from './NominationStatsList'

const key = ['director-nominations'] as const
const day = (value: string) => dayjs(value).format('DD/MM/YYYY')
const moment = (value: string) => dayjs(parseUtc(value)).format('DD/MM/YYYY HH:mm')
const certificateTypes = ['.pdf', '.jpg', '.png']
const maxCertificateBytes = 20 * 1024 * 1024

type NoteAction = 'reject' | 'cancel' | 'waive'
type Dialog = { kind: NoteAction } | { kind: 'appoint' } | { kind: 'training' } | { kind: 'result'; training: Training }

const noteDialogs: Record<NoteAction, { title: string; label: string; ok: string; done: string; danger: boolean }> = {
  reject: { title: 'Từ chối đề cử', label: 'Lý do từ chối', ok: 'Từ chối đề cử', done: 'Đã từ chối đề cử. Người đề cử sẽ nhận được thông báo.', danger: true },
  cancel: { title: 'Hủy đề cử đã duyệt', label: 'Lý do hủy', ok: 'Hủy đề cử', done: 'Đã hủy đề cử. Người đề cử và ca viên sẽ nhận được thông báo.', danger: true },
  waive: { title: 'Miễn đào tạo', label: 'Lý do miễn đào tạo', ok: 'Miễn đào tạo', done: 'Đã miễn đào tạo. Admin có thể bổ nhiệm.', danger: false },
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section style={{ marginTop: spacing.lg }}>
      <Typography.Title level={3} style={{ margin: `0 0 ${spacing.sm}px`, fontSize: typography.cardHeading.fontSize }}>{title}</Typography.Title>
      {children}
    </section>
  )
}

/** What was decided so far, from the fields the backend keeps. It stores no separate log. */
function historyOf(item: NominationDetail) {
  const entries: { key: string; content: ReactNode }[] = [
    { key: 'created', content: <><strong>{moment(item.createdAt)}</strong> · {item.nominatedByFullName} đề cử. Lý do: {item.reason}</> },
  ]
  if (item.status === 'Rejected') {
    entries.push({ key: 'rejected', content: <><strong>{item.reviewedAt && moment(item.reviewedAt)}</strong> · Cha xứ từ chối. Lý do: {item.reviewNote}</> })
  } else if (item.reviewedAt) {
    entries.push({ key: 'approved', content: <><strong>{moment(item.reviewedAt)}</strong> · Cha xứ duyệt.</> })
  }
  if (item.trainingWaiverReason) entries.push({ key: 'waived', content: <>Cha xứ miễn đào tạo. Lý do: {item.trainingWaiverReason}</> })
  if (item.status === 'Cancelled') {
    entries.push({ key: 'cancelled', content: item.reviewNote ? <>Cha xứ hủy đề cử. Lý do: {item.reviewNote}</> : <>Người đề cử đã rút đề cử.</> })
  }
  if (item.appointedAt) entries.push({ key: 'appointed', content: <><strong>{moment(item.appointedAt)}</strong> · Admin bổ nhiệm làm Ca trưởng ca đoàn {item.appointedChoirName}.</> })
  return entries
}

const trainingResultColors: Record<keyof typeof trainingResultLabels, StatusTagColor> = { Passed: 'green', Failed: 'red', InProgress: 'processing' }

/** An ended nomination reads as stopped; an appointed one as done; any other as under way. */
function stepsStatus(ended: boolean, status: NominationDetail['status']) {
  if (ended) return 'error'
  return status === 'Appointed' ? 'finish' : 'process'
}

function stepIndex(status: NominationDetail['status'], reviewedAt: string | null) {
  if (status === 'Rejected') return 0
  if (status === 'Cancelled') return reviewedAt ? 1 : 0
  return nominationSteps.findIndex((step) => step.status === status)
}

/** Note, appointment, new course or course result: each one decision with its own fields and validation at the field. */
function DecisionDialog({ dialog, item, onClose }: Readonly<{ dialog: Dialog; item: NominationDetail; onClose: () => void }>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [problem, setProblem] = useState<string>()
  const choirs = useChoirs(dialog.kind === 'appoint')
  const run = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const note = (values.note as string | undefined)?.trim()
      switch (dialog.kind) {
        case 'reject': return rejectNomination(item.id, note!)
        case 'cancel': return cancelNomination(item.id, note!)
        case 'waive': return waiveTraining(item.id, note!)
        case 'appoint': return appointNomination(item.id, values.choirId as string)
        case 'training': return createTraining(item.id, {
          courseName: (values.courseName as string).trim(),
          organizer: (values.organizer as string | undefined)?.trim() || undefined,
          startDate: (values.startDate as Dayjs).format('YYYY-MM-DD'),
          endDate: (values.endDate as Dayjs | null | undefined)?.format('YYYY-MM-DD'),
        })
        case 'result': return recordTrainingResult(item.id, dialog.training.id, { result: values.result as 'Passed' | 'Failed', note: note || undefined })
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const copy = (() => {
    switch (dialog.kind) {
      case 'appoint': return { title: `Bổ nhiệm ${item.memberFullName}`, ok: 'Bổ nhiệm', done: `Đã bổ nhiệm ${item.memberFullName}. Người này cần đăng nhập lại để dùng quyền Ca trưởng.`, danger: false }
      case 'training': return { title: 'Cử đi học', ok: 'Cử đi học', done: 'Đã ghi khoá học. Ca viên và người đề cử sẽ nhận được thông báo.', danger: false }
      case 'result': return { title: `Ghi kết quả: ${dialog.training.courseName}`, ok: 'Ghi kết quả', done: 'Đã ghi kết quả khoá học.', danger: false }
      default: return noteDialogs[dialog.kind]
    }
  })()

  const fallback = dialog.kind === 'appoint'
    ? 'Không bổ nhiệm được. Vui lòng xem lại đề cử: nếu tài khoản đã là Ca trưởng nhưng chưa có ca đoàn, hãy gán ở trang Ca đoàn.'
    : 'Không thể lưu. Vui lòng thử lại.'

  return (
    <Modal
      open
      title={copy.title}
      okText={copy.ok}
      cancelText="Hủy"
      okButtonProps={{ danger: copy.danger, loading: run.isPending }}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          if (run.isPending) return
          setProblem(undefined)
          run.mutate(values as Record<string, unknown>, {
            onSuccess: () => {
              message.success(copy.done)
              onClose()
            },
            onError: (error) => setProblem(nominationErrorMessage(error, fallback)),
          })
        }}
      >
        {(dialog.kind === 'reject' || dialog.kind === 'cancel' || dialog.kind === 'waive') && (
          <Form.Item name="note" label={noteDialogs[dialog.kind].label} rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do.' }, { max: 500, message: 'Vui lòng nhập tối đa 500 ký tự.' }]}>
            <Input.TextArea rows={3} showCount maxLength={500} />
          </Form.Item>
        )}
        {dialog.kind === 'appoint' && (
          <>
            <Typography.Paragraph type="secondary">
              Tài khoản sẽ đổi sang vai trò Ca trưởng, phiên đăng nhập bị thu hồi, người này rời các ca đoàn với tư cách ca viên, và thay Ca trưởng hiện tại của ca đoàn được chọn.
            </Typography.Paragraph>
            <Form.Item name="choirId" label="Ca đoàn" initialValue={item.proposedChoirId ?? undefined} extra={item.proposedChoirName ? `Đề xuất: ${item.proposedChoirName}` : undefined} rules={[{ required: true, message: 'Vui lòng chọn ca đoàn.' }]}>
              <Select loading={choirs.isPending} placeholder="Chọn ca đoàn đang hoạt động" options={choirs.data?.filter((choir) => choir.isActive).map((choir) => ({ value: choir.id, label: choir.directorName ? `${choir.name} (Ca trưởng hiện tại: ${choir.directorName})` : choir.name }))} />
            </Form.Item>
          </>
        )}
        {dialog.kind === 'training' && (
          <>
            <Form.Item name="courseName" label="Tên khoá học" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên khoá học.' }, { max: 200, message: 'Vui lòng nhập tối đa 200 ký tự.' }]}><Input /></Form.Item>
            <Form.Item name="organizer" label="Đơn vị tổ chức" rules={[{ max: 200, message: 'Vui lòng nhập tối đa 200 ký tự.' }]}><Input /></Form.Item>
            <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu.' }]}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
            <Form.Item
              name="endDate"
              label="Ngày kết thúc"
              dependencies={['startDate']}
              rules={[{ validator: (_, end: Dayjs | null | undefined) => { const start: Dayjs | undefined = form.getFieldValue('startDate'); return end && start && end.isBefore(start, 'day') ? Promise.reject(new Error('Ngày kết thúc cần từ ngày bắt đầu trở đi.')) : Promise.resolve() } }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
        {dialog.kind === 'result' && (
          <>
            <Form.Item name="result" label="Kết quả" rules={[{ required: true, message: 'Vui lòng chọn kết quả.' }]}>
              <Radio.Group options={[{ value: 'Passed', label: 'Đạt' }, { value: 'Failed', label: 'Không đạt' }]} />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú" rules={[{ max: 500, message: 'Vui lòng nhập tối đa 500 ký tự.' }]}><Input.TextArea rows={3} showCount maxLength={500} /></Form.Item>
          </>
        )}
        {problem && <Alert type="error" showIcon title={problem} />}
      </Form>
    </Modal>
  )
}

function TrainingRow({ training, nominationId, canManage, onResult }: Readonly<{ training: Training; nominationId: string; canManage: boolean; onResult: () => void }>) {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const upload = useMutation({ mutationFn: (file: File) => uploadCertificate(nominationId, training.id, file), onSettled: refresh })
  const remove = useMutation({ mutationFn: () => deleteTraining(nominationId, training.id), onSettled: refresh })
  const inProgress = training.result === 'InProgress'

  const pick = (file: File) => {
    const name = file.name.toLowerCase()
    if (!certificateTypes.some((type) => name.endsWith(type))) message.error('Chứng chỉ chỉ nhận tệp .pdf, .jpg, .png.')
    else if (file.size > maxCertificateBytes) message.error('Tệp chứng chỉ vượt quá 20 MB. Vui lòng chọn tệp nhỏ hơn.')
    else upload.mutate(file, {
      onSuccess: () => message.success('Đã lưu chứng chỉ.'),
      onError: (error) => message.error(nominationErrorMessage(error, 'Không thể lưu chứng chỉ. Vui lòng thử lại.')),
    })
    return false
  }

  const confirmDelete = () =>
    modal.confirm({
      title: `Xoá khoá học “${training.courseName}”?`,
      content: 'Chỉ dùng khi nhập nhầm. Đề cử sẽ trở lại trạng thái trước khi cử đi học.',
      okText: 'Xoá khoá học',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      autoFocusButton: 'cancel',
      onOk: () => remove.mutateAsync().then(() => message.success('Đã xoá khoá học.')).catch((error: Error) => message.error(nominationErrorMessage(error, 'Không thể xoá khoá học. Vui lòng thử lại.'))),
    })

  return (
    <Flex component="li" vertical gap={spacing.xs} style={{ padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>
      <Flex justify="space-between" gap={spacing.sm} align="center">
        <Typography.Text strong>{training.courseName}</Typography.Text>
        <StatusTag color={trainingResultColors[training.result]}>{trainingResultLabels[training.result]}</StatusTag>
      </Flex>
      <Typography.Text type="secondary">
        {[training.organizer, [day(training.startDate), training.endDate && day(training.endDate)].filter(Boolean).join(' đến ')].filter(Boolean).join(' · ')}
      </Typography.Text>
      {training.resultNote && <Typography.Text>Ghi chú: {training.resultNote}</Typography.Text>}
      <Flex wrap gap={spacing.sm} align="center">
        {training.certificateUrl && <a href={training.certificateUrl} target="_blank" rel="noopener noreferrer">Xem chứng chỉ {training.certificateFileName}</a>}
        {canManage && (
          <Upload accept={certificateTypes.join(',')} maxCount={1} showUploadList={false} beforeUpload={pick}>
            <Button size="small" icon={<UploadOutlined />} loading={upload.isPending}>{training.certificateUrl ? 'Thay chứng chỉ' : 'Tải chứng chỉ'}</Button>
          </Upload>
        )}
        {canManage && inProgress && <Button size="small" onClick={onResult}>Ghi kết quả</Button>}
        {canManage && inProgress && <Button size="small" type="text" danger onClick={confirmDelete}>Xoá khoá học</Button>}
      </Flex>
    </Flex>
  )
}

/** One nomination: where it stands, the member's record, what was decided, courses, and the actions open to this role now. */
export function NominationDetailDrawer({ id, onClose }: Readonly<{ id?: string; onClose: () => void }>) {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const session = getSession()
  const role = session?.user.roleName
  const [dialog, setDialog] = useState<Dialog>()
  const nomination = useQuery({ queryKey: [...key, 'detail', id], queryFn: () => getNomination(id!), enabled: Boolean(id) })
  const trainings = useQuery({ queryKey: [...key, 'trainings', id], queryFn: () => listTrainings(id!), enabled: Boolean(id), staleTime: 0 })
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const approve = useMutation({ mutationFn: approveNomination, onSettled: refresh })
  const withdraw = useMutation({ mutationFn: withdrawNomination, onSettled: refresh })
  const item = nomination.data
  const actions = item ? nominationActions(item.status, role, item.nominatedById === session?.user.id) : []

  const confirmApprove = (target: NominationDetail) =>
    modal.confirm({
      title: `Duyệt đề cử ${target.memberFullName}?`,
      content: 'Người đề cử và ca viên sẽ nhận được thông báo. Bước tiếp theo là đào tạo hoặc miễn đào tạo.',
      okText: 'Duyệt đề cử',
      cancelText: 'Hủy',
      onOk: () => approve.mutateAsync(target.id).then(() => message.success('Đã duyệt đề cử.')).catch((error: Error) => message.error(nominationErrorMessage(error, 'Không thể duyệt đề cử. Vui lòng thử lại.'))),
    })

  const confirmWithdraw = (target: NominationDetail) =>
    modal.confirm({
      title: `Rút đề cử ${target.memberFullName}?`,
      content: 'Đề cử sẽ chuyển sang Đã hủy và không mở lại được.',
      okText: 'Rút đề cử',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      autoFocusButton: 'cancel',
      onOk: () => withdraw.mutateAsync(target.id).then(() => message.success('Đã rút đề cử.')).catch((error: Error) => message.error(nominationErrorMessage(error, 'Không thể rút đề cử. Vui lòng thử lại.'))),
    })

  const ended = item?.status === 'Rejected' || item?.status === 'Cancelled'
  return (
    <Drawer
      open={Boolean(id)}
      size={640}
      title={item ? `Đề cử ${item.memberFullName}` : 'Đề cử Ca trưởng'}
      onClose={onClose}
      destroyOnHidden
      footer={
        item && actions.length > 0 && (
          <Flex wrap justify="flex-end" gap={spacing.sm}>
            {actions.includes('withdraw') && <Button danger onClick={() => confirmWithdraw(item)}>Rút đề cử</Button>}
            {actions.includes('reject') && <Button danger onClick={() => setDialog({ kind: 'reject' })}>Từ chối</Button>}
            {actions.includes('cancel') && <Button danger onClick={() => setDialog({ kind: 'cancel' })}>Hủy đề cử</Button>}
            {actions.includes('waive') && <Button onClick={() => setDialog({ kind: 'waive' })}>Miễn đào tạo</Button>}
            {actions.includes('startTraining') && <Button onClick={() => setDialog({ kind: 'training' })}>Cử đi học</Button>}
            {actions.includes('approve') && <Button type="primary" onClick={() => confirmApprove(item)}>Duyệt</Button>}
            {actions.includes('appoint') && <Button type="primary" onClick={() => setDialog({ kind: 'appoint' })}>Bổ nhiệm</Button>}
          </Flex>
        )
      }
    >
      {nomination.isPending && Boolean(id) && <Skeleton active paragraph={{ rows: 10 }} />}
      {nomination.isError && <ErrorState headingLevel={3} title="Không thể tải đề cử" description={nominationErrorMessage(nomination.error, 'Vui lòng thử lại.')} error={nomination.error} onRetry={() => nomination.refetch()} retrying={nomination.isFetching} />}
      {item && (
        <>
          <Flex wrap align="center" gap={spacing.sm}>
            <StatusTag color={statusColors[item.status]} mark={item.status === 'Cancelled' ? 'struck' : undefined}>{statusLabels[item.status]}</StatusTag>
            {item.proposedChoirName && <Typography.Text type="secondary">Ca đoàn đề xuất: {item.proposedChoirName}</Typography.Text>}
          </Flex>
          <Steps
            size="small"
            style={{ marginTop: spacing.md }}
            current={stepIndex(item.status, item.reviewedAt)}
            status={stepsStatus(ended, item.status)}
            items={nominationSteps.map((step) => ({ title: step.title }))}
          />
          {ended && <Alert type="info" showIcon title={`Đề cử đã kết thúc ở trạng thái ${statusLabels[item.status]}.`} style={{ marginTop: spacing.md }} />}
          <Section title="Thành tích của ca viên">
            <NominationStatsList stats={item.stats} />
            <Typography.Paragraph type="secondary" style={{ margin: `${spacing.xs}px 0 0` }}>Ngưỡng chỉ để tham khảo, không chặn đề cử.</Typography.Paragraph>
          </Section>
          <Section title="Lịch sử quyết định">
            <Timeline items={historyOf(item).map(({ key: entryKey, content }) => ({ key: entryKey, content }))} />
          </Section>
          <Section title="Khoá đào tạo">
            {trainings.isPending && <Skeleton active paragraph={{ rows: 2 }} title={false} />}
            {trainings.isError && <ErrorState headingLevel={3} title="Không thể tải khoá đào tạo" error={trainings.error} onRetry={() => trainings.refetch()} retrying={trainings.isFetching} />}
            {trainings.data?.length === 0 && <Typography.Text type="secondary">Chưa có khoá đào tạo.</Typography.Text>}
            {trainings.data && trainings.data.length > 0 && (
              <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {trainings.data.map((training) => (
                  <TrainingRow key={training.id} training={training} nominationId={item.id} canManage={role === 'ParishPriest'} onResult={() => setDialog({ kind: 'result', training })} />
                ))}
              </Flex>
            )}
          </Section>
          {dialog && <DecisionDialog dialog={dialog} item={item} onClose={() => setDialog(undefined)} />}
        </>
      )}
    </Drawer>
  )
}
