import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Drawer, Flex, Select, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useChoirMembers } from '@/features/members'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { useAddChoirMembers, useMembersOfChoir, useRemoveChoirMember } from '../hooks/useChoirs'
import type { Choir, ChoirMembership } from '../types'

export interface ChoirMembersDrawerProps {
  /** The drawer is open while a choir is set. */
  choir?: Choir
  onClose: () => void
}

const muted = { color: colors.textMuted }

/**
 * The members of one choir: add active members, several at once, and take a member out of the choir. The Admin and
 * the choir's director both add (member profile search open to the Admin since BE c091c07).
 */
export function ChoirMembersDrawer({ choir, onClose }: Readonly<ChoirMembersDrawerProps>) {
  const { message, modal } = App.useApp()
  const choirId = choir?.id ?? ''
  const choirName = choir?.name ?? ''
  const members = useMembersOfChoir(choir?.id)
  const add = useAddChoirMembers(choirId)
  const remove = useRemoveChoirMember(choirId)
  const [adding, setAdding] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const profiles = useChoirMembers(adding)

  const current = new Set((members.data ?? []).map((member) => member.memberId))
  const candidates = (profiles.data ?? []).filter((profile) => !current.has(profile.id))

  const closeAdding = () => {
    setAdding(false)
    setPicked([])
  }

  const handleAdd = () =>
    add.mutate(picked, {
      onSuccess: () => {
        message.success(`Đã thêm ${picked.length} ca viên vào ${choirName}.`)
        closeAdding()
      },
      onError: (error) => message.error(choirErrorMessage(error, 'Không thể thêm ca viên. Vui lòng thử lại.')),
    })

  const handleRemove = (member: ChoirMembership) =>
    modal.confirm({
      title: `Rút ${member.fullName} khỏi ${choirName}?`,
      content: 'Ca viên vẫn thuộc các ca đoàn khác và có thể được thêm lại sau.',
      okText: 'Rút khỏi ca đoàn',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      // Enter on a destructive dialog must not run it.
      autoFocusButton: 'cancel',
      onOk: () =>
        remove
          .mutateAsync(member.memberId)
          .then(() => message.success(`Đã rút ${member.fullName} khỏi ca đoàn.`))
          .catch((error: Error) => message.error(choirErrorMessage(error, 'Không thể rút ca viên. Vui lòng thử lại.'))),
    })

  return (
    <Drawer
      open={Boolean(choir)}
      title={`Ca viên của ${choirName}`}
      onClose={onClose}
      size="large"
      extra={
        <Button type="primary" icon={<PlusOutlined />} disabled={!choir?.isActive || adding} onClick={() => setAdding(true)}>
          Thêm ca viên
        </Button>
      }
      destroyOnHidden
    >
      {choir && !choir.isActive && (
        <Typography.Paragraph style={muted}>Ca đoàn đang ngừng hoạt động nên không thêm được ca viên mới.</Typography.Paragraph>
      )}
      {/* Added in place, not in a dialog over the drawer: the list stays in view while picking. */}
      {adding && (
        <Flex
          vertical
          gap={spacing.sm}
          style={{ padding: spacing.md, marginBottom: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radius.md, background: colors.background }}
        >
          <Typography.Text strong>Thêm ca viên vào {choirName}</Typography.Text>
          <Typography.Text style={muted}>Chỉ ca viên đang sinh hoạt; một ca viên có thể thuộc nhiều ca đoàn.</Typography.Text>
          <Select
            autoFocus
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            aria-label="Ca viên cần thêm"
            placeholder="Chọn ca viên"
            loading={profiles.isPending}
            value={picked}
            onChange={setPicked}
            options={candidates.map((profile) => ({ value: profile.id, label: profile.fullName }))}
            notFoundContent="Mọi ca viên đang sinh hoạt đã ở trong ca đoàn này"
          />
          <Flex justify="flex-end" gap={spacing.sm}>
            <Button onClick={closeAdding} disabled={add.isPending}>
              Hủy
            </Button>
            <Button type="primary" onClick={handleAdd} disabled={picked.length === 0} loading={add.isPending}>
              {picked.length ? `Thêm ${picked.length} ca viên` : 'Thêm ca viên'}
            </Button>
          </Flex>
        </Flex>
      )}
      {members.isPending && <SectionSkeleton rows={5} label="Đang tải ca viên của ca đoàn" />}
      {members.isError && (
        <ErrorState
          headingLevel={3}
          title="Không thể tải ca viên của ca đoàn"
          error={members.error} hasData={members.data !== undefined} onRetry={() => members.refetch()}
          retrying={members.isFetching}
        />
      )}
      {members.data !== undefined && members.data.length === 0 && (
        <EmptyState
          headingLevel={3}
          title="Ca đoàn chưa có ca viên"
          description="Thêm ca viên đang sinh hoạt vào ca đoàn này."
        />
      )}
      {members.data !== undefined && members.data.length > 0 && (
        <Table<ChoirMembership>
          rowKey="memberId"
          size="small"
          pagination={false}
          dataSource={members.data}
          columns={[
            {
              key: 'name',
              title: 'Ca viên',
              render: (_, member) => (
                <Flex vertical>
                  <Typography.Text strong>{member.fullName}</Typography.Text>
                  <Typography.Text style={{ ...muted, fontSize: typography.metadata.fontSize }}>{member.email}</Typography.Text>
                </Flex>
              ),
            },
            {
              key: 'joined',
              title: 'Vào ca đoàn',
              render: (_, member) => (
                <span style={{ fontFamily: typography.fontFamilyNumeric }}>{dayjs(member.joinedDate).format('DD/MM/YYYY')}</span>
              ),
            },
            {
              key: 'actions',
              title: 'Thao tác',
              align: 'right',
              render: (_, member) => (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(member)}
                  aria-label={`Rút ${member.fullName} khỏi ca đoàn`}
                />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  )
}
