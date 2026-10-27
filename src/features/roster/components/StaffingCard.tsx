import { DeleteOutlined, DownOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Flex, Input, InputNumber, Modal, Select, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { CardTitle, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import {
  useAddAssignment,
  usePersonnelRequirements,
  useRemoveAssignment,
  useReplaceAssignment,
  useSavePersonnelRequirements,
  useUpdateAssignmentNote,
} from '../hooks/useRoster'
import { rosterErrorMessage } from '../rosterErrors'
import {
  maxRequiredCount,
  type EligibleMember,
  type PersonnelRequirement,
  type RosterAssignment,
  type RosterShortage,
} from '../types'

/** A song of the approved list; `id` is the song list item id the backend keys requirements and lines by. */
export interface RosterSong {
  id: string
  title: string
  liturgicalPart?: string
}

export interface StaffingCardProps {
  programId: string
  /** A song of the approved list; absent for the whole service (organ, conductor…), staffed once for every song. */
  song?: RosterSong
  /** Active lines of this song, or of the whole service. */
  assignments: RosterAssignment[]
  /**
   * Active lines of the other tier: a member holds a skill either for the whole service or for songs, not both
   * (ROSTER_ASSIGNMENT_DUPLICATE), so those members are shown but cannot be picked.
   */
  otherLines: RosterAssignment[]
  /** Shortages of this song or of the whole service, computed by the backend. */
  shortages: RosterShortage[]
  /** Song cards: whole-service people per skill; a song needing no more than these is covered. */
  wholeServiceCounts?: Map<string, number>
  eligible: EligibleMember[]
  skills: { id: string; name: string }[]
  /** The roster is finalized: everything is read-only. */
  locked: boolean
  /** Whole-service lines finalized early: their members can still be replaced, nothing else changes. */
  linesLocked?: boolean
}

const muted = { color: colors.textMuted }

/**
 * Personnel requirements of one song (FE-35), or the whole-service roles (BE d1ca63e), with the members on each
 * position (FE-38). Requirements are edited as a set and saved together (PUT replaces them); lines are added,
 * replaced, noted and removed one at a time. A position takes members only once its requirement is saved
 * (PERSONNEL_REQUIREMENT_NOT_FOUND otherwise).
 */
export function StaffingCard({
  programId,
  song,
  assignments,
  otherLines,
  shortages,
  wholeServiceCounts,
  eligible,
  skills,
  locked,
  linesLocked = false,
}: Readonly<StaffingCardProps>) {
  const { message, modal } = App.useApp()
  const requirements = usePersonnelRequirements(programId, song?.id)
  const save = useSavePersonnelRequirements(programId, song?.id)
  const add = useAddAssignment(programId)
  const replace = useReplaceAssignment(programId)
  const remove = useRemoveAssignment(programId)
  const updateNote = useUpdateAssignmentNote(programId)
  const [draft, setDraft] = useState<PersonnelRequirement[]>()
  const [newSkillId, setNewSkillId] = useState<string>()
  const [replacing, setReplacing] = useState<RosterAssignment>()
  const [replacement, setReplacement] = useState<string>()
  const [noting, setNoting] = useState<RosterAssignment>()
  const [note, setNote] = useState('')

  const place = song ? `“${song.title}”` : 'cả buổi lễ'
  const editable = !locked && !linesLocked
  const saved = requirements.data ?? []
  const rows = draft ?? saved
  const dirty = draft !== undefined && JSON.stringify(draft) !== JSON.stringify(saved)
  const freeSkills = skills.filter((skill) => !rows.some((row) => row.skillId === skill.id))
  const change = (next: PersonnelRequirement[]) => setDraft(next)
  const failed = (fallback: string) => (error: Error) => message.error(rosterErrorMessage(error, fallback))

  const linesOf = (skillId: string) => assignments.filter((line) => line.skillId === skillId)
  // Members who answered Confirmed or Unsure and hold the skill, not on this position yet; those holding it in the
  // other tier are listed but disabled, so the Director sees why they cannot be picked.
  const candidates = (row: Pick<PersonnelRequirement, 'skillId' | 'skillName'>) =>
    eligible
      .filter((member) => member.skills.includes(row.skillName) && !linesOf(row.skillId).some((line) => line.memberId === member.memberId))
      .map((member) => {
        const elsewhere = otherLines.some((line) => line.skillId === row.skillId && line.memberId === member.memberId)
        return {
          value: member.memberId,
          label: elsewhere ? `${member.fullName} (${song ? 'đã giữ cả buổi lễ' : 'đang giữ ở bài, gỡ trước'})` : member.fullName,
          disabled: elsewhere,
        }
      })

  const handleSave = () =>
    save.mutate(rows, {
      onSuccess: () => {
        setDraft(undefined)
        message.success(song ? `Đã lưu yêu cầu nhân sự của “${song.title}”.` : 'Đã lưu vai cả buổi lễ.')
      },
      onError: failed('Không thể lưu yêu cầu nhân sự. Vui lòng thử lại.'),
    })

  const handleRemove = (line: RosterAssignment) =>
    modal.confirm({
      title: 'Gỡ ca viên khỏi vị trí?',
      content: `${line.memberName} sẽ không còn phục vụ ${line.skillName} cho ${place}.`,
      okText: 'Gỡ',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () =>
        remove
          .mutateAsync(line.id)
          .then(() => message.success(`Đã gỡ ${line.memberName}.`))
          .catch(failed('Không thể gỡ ca viên. Vui lòng thử lại.')),
    })

  const handleReplace = () => {
    if (!replacing || !replacement) return
    replace.mutate(
      { assignmentId: replacing.id, memberId: replacement },
      {
        onSuccess: () => {
          message.success('Đã thay người.')
          setReplacing(undefined)
        },
        onError: failed('Không thể thay người. Vui lòng thử lại.'),
      },
    )
  }

  const handleNote = () => {
    if (!noting || updateNote.isPending) return
    updateNote.mutate(
      { assignmentId: noting.id, note },
      {
        onSuccess: () => {
          message.success(note.trim() ? 'Đã lưu ghi chú vai.' : 'Đã xoá ghi chú vai.')
          setNoting(undefined)
        },
        onError: failed('Không thể lưu ghi chú. Vui lòng thử lại.'),
      },
    )
  }

  const coveredByWholeService = (row: PersonnelRequirement) => wholeServiceCounts?.get(row.skillId) ?? 0

  const columns: TableColumnsType<PersonnelRequirement> = [
    {
      key: 'skill',
      title: 'Kỹ năng',
      width: 150,
      render: (_, row) => (
        <Flex vertical>
          <Typography.Text strong>{row.skillName}</Typography.Text>
          {coveredByWholeService(row) > 0 && (
            <Typography.Text style={{ ...muted, fontSize: 12 }}>Cả buổi lễ: {coveredByWholeService(row)} người</Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      key: 'count',
      title: 'Số người',
      width: 110,
      render: (_, row) =>
        editable ? (
          <InputNumber
            min={1}
            max={maxRequiredCount}
            precision={0}
            value={row.requiredCount}
            aria-label={`Số người ${row.skillName}`}
            onChange={(value) =>
              value && change(rows.map((item) => (item.skillId === row.skillId ? { ...item, requiredCount: value } : item)))
            }
            style={{ width: 80 }}
          />
        ) : (
          row.requiredCount
        ),
    },
    {
      key: 'members',
      title: 'Ca viên được phân công',
      render: (_, row) => {
        const isSaved = saved.some((item) => item.skillId === row.skillId)
        const options = candidates(row)
        return (
          <Flex wrap gap={spacing.xs} align="center">
            {linesOf(row.skillId).map((line) => {
              const label = line.note ? `${line.memberName} · ${line.note}` : line.memberName
              if (locked) {
                return (
                  <Tag key={line.id} style={{ marginInlineEnd: 0 }}>
                    {label}
                  </Tag>
                )
              }
              return (
                <Dropdown
                  key={line.id}
                  trigger={['click']}
                  menu={{
                    // Once the whole-service lines are finalized early, a member can only be replaced.
                    items: [
                      { key: 'replace', label: 'Thay người' },
                      ...(linesLocked
                        ? []
                        : [
                            { key: 'note', label: line.note ? 'Sửa ghi chú vai' : 'Ghi chú vai' },
                            { key: 'remove', label: 'Gỡ khỏi vị trí', danger: true },
                          ]),
                    ],
                    onClick: ({ key }) => {
                      if (key === 'remove') handleRemove(line)
                      else if (key === 'note') {
                        setNote(line.note ?? '')
                        setNoting(line)
                      } else {
                        setReplacement(undefined)
                        setReplacing(line)
                      }
                    },
                  }}
                >
                  <Button size="small" aria-label={`${label}, ${row.skillName}: thay, ghi chú hoặc gỡ`}>
                    {label}
                    {line.source === 'suggested' && <Typography.Text style={muted}>· gợi ý</Typography.Text>}
                    <DownOutlined aria-hidden />
                  </Button>
                </Dropdown>
              )
            })}
            {editable &&
              (isSaved ? (
                <Select
                  showSearch
                  optionFilterProp="label"
                  size="small"
                  value={null}
                  aria-label={song ? `Thêm ca viên cho ${row.skillName}` : `Thêm ca viên cho ${row.skillName} (cả buổi lễ)`}
                  placeholder={options.some((option) => !option.disabled) ? 'Thêm ca viên' : 'Không còn ca viên phù hợp'}
                  notFoundContent="Không có ca viên đã nhận lời (Xác nhận hoặc Chưa chắc chắn) có kỹ năng này"
                  options={options}
                  onChange={(memberId: string) =>
                    !add.isPending &&
                    add.mutate(
                      { songListItemId: song?.id, skillId: row.skillId, memberId },
                      { onError: failed('Không thể phân công ca viên. Vui lòng thử lại.') },
                    )
                  }
                  style={{ minWidth: 200 }}
                />
              ) : (
                <Typography.Text style={muted}>Lưu yêu cầu trước khi phân công.</Typography.Text>
              ))}
          </Flex>
        )
      },
    },
    {
      key: 'status',
      title: 'Tình trạng',
      width: 130,
      render: (_, row) => {
        if (!saved.some((item) => item.skillId === row.skillId)) return <Typography.Text style={muted}>—</Typography.Text>
        const shortage = shortages.find((item) => item.skillId === row.skillId)
        if (shortage) {
          const missing = shortage.requiredCount - shortage.assignedCount
          // A song asking more than the whole service has only needs the extra people.
          return <StatusTag color="orange">{coveredByWholeService(row) > 0 ? `Cần thêm ${missing}` : `Thiếu ${missing}`}</StatusTag>
        }
        return (
          <StatusTag color="green">{coveredByWholeService(row) >= row.requiredCount ? 'Đủ (cả buổi lễ)' : 'Đủ người'}</StatusTag>
        )
      },
    },
    ...(editable
      ? [
          {
            key: 'remove',
            title: '',
            width: 56,
            align: 'right' as const,
            render: (_: unknown, row: PersonnelRequirement) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => change(rows.filter((item) => item.skillId !== row.skillId))}
                aria-label={`Bỏ yêu cầu ${row.skillName}`}
              />
            ),
          },
        ]
      : []),
  ]

  return (
    <Card
      styles={{ title: { whiteSpace: 'normal' } }}
      title={
        <Flex vertical>
          <CardTitle>{song ? song.title : 'Cả buổi lễ'}</CardTitle>
          <Typography.Text style={{ ...muted, fontWeight: 400 }}>
            {song ? song.liturgicalPart : 'Nhạc công, bắt nhịp… phục vụ suốt thánh lễ: một người giữ cho mọi bài, khai được trước khi danh sách bài được duyệt.'}
          </Typography.Text>
        </Flex>
      }
      extra={
        dirty && (
          <Flex gap={spacing.xs}>
            <Button onClick={() => setDraft(undefined)} disabled={save.isPending}>
              Hủy
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={save.isPending}>
              Lưu yêu cầu
            </Button>
          </Flex>
        )
      }
    >
      {requirements.isPending && <SectionSkeleton rows={2} label={`Đang tải yêu cầu nhân sự của ${place}`} />}
      {requirements.isError && (
        <Typography.Text type="danger">
          Không thể tải yêu cầu nhân sự.{' '}
          <Button type="link" size="small" onClick={() => requirements.refetch()}>
            Thử lại
          </Button>
        </Typography.Text>
      )}
      {requirements.isSuccess && (
        <Flex vertical gap={spacing.sm}>
          {rows.length > 0 ? (
            <Table<PersonnelRequirement>
              rowKey="skillId"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 720 }}
              size="small"
            />
          ) : (
            <Typography.Text style={muted}>{song ? 'Chưa có yêu cầu nhân sự.' : 'Chưa khai vai nào cho cả buổi lễ.'}</Typography.Text>
          )}
          {editable && (
            <Flex wrap gap={spacing.sm}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                aria-label={`Kỹ năng cần thêm cho ${song ? song.title : 'cả buổi lễ'}`}
                placeholder="Chọn kỹ năng"
                value={newSkillId}
                onChange={setNewSkillId}
                options={freeSkills.map((skill) => ({ value: skill.id, label: skill.name }))}
                style={{ flex: '1 1 200px', maxWidth: 260, minWidth: 0 }}
              />
              <Button
                icon={<PlusOutlined />}
                disabled={!newSkillId}
                onClick={() => {
                  const skill = skills.find((item) => item.id === newSkillId)
                  if (skill) change([...rows, { skillId: skill.id, skillName: skill.name, requiredCount: 1 }])
                  setNewSkillId(undefined)
                }}
              >
                {song ? 'Thêm yêu cầu' : 'Thêm vai'}
              </Button>
            </Flex>
          )}
        </Flex>
      )}
      <Modal
        open={Boolean(replacing)}
        title="Thay người"
        okText="Thay người"
        cancelText="Hủy"
        okButtonProps={{ disabled: !replacement, loading: replace.isPending }}
        cancelButtonProps={{ disabled: replace.isPending }}
        onOk={handleReplace}
        onCancel={() => setReplacing(undefined)}
        destroyOnHidden
      >
        {replacing && (
          <Flex vertical gap={spacing.sm}>
            <Typography.Text>
              {replacing.skillName} · {place}: thay {replacing.memberName} bằng
            </Typography.Text>
            <Select
              showSearch
              optionFilterProp="label"
              aria-label="Ca viên thay thế"
              placeholder="Chọn ca viên"
              value={replacement}
              onChange={setReplacement}
              notFoundContent="Không có ca viên đã nhận lời (Xác nhận hoặc Chưa chắc chắn) có kỹ năng này"
              options={candidates(replacing)}
            />
            {replacing.note && <Typography.Text style={muted}>Người mới giữ ghi chú vai “{replacing.note}”.</Typography.Text>}
          </Flex>
        )}
      </Modal>
      <Modal
        open={Boolean(noting)}
        title="Ghi chú vai"
        okText="Lưu ghi chú"
        cancelText="Hủy"
        okButtonProps={{ loading: updateNote.isPending }}
        cancelButtonProps={{ disabled: updateNote.isPending }}
        onOk={handleNote}
        onCancel={() => setNoting(undefined)}
        destroyOnHidden
      >
        {noting && (
          <Flex vertical gap={spacing.sm}>
            <Typography.Text>
              {noting.memberName} · {noting.skillName} · {place}
            </Typography.Text>
            <Input
              autoFocus
              value={note}
              maxLength={200}
              showCount
              aria-label="Ghi chú vai"
              placeholder="Ví dụ: Người dẫn truyện, Bè 1"
              onChange={(event) => setNote(event.target.value)}
            />
            <Typography.Text style={muted}>Để trống để xoá ghi chú. Ca viên thấy ghi chú này trong thông báo phân công.</Typography.Text>
          </Flex>
        )}
      </Modal>
    </Card>
  )
}
