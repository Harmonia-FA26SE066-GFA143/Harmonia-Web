import { EditOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Flex, Input, Select, Tag, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { CardTitle, ErrorState, Form, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { useChoirs, useEventChoirs, useUpdateEventChoirs } from '../hooks/useChoirs'
import { choirOptionLabel } from '../leadChoir'
import type { EventChoir } from '../types'
import { SubstituteDirectorModal } from './SubstituteDirectorModal'

export interface EventChoirsCardProps {
  eventId: string
  /** Parish Priest: chooses the choirs and the lead one. The Choir Director only reads. */
  canEdit?: boolean
  /** The backend refuses changes once the event date has passed (LITURGICAL_EVENT_ALREADY_PASSED). */
  locked?: boolean
  /** Removing a choir from a published event needs a reason (CHOIR_CHANGE_REASON_REQUIRED, BE ff72860). */
  published?: boolean
}

interface Draft {
  choirIds: string[]
  leadChoirId?: string
  reason?: string
}

const muted = { color: colors.textMuted }

/**
 * The choirs serving a program and the lead one (D7, D8, `/api/liturgical-events/{id}/choirs`). The lead choir's
 * director makes the song list, invitations and roster; the other choirs' directors only read them. The Parish Priest
 * saves the whole set at once, choosing among the parish's active choirs (`GET /api/choirs`, open to the Priest since
 * BE c091c07); an inactive choir may stay on the event but cannot be added (CHOIR_INACTIVE).
 */
export function EventChoirsCard({ eventId, canEdit = false, locked = false, published = false }: Readonly<EventChoirsCardProps>) {
  const { message } = App.useApp()
  const serving = useEventChoirs(eventId)
  const update = useUpdateEventChoirs(eventId)
  const [draft, setDraft] = useState<Draft>()
  const [substituteFor, setSubstituteFor] = useState<EventChoir>()
  const parish = useChoirs(canEdit && Boolean(draft))
  const editButton = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  // The button is replaced by the form while editing; give the focus back to it once the form closes.
  useEffect(() => {
    if (wasEditing.current && !draft) editButton.current?.focus()
    wasEditing.current = Boolean(draft)
  }, [draft])

  const current = serving.data ?? []
  const lead = current.find((choir) => choir.isLead)
  const currentLead = lead?.choirId
  // Only the lead choir's director, or their substitute at this event, may plan it (ChoirScopeService.CanLeadEventAsync).
  const nobodyPlans = Boolean(lead) && !lead?.directorId && !lead?.substituteDirectorId
  const unchanged =
    draft !== undefined &&
    draft.leadChoirId === currentLead &&
    draft.choirIds.length === current.length &&
    draft.choirIds.every((id) => current.some((choir) => choir.choirId === id))
  const needsLead = draft !== undefined && draft.choirIds.length > 0 && !draft.leadChoirId
  // At least one choir always serves (BE 678fc34: LITURGICAL_EVENT_CHOIR_REQUIRED).
  const empty = draft !== undefined && draft.choirIds.length === 0
  const removing = draft !== undefined && current.some((choir) => !draft.choirIds.includes(choir.choirId))
  const reason = draft?.reason?.trim() || undefined
  const needsReason = published && removing && !reason
  const blocked = unchanged || needsLead || empty || needsReason

  const save = () =>
    draft &&
    !blocked &&
    update.mutate({ choirIds: draft.choirIds, leadChoirId: draft.leadChoirId, reason }, {
      onSuccess: () => {
        message.success('Đã lưu ca đoàn phục vụ.')
        setDraft(undefined)
      },
      onError: (error) => message.error(choirErrorMessage(error, 'Không thể lưu ca đoàn phục vụ. Vui lòng thử lại.')),
    })

  const choose = (choirIds: string[]) =>
    setDraft((previous) => ({
      reason: previous?.reason,
      choirIds,
      leadChoirId: previous?.leadChoirId && choirIds.includes(previous.leadChoirId) ? previous.leadChoirId : choirIds.length === 1 ? choirIds[0] : undefined,
    }))

  const options = [
    ...current.map((choir) => ({ value: choir.choirId, label: choir.isActive ? choirOptionLabel(choir) : `${choir.name} (ngừng hoạt động)` })),
    ...(parish.data ?? [])
      .filter((choir) => choir.isActive && !current.some(({ choirId }) => choirId === choir.id))
      .map((choir) => ({ value: choir.id, label: choirOptionLabel(choir) })),
  ]

  return (
    <Card
      title={<CardTitle>Ca đoàn phục vụ</CardTitle>}
      extra={
        canEdit &&
        !locked &&
        serving.data !== undefined &&
        !draft && (
          <Button ref={editButton} icon={<EditOutlined />} onClick={() => setDraft({ choirIds: current.map((choir) => choir.choirId), leadChoirId: currentLead })}>
            Sửa ca đoàn phục vụ
          </Button>
        )
      }
    >
      {serving.isPending && <SectionSkeleton rows={1} label="Đang tải ca đoàn phục vụ" />}
      {serving.isError && (
        <ErrorState headingLevel={3} title="Không thể tải ca đoàn phục vụ" error={serving.error} hasData={serving.data !== undefined} onRetry={() => serving.refetch()} retrying={serving.isFetching} />
      )}
      {serving.data !== undefined && !draft && (
        <Flex vertical gap={spacing.sm}>
          {current.length > 0 ? (
            <Flex vertical gap={spacing.xs}>
              {current.map((choir) => (
                <Flex key={choir.choirId} align="center" gap={spacing.sm} wrap>
                  <Tag color={choir.isLead ? 'gold' : undefined} style={{ marginInlineEnd: 0 }}>
                    {choir.name}
                    {choir.isLead && ' · Phụ trách'}
                    {choir.directorId ? choir.directorName && ` (${choir.directorName})` : ' (chưa có ca trưởng)'}
                  </Tag>
                  {choir.substituteDirectorName && (
                    <Typography.Text>Ca trưởng thay thế: {choir.substituteDirectorName}</Typography.Text>
                  )}
                  {choir.reason && <Typography.Text style={muted}>Lý do: {choir.reason}</Typography.Text>}
                  {canEdit && !locked && (
                    <Button size="small" type="link" onClick={() => setSubstituteFor(choir)} aria-label={`Ca trưởng thay thế cho ${choir.name}`}>
                      {choir.substituteDirectorId ? 'Đổi ca trưởng thay thế' : 'Đặt ca trưởng thay thế'}
                    </Button>
                  )}
                </Flex>
              ))}
            </Flex>
          ) : (
            <Typography.Text style={muted}>{locked ? 'Chương trình không có ca đoàn phục vụ.' : 'Chưa có ca đoàn phục vụ.'}</Typography.Text>
          )}
          {nobodyPlans && (
            <Alert
              type="warning"
              showIcon
              title="Ca đoàn phụ trách chưa có ca trưởng"
              description="Chưa ai lập được danh sách bài, mời tham gia hay phân công cho chương trình này. Cha xứ đặt ca trưởng thay thế, hoặc Quản trị viên chọn ca trưởng cho ca đoàn."
            />
          )}
          {current.length > 0 && !currentLead && (
            <Typography.Text style={muted}>
              Chưa chọn ca đoàn phụ trách: ca trưởng của mọi ca đoàn phục vụ đều lập được danh sách bài, mời tham gia và phân công.
            </Typography.Text>
          )}
        </Flex>
      )}
      {draft && (
        <Flex vertical gap={spacing.sm}>
          <Form layout="vertical" component="div">
            <Form.Item label="Ca đoàn phục vụ" style={{ marginBottom: spacing.sm }}>
              <Select
                autoFocus
                mode="multiple"
                optionFilterProp="label"
                aria-label="Ca đoàn phục vụ"
                placeholder="Chọn ca đoàn"
                loading={parish.isPending}
                value={draft.choirIds}
                onChange={choose}
                options={options}
              />
            </Form.Item>
            {parish.isError && (
              <Typography.Paragraph type="danger">Không thể tải danh sách ca đoàn của giáo xứ; vẫn sửa được các ca đoàn đang phục vụ.</Typography.Paragraph>
            )}
            {draft.choirIds.length > 0 && (
              <Form.Item
                label="Ca đoàn phụ trách"
                required
                validateStatus={needsLead ? 'warning' : undefined}
                help="Ca trưởng của ca đoàn này lập danh sách bài, mời tham gia và phân công; các ca đoàn khác chỉ xem."
                style={{ marginBottom: spacing.sm }}
              >
                <Select
                  aria-label="Ca đoàn phụ trách"
                  placeholder="Chọn ca đoàn phụ trách"
                  value={draft.leadChoirId}
                  onChange={(leadChoirId: string) => setDraft({ ...draft, leadChoirId })}
                  options={options.filter(({ value }) => draft.choirIds.includes(value))}
                />
              </Form.Item>
            )}
          </Form>
          {empty && <Alert type="warning" showIcon title="Chương trình cần ít nhất một ca đoàn phục vụ." />}
          {removing && !empty && (
            <Form layout="vertical" component="div">
              <Form.Item
                label="Lý do gỡ ca đoàn"
                required={published}
                validateStatus={needsReason ? 'warning' : undefined}
                help="Gửi kèm thông báo. Ca viên không còn thuộc ca đoàn nào phục vụ sẽ mất lời mời và phân công của chương trình."
                style={{ marginBottom: spacing.sm }}
              >
                <Input.TextArea
                  aria-label="Lý do gỡ ca đoàn"
                  rows={2}
                  maxLength={500}
                  showCount
                  value={draft.reason}
                  onChange={(event) => setDraft({ ...draft, reason: event.target.value })}
                />
              </Form.Item>
            </Form>
          )}
          <Flex gap={spacing.sm} justify="flex-end">
            <Button onClick={() => setDraft(undefined)} disabled={update.isPending}>
              Hủy
            </Button>
            <Button type="primary" loading={update.isPending} disabled={blocked} onClick={save}>
              Lưu
            </Button>
          </Flex>
        </Flex>
      )}
      <SubstituteDirectorModal eventId={eventId} choir={substituteFor} onClose={() => setSubstituteFor(undefined)} />
    </Card>
  )
}
