import { DeleteOutlined, DownOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Flex, InputNumber, Modal, Select, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { useAddAssignment, usePersonnelRequirements, useRemoveAssignment, useReplaceAssignment, useSavePersonnelRequirements } from '../hooks/useRoster'
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

export interface SongStaffingCardProps {
  programId: string
  song: RosterSong
  /** Active lines of this song. */
  assignments: RosterAssignment[]
  /** Shortages of this song, computed by the backend. */
  shortages: RosterShortage[]
  eligible: EligibleMember[]
  skills: { id: string; name: string }[]
  /** The roster is finalized: everything is read-only. */
  locked: boolean
}

/**
 * Personnel requirements of one song (FE-35) with the members on each position (FE-38). Requirements are edited as
 * a set and saved together (PUT replaces them); lines are added, replaced and removed one at a time. A position
 * takes members only once its requirement is saved (PERSONNEL_REQUIREMENT_NOT_FOUND otherwise).
 */
export function SongStaffingCard({ programId, song, assignments, shortages, eligible, skills, locked }: SongStaffingCardProps) {
  const { message, modal } = App.useApp()
  const requirements = usePersonnelRequirements(programId, song.id)
  const save = useSavePersonnelRequirements(programId, song.id)
  const add = useAddAssignment(programId)
  const replace = useReplaceAssignment(programId)
  const remove = useRemoveAssignment(programId)
  const [draft, setDraft] = useState<PersonnelRequirement[]>()
  const [newSkillId, setNewSkillId] = useState<string>()
  const [replacing, setReplacing] = useState<RosterAssignment>()
  const [replacement, setReplacement] = useState<string>()

  const saved = requirements.data ?? []
  const rows = draft ?? saved
  const dirty = draft !== undefined && JSON.stringify(draft) !== JSON.stringify(saved)
  const freeSkills = skills.filter((skill) => !rows.some((row) => row.skillId === skill.id))
  const change = (next: PersonnelRequirement[]) => setDraft(next)
  const failed = (fallback: string) => (error: Error) => message.error(rosterErrorMessage(error, fallback))

  const linesOf = (skillId: string) => assignments.filter((line) => line.skillId === skillId)
  // Members confirmed for the program who hold the skill and are not on this position yet.
  const candidates = (row: Pick<PersonnelRequirement, 'skillId' | 'skillName'>) =>
    eligible.filter(
      (member) => member.skills.includes(row.skillName) && !linesOf(row.skillId).some((line) => line.memberId === member.memberId),
    )

  const handleSave = () =>
    save.mutate(rows, {
      onSuccess: () => {
        setDraft(undefined)
        message.success(`Đã lưu yêu cầu nhân sự của “${song.title}”.`)
      },
      onError: failed('Không thể lưu yêu cầu nhân sự. Vui lòng thử lại.'),
    })

  const handleRemove = (line: RosterAssignment) =>
    modal.confirm({
      title: 'Gỡ ca viên khỏi vị trí?',
      content: `${line.memberName} sẽ không còn phục vụ ${line.skillName} cho “${song.title}”.`,
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

  const columns: TableColumnsType<PersonnelRequirement> = [
    { key: 'skill', title: 'Kỹ năng', width: 150, render: (_, row) => <Typography.Text strong>{row.skillName}</Typography.Text> },
    {
      key: 'count',
      title: 'Số người',
      width: 110,
      render: (_, row) =>
        locked ? (
          row.requiredCount
        ) : (
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
        ),
    },
    {
      key: 'members',
      title: 'Ca viên được phân công',
      render: (_, row) => {
        const isSaved = saved.some((item) => item.skillId === row.skillId)
        const options = candidates(row).map((member) => ({ value: member.memberId, label: member.fullName }))
        return (
          <Flex wrap gap={spacing.xs} align="center">
            {linesOf(row.skillId).map((line) =>
              locked ? (
                <Tag key={line.id} style={{ marginInlineEnd: 0 }}>
                  {line.memberName}
                </Tag>
              ) : (
                <Dropdown
                  key={line.id}
                  trigger={['click']}
                  menu={{
                    items: [
                      { key: 'replace', label: 'Thay người' },
                      { key: 'remove', label: 'Gỡ khỏi vị trí', danger: true },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'remove') handleRemove(line)
                      else {
                        setReplacement(undefined)
                        setReplacing(line)
                      }
                    },
                  }}
                >
                  <Button size="small" aria-label={`${line.memberName}, ${row.skillName}: thay hoặc gỡ`}>
                    {line.memberName}
                    {line.source === 'suggested' && <Typography.Text style={{ color: colors.textMuted }}>· gợi ý</Typography.Text>}
                    <DownOutlined aria-hidden />
                  </Button>
                </Dropdown>
              ),
            )}
            {!locked &&
              (isSaved ? (
                <Select
                  showSearch
                  optionFilterProp="label"
                  size="small"
                  value={null}
                  disabled={add.isPending}
                  aria-label={`Thêm ca viên cho ${row.skillName}`}
                  placeholder={options.length ? 'Thêm ca viên' : 'Không còn ca viên phù hợp'}
                  notFoundContent="Không có ca viên đã xác nhận có kỹ năng này"
                  options={options}
                  onChange={(memberId: string) =>
                    add.mutate(
                      { songListItemId: song.id, skillId: row.skillId, memberId },
                      { onError: failed('Không thể phân công ca viên. Vui lòng thử lại.') },
                    )
                  }
                  style={{ minWidth: 180 }}
                />
              ) : (
                <Typography.Text style={{ color: colors.textMuted }}>Lưu yêu cầu trước khi phân công.</Typography.Text>
              ))}
          </Flex>
        )
      },
    },
    {
      key: 'status',
      title: 'Tình trạng',
      width: 110,
      render: (_, row) => {
        if (!saved.some((item) => item.skillId === row.skillId)) return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        const shortage = shortages.find((item) => item.skillId === row.skillId)
        return shortage ? (
          <Tag color="orange">Thiếu {shortage.requiredCount - shortage.assignedCount}</Tag>
        ) : (
          <Tag color="green">Đủ người</Tag>
        )
      },
    },
    ...(locked
      ? []
      : [
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
        ]),
  ]

  return (
    <Card
      styles={{ title: { whiteSpace: 'normal' } }}
      title={
        <Flex vertical>
          <span>{song.title}</span>
          {song.liturgicalPart && (
            <Typography.Text style={{ color: colors.textMuted, fontWeight: 400 }}>{song.liturgicalPart}</Typography.Text>
          )}
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
      {requirements.isPending && <SectionSkeleton rows={2} label={`Đang tải yêu cầu nhân sự của ${song.title}`} />}
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
            <Typography.Text style={{ color: colors.textMuted }}>Chưa có yêu cầu nhân sự.</Typography.Text>
          )}
          {!locked && (
            <Flex wrap gap={spacing.sm}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                aria-label={`Kỹ năng cần thêm cho ${song.title}`}
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
                Thêm yêu cầu
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
              {replacing.skillName} · “{song.title}”: thay {replacing.memberName} bằng
            </Typography.Text>
            <Select
              showSearch
              optionFilterProp="label"
              aria-label="Ca viên thay thế"
              placeholder="Chọn ca viên"
              value={replacement}
              onChange={setReplacement}
              notFoundContent="Không có ca viên đã xác nhận có kỹ năng này"
              options={candidates(replacing).map((member) => ({ value: member.memberId, label: member.fullName }))}
            />
          </Flex>
        )}
      </Modal>
    </Card>
  )
}
