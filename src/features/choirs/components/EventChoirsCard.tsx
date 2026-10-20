import { EditOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Select, Tag, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { useChoirs, useEventChoirs, useUpdateEventChoirs } from '../hooks/useChoirs'

export interface EventChoirsCardProps {
  eventId: string
  /** The backend refuses changes once the event date has passed (LITURGICAL_EVENT_ALREADY_PASSED). */
  locked?: boolean
}

const muted = { color: colors.textMuted }

/**
 * Choir Director: the choirs serving a program (D7, `/api/liturgical-events/{id}/choirs`). The whole set is saved at
 * once; a switched-off choir may stay on the program but cannot be newly added.
 */
export function EventChoirsCard({ eventId, locked = false }: Readonly<EventChoirsCardProps>) {
  const { message } = App.useApp()
  const serving = useEventChoirs(eventId)
  const choirs = useChoirs()
  const update = useUpdateEventChoirs(eventId)
  const [editing, setEditing] = useState<string[]>()
  const chooseButton = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  // The button is replaced by the picker while editing; give the focus back to it once the picker closes.
  useEffect(() => {
    if (wasEditing.current && !editing) chooseButton.current?.focus()
    wasEditing.current = Boolean(editing)
  }, [editing])

  const current = serving.data ?? []
  const options = (choirs.data ?? [])
    .filter((choir) => choir.isActive || current.some((item) => item.id === choir.id))
    .map((choir) => ({ value: choir.id, label: choir.isActive ? choir.name : `${choir.name} (ngừng hoạt động)` }))

  const unchanged =
    editing !== undefined && editing.length === current.length && editing.every((id) => current.some((choir) => choir.id === id))

  const save = () =>
    editing &&
    !unchanged &&
    update.mutate(editing, {
      onSuccess: () => {
        message.success('Đã lưu ca đoàn phục vụ.')
        setEditing(undefined)
      },
      onError: (error) => message.error(choirErrorMessage(error, 'Không thể lưu ca đoàn phục vụ. Vui lòng thử lại.')),
    })

  return (
    <Card
      title={<CardTitle>Ca đoàn phục vụ</CardTitle>}
      extra={
        !locked &&
        serving.isSuccess &&
        !editing && (
          <Button ref={chooseButton} icon={<EditOutlined />} onClick={() => setEditing(current.map((choir) => choir.id))}>
            Chọn ca đoàn
          </Button>
        )
      }
    >
      {serving.isPending && <SectionSkeleton rows={1} label="Đang tải ca đoàn phục vụ" />}
      {serving.isError && (
        <ErrorState headingLevel={3} title="Không thể tải ca đoàn phục vụ" onRetry={() => serving.refetch()} retrying={serving.isFetching} />
      )}
      {serving.isSuccess && !editing && (
        current.length > 0 ? (
          <Flex wrap gap={spacing.xs}>
            {current.map((choir) => (
              <Tag key={choir.id} style={{ marginInlineEnd: 0 }}>
                {choir.name}
              </Tag>
            ))}
          </Flex>
        ) : (
          <Typography.Text style={muted}>{locked ? 'Chương trình không có ca đoàn phục vụ.' : 'Chưa chọn ca đoàn phục vụ.'}</Typography.Text>
        )
      )}
      {editing && (
        <Flex vertical gap={spacing.sm}>
          <Select
            autoFocus
            mode="multiple"
            allowClear
            optionFilterProp="label"
            aria-label="Ca đoàn phục vụ"
            placeholder="Chọn ca đoàn"
            loading={choirs.isPending}
            value={editing}
            onChange={setEditing}
            options={options}
            notFoundContent="Chưa có ca đoàn đang hoạt động"
          />
          <Flex gap={spacing.sm} justify="flex-end">
            <Button onClick={() => setEditing(undefined)} disabled={update.isPending}>
              Hủy
            </Button>
            <Button type="primary" loading={update.isPending} disabled={unchanged} onClick={save}>
              Lưu
            </Button>
          </Flex>
        </Flex>
      )}
    </Card>
  )
}
