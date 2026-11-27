import { App, Button, Flex, Input, Select, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useAllChoirMembers } from '@/features/members'
import { getSession } from '@/lib/auth/session'
import { ACTIONS_COLUMN_TITLE, CANCEL_LABEL, EmptyState, ErrorState, Icon, NoFilterResults, SectionSkeleton, SELECT_POPUP_PROPS, ViewDrawer } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, component, radius, spacing, typography } from '@/styles/tokens'
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
  const [search, setSearch] = useState('')
  const [seenChoirId, setSeenChoirId] = useState(choir?.id)
  if (choir?.id !== seenChoirId) {
    setSeenChoirId(choir?.id)
    setAdding(false)
    setPicked([])
    setSearch('')
  }
  const profiles = useAllChoirMembers(adding)

  // A Choir Director only invites; the member joins on accepting. The Admin places members directly (ChoirService.cs:210-219).
  const invites = getSession()?.user.roleName === 'ChoirDirector'
  const current = new Set((members.data ?? []).map((member) => member.memberId))
  // One active choir per member: someone in another choir moves by their own request, and the backend refuses the whole
  // batch for them (MEMBER_ALREADY_IN_CHOIR), so they are not offered.
  const candidates = (profiles.data ?? []).filter((profile) => !current.has(profile.id) && !profile.choirs?.some((other) => other.id !== choirId))
  const visibleMembers = useMemo(
    () => (members.data ?? []).filter((member) => matchesSearch(search, member.fullName, member.email)),
    [members.data, search],
  )

  const closeAdding = () => {
    setAdding(false)
    setPicked([])
  }

  const handleClose = () => {
    closeAdding()
    setSearch('')
    onClose()
  }

  const handleAdd = () =>
    add.mutate(picked, {
      onSuccess: () => {
        message.success(
          invites
            ? `Đã gửi lời mời tới ${picked.length} ca viên. Họ sẽ vào ${choirName} khi chấp nhận lời mời.`
            : `Đã thêm ${picked.length} ca viên vào ${choirName}.`,
        )
        closeAdding()
      },
      onError: (error) => message.error(choirErrorMessage(error, 'Không thể thêm ca viên. Vui lòng thử lại.')),
    })

  const handleRemove = (member: ChoirMembership) =>
    modal.confirm({
      title: `Rút ${member.fullName} khỏi ${choirName}?`,
      content: 'Ca viên sẽ rời khỏi ca đoàn này; các phân công chưa chốt có thể cần điều chỉnh lại và bạn vẫn có thể mời lại sau.',
      okText: 'Rút khỏi ca đoàn',
      okButtonProps: { danger: true },
      cancelText: CANCEL_LABEL,
      // Enter on a destructive dialog must not run it.
      focusable: { autoFocusButton: 'cancel' },
      onOk: () =>
        remove
          .mutateAsync(member.memberId)
          .then(() => message.success(`Đã rút ${member.fullName} khỏi ca đoàn.`))
          .catch((error: Error) => message.error(choirErrorMessage(error, 'Không thể rút ca viên. Vui lòng thử lại.'))),
    })

  return (
    <ViewDrawer
      open={Boolean(choir)}
      title={`Ca viên của ${choirName}`}
      onClose={handleClose}
      size={component.drawer.lg}
      extra={
        <Button type="primary" icon={<Icon name="add" />} disabled={!choir?.isActive || adding} onClick={() => setAdding(true)}>
          {invites ? 'Mời ca viên' : 'Thêm ca viên'}
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
          <Typography.Text strong>{invites ? `Mời ca viên vào ${choirName}` : `Thêm ca viên vào ${choirName}`}</Typography.Text>
          <Typography.Text style={muted}>
            {invites
              ? 'Chỉ ca viên đang sinh hoạt và chưa thuộc ca đoàn nào. Họ vào ca đoàn sau khi chấp nhận lời mời.'
              : 'Chỉ ca viên đang sinh hoạt và chưa thuộc ca đoàn nào; ca viên của ca đoàn khác tự xin chuyển.'}
          </Typography.Text>
          <Select
            {...SELECT_POPUP_PROPS}
            autoFocus
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            aria-label={invites ? 'Ca viên cần mời' : 'Ca viên cần thêm'}
            placeholder="Chọn ca viên"
            loading={profiles.isPending}
            value={picked}
            onChange={setPicked}
            options={candidates.map((profile) => ({ value: profile.id, label: profile.fullName }))}
            notFoundContent="Không còn ca viên đang sinh hoạt nào chưa có ca đoàn"
          />
          <Flex justify="flex-end" gap={spacing.sm}>
            <Button onClick={closeAdding} disabled={add.isPending}>
              {CANCEL_LABEL}
            </Button>
            <Button type="primary" onClick={handleAdd} disabled={picked.length === 0} loading={add.isPending}>
              {invites ? (picked.length ? `Gửi lời mời (${picked.length})` : 'Gửi lời mời') : picked.length ? `Thêm ${picked.length} ca viên` : 'Thêm ca viên'}
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
        <Flex vertical gap={spacing.sm}>
          <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
            <Input
              allowClear
              aria-label="Tìm ca viên trong ca đoàn"
              prefix={<Icon name="search" />}
              placeholder="Tìm theo họ tên hoặc email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 260, maxWidth: '100%' }}
            />
            <Typography.Text style={{ ...muted, fontSize: typography.metadata.fontSize }}>
              {search.trim() ? `${visibleMembers.length} / ${members.data.length} ca viên` : `${members.data.length} ca viên`}
            </Typography.Text>
          </Flex>
          {visibleMembers.length === 0 ? (
            <NoFilterResults onClearFilters={() => setSearch('')} />
          ) : (
            <Table<ChoirMembership>
              rowKey="memberId"
              size="small"
              pagination={false}
              dataSource={visibleMembers}
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
                    <span>{dayjs(member.joinedDate).format('DD/MM/YYYY')}</span>
                  ),
                },
                {
                  key: 'actions',
                  title: ACTIONS_COLUMN_TITLE,
                  align: 'center',
                  width: 80,
                  render: (_, member) => (
                    <Button
                      type="text"
                      danger
                      icon={<Icon name="delete" />}
                      onClick={() => handleRemove(member)}
                      aria-label={`Rút ${member.fullName} khỏi ca đoàn`}
                    />
                  ),
                },
              ]}
            />
          )}
        </Flex>
      )}
    </ViewDrawer>
  )
}
