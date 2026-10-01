import { BulbOutlined, NotificationOutlined, SaveOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Flex, Modal, Tooltip, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'
import { colors, spacing } from '@/styles/tokens'
import { useSaveRoster, useSendAssignmentNotifications } from '../hooks/useRoster'
import { shortages, type EligibleMember, type Roster, type RosterSkill, type RosterSuggestion, type RosterValues } from '../types'
import { NotifyModal } from './NotifyModal'
import { RequirementTable } from './RequirementTable'
import { SuggestionModal } from './SuggestionModal'

export interface RosterSong {
  songId: string
  title: string
  liturgicalPart?: string
}

export interface RosterEditorProps {
  roster: Roster
  /** Songs of the approved list, in order. */
  songs: RosterSong[]
  eligible: EligibleMember[]
  skills: RosterSkill[]
}

let draftSequence = 0

/**
 * Requirements per song and for the whole program, with assignments (FE-35–FE-38) and the assignment notification
 * (FE-40). Changes stay on the page until saved; leaving asks first. Finalizing ("Hoàn tất phân công" = Finalize
 * Program) is Phase 6d.
 */
export function RosterEditor({ roster, songs, eligible, skills }: RosterEditorProps) {
  const { message } = App.useApp()
  const save = useSaveRoster(roster.programId)
  const notify = useSendAssignmentNotifications(roster.programId)
  const [draft, setDraft] = useState<RosterValues>({ requirements: roster.requirements, assignments: roster.assignments })
  const [suggesting, setSuggesting] = useState(false)
  const [notifying, setNotifying] = useState(false)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify({ requirements: roster.requirements, assignments: roster.assignments }),
    [draft, roster],
  )
  const blocked = dirty && !save.isSuccess
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      blocked && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  )
  useBeforeUnload((event) => {
    if (blocked) event.preventDefault()
  })

  const removedTitle = 'Bài không còn trong danh sách đã duyệt'
  const songTitle = (songId?: string) =>
    songId ? (songs.find((song) => song.songId === songId)?.title ?? removedTitle) : 'Cả chương trình'
  const describe = (requirementId: string) => {
    const requirement = draft.requirements.find((item) => item.id === requirementId)
    return requirement && `${requirement.skill.name} · ${songTitle(requirement.songId)}`
  }
  const missing = shortages(draft, eligible)
  const assignedMembers = [...new Map(roster.assignments.map((item) => [item.memberId, item])).values()]

  const groups = [
    { key: 'program', songId: undefined, title: 'Cả chương trình', subtitle: 'Vị trí phục vụ suốt chương trình (ví dụ chỉ huy, đàn chính)' },
    ...songs.map((song) => ({ key: song.songId, songId: song.songId, title: song.title, subtitle: song.liturgicalPart })),
    // Requirements of songs no longer on the approved list stay visible so they can be reviewed; what should happen to
    // them when the Music Program changes is TBD (roster.md).
    ...[...new Set(draft.requirements.map((item) => item.songId))]
      .filter((songId): songId is string => Boolean(songId) && !songs.some((song) => song.songId === songId))
      .map((songId) => ({ key: `removed-${songId}`, songId, title: removedTitle, subtitle: 'Kiểm tra lại các yêu cầu này' })),
  ]

  const update = (change: (values: RosterValues) => RosterValues) => setDraft((current) => change(current))
  const applySuggestions = (suggestions: RosterSuggestion[]) => {
    update((values) => {
      const assignments = [...values.assignments]
      for (const suggestion of suggestions) {
        const requirement = values.requirements.find((item) => item.id === suggestion.requirementId)
        const taken = assignments.filter((item) => item.requirementId === suggestion.requirementId)
        if (!requirement || taken.length >= requirement.count || taken.some((item) => item.memberId === suggestion.memberId)) continue
        assignments.push(suggestion)
      }
      return { ...values, assignments }
    })
    setSuggesting(false)
  }

  const handleSave = () =>
    save.mutate(draft, {
      onSuccess: () => message.success('Đã lưu phân công.'),
      onError: () => message.error('Không thể lưu phân công. Vui lòng thử lại.'),
    })
  const handleNotify = (memberIds: string[]) =>
    notify.mutate(memberIds, {
      onSuccess: () => {
        message.success(`Đã gửi thông báo phân công cho ${memberIds.length} thành viên.`)
        setNotifying(false)
      },
      onError: () => message.error('Không thể gửi thông báo. Vui lòng thử lại.'),
    })

  return (
    <Flex vertical gap={spacing.md}>
      <Flex wrap gap={spacing.sm} justify="flex-end">
        <Button icon={<BulbOutlined />} onClick={() => setSuggesting(true)}>
          Gợi ý nhân sự
        </Button>
        <Tooltip title={dirty ? 'Lưu phân công trước khi gửi thông báo.' : undefined}>
          <Button icon={<NotificationOutlined />} onClick={() => setNotifying(true)} disabled={dirty || assignedMembers.length === 0}>
            Gửi thông báo phân công
          </Button>
        </Tooltip>
        <Button onClick={() => setDraft({ requirements: roster.requirements, assignments: roster.assignments })} disabled={!dirty || save.isPending}>
          Hủy thay đổi
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={!dirty} loading={save.isPending}>
          Lưu phân công
        </Button>
      </Flex>
      {missing.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`Còn thiếu người ở ${missing.length} yêu cầu`}
          description={
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {missing.map(({ requirement, missing: count }) => (
                <li key={requirement.id}>
                  {songTitle(requirement.songId)}: thiếu {count} {requirement.skill.name}
                </li>
              ))}
            </ul>
          }
        />
      )}
      {groups.map((group) => (
        <Card
          styles={{ title: { whiteSpace: 'normal' } }}
          key={group.key}
          title={
            <Flex vertical>
              <span>{group.title}</span>
              {group.subtitle && (
                <Typography.Text style={{ color: colors.textMuted, fontWeight: 400 }}>{group.subtitle}</Typography.Text>
              )}
            </Flex>
          }
        >
          <RequirementTable
            requirements={draft.requirements.filter((item) => item.songId === group.songId)}
            assignments={draft.assignments}
            eligible={eligible}
            skills={skills}
            onAddRequirement={(skill) =>
              update((values) => ({
                ...values,
                requirements: [...values.requirements, { id: `draft-${(draftSequence += 1)}`, songId: group.songId, skill, count: 1 }],
              }))
            }
            onChangeCount={(requirementId, count) =>
              update((values) => ({
                requirements: values.requirements.map((item) => (item.id === requirementId ? { ...item, count } : item)),
                // Keep at most `count` people on the requirement.
                assignments: values.assignments.filter(
                  (item) =>
                    item.requirementId !== requirementId ||
                    values.assignments.filter((entry) => entry.requirementId === requirementId).indexOf(item) < count,
                ),
              }))
            }
            onRemoveRequirement={(requirementId) =>
              update((values) => ({
                requirements: values.requirements.filter((item) => item.id !== requirementId),
                assignments: values.assignments.filter((item) => item.requirementId !== requirementId),
              }))
            }
            onAssign={(requirementId, members) =>
              update((values) => ({
                ...values,
                assignments: [
                  ...values.assignments.filter((item) => item.requirementId !== requirementId),
                  ...members.map((member) => ({ requirementId, ...member })),
                ],
              }))
            }
          />
        </Card>
      ))}
      <SuggestionModal
        open={suggesting}
        programId={roster.programId}
        describe={describe}
        onApply={applySuggestions}
        onCancel={() => setSuggesting(false)}
      />
      <NotifyModal
        open={notifying}
        members={assignedMembers}
        sending={notify.isPending}
        onSend={handleNotify}
        onCancel={() => setNotifying(false)}
      />
      <Modal
        open={blocker.state === 'blocked'}
        title="Rời khỏi trang phân công?"
        okText="Rời khỏi trang"
        cancelText="Ở lại"
        okButtonProps={{ danger: true }}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Các thay đổi phân công chưa lưu sẽ bị mất.
      </Modal>
    </Flex>
  )
}
