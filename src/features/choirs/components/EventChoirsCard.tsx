import { EditOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Flex, Form, Select, Tag, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { useEventChoirs, useUpdateEventChoirs } from '../hooks/useChoirs'

export interface EventChoirsCardProps {
  eventId: string
  /** Parish Priest: chooses the lead choir and may take choirs off. The Choir Director only reads. */
  canEdit?: boolean
  /** The backend refuses changes once the event date has passed (LITURGICAL_EVENT_ALREADY_PASSED). */
  locked?: boolean
}

interface Draft {
  choirIds: string[]
  leadChoirId?: string
}

const muted = { color: colors.textMuted }

/**
 * The choirs serving a program and the lead one (D7, D8, `/api/liturgical-events/{id}/choirs`). The lead choir's
 * director makes the song list, invitations and roster; the other choirs' directors only read them. The Parish Priest
 * saves the whole set at once. The Parish Priest cannot list the parish's choirs yet (`GET /api/choirs` is Admin and
 * Choir Director only), so a choir can be taken off but not added here.
 */
export function EventChoirsCard({ eventId, canEdit = false, locked = false }: Readonly<EventChoirsCardProps>) {
  const { message } = App.useApp()
  const serving = useEventChoirs(eventId)
  const update = useUpdateEventChoirs(eventId)
  const [draft, setDraft] = useState<Draft>()
  const editButton = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  // The button is replaced by the form while editing; give the focus back to it once the form closes.
  useEffect(() => {
    if (wasEditing.current && !draft) editButton.current?.focus()
    wasEditing.current = Boolean(draft)
  }, [draft])

  const current = serving.data ?? []
  const currentLead = current.find((choir) => choir.isLead)?.choirId
  const unchanged =
    draft !== undefined &&
    draft.leadChoirId === currentLead &&
    draft.choirIds.length === current.length &&
    draft.choirIds.every((id) => current.some((choir) => choir.choirId === id))
  const needsLead = draft !== undefined && draft.choirIds.length > 0 && !draft.leadChoirId

  const save = () =>
    draft &&
    !unchanged &&
    !needsLead &&
    update.mutate(draft, {
      onSuccess: () => {
        message.success('Đã lưu ca đoàn phục vụ.')
        setDraft(undefined)
      },
      onError: (error) => message.error(choirErrorMessage(error, 'Không thể lưu ca đoàn phục vụ. Vui lòng thử lại.')),
    })

  const choose = (choirIds: string[]) =>
    setDraft((previous) => ({
      choirIds,
      leadChoirId: previous?.leadChoirId && choirIds.includes(previous.leadChoirId) ? previous.leadChoirId : choirIds.length === 1 ? choirIds[0] : undefined,
    }))

  const options = current.map((choir) => ({ value: choir.choirId, label: choir.isActive ? choir.name : `${choir.name} (ngừng hoạt động)` }))

  return (
    <Card
      title={<CardTitle>Ca đoàn phục vụ</CardTitle>}
      extra={
        canEdit &&
        !locked &&
        current.length > 0 &&
        !draft && (
          <Button ref={editButton} icon={<EditOutlined />} onClick={() => setDraft({ choirIds: current.map((choir) => choir.choirId), leadChoirId: currentLead })}>
            Chọn ca đoàn phụ trách
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
            <Flex wrap gap={spacing.xs}>
              {current.map((choir) => (
                <Tag key={choir.choirId} color={choir.isLead ? 'gold' : undefined} style={{ marginInlineEnd: 0 }}>
                  {choir.name}
                  {choir.isLead && ' · Phụ trách'}
                  {choir.directorName && ` (${choir.directorName})`}
                </Tag>
              ))}
            </Flex>
          ) : (
            <Typography.Text style={muted}>{locked ? 'Chương trình không có ca đoàn phục vụ.' : 'Chưa có ca đoàn phục vụ.'}</Typography.Text>
          )}
          {current.length > 0 && !currentLead && (
            <Typography.Text style={muted}>
              Chưa chọn ca đoàn phụ trách: ca trưởng của mọi ca đoàn phục vụ đều lập được danh sách bài, mời tham gia và phân công.
            </Typography.Text>
          )}
          {canEdit && !locked && (
            <Typography.Text style={muted}>Thêm ca đoàn mới cho chương trình chưa làm được trên trang này.</Typography.Text>
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
                placeholder="Không có ca đoàn"
                value={draft.choirIds}
                onChange={choose}
                options={options}
              />
            </Form.Item>
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
          {draft.choirIds.length === 0 && <Alert type="warning" showIcon title="Lưu sẽ gỡ mọi ca đoàn khỏi chương trình." />}
          <Flex gap={spacing.sm} justify="flex-end">
            <Button onClick={() => setDraft(undefined)} disabled={update.isPending}>
              Hủy
            </Button>
            <Button type="primary" loading={update.isPending} disabled={unchanged || needsLead} onClick={save}>
              Lưu
            </Button>
          </Flex>
        </Flex>
      )}
    </Card>
  )
}
