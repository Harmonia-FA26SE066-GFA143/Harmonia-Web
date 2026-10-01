import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Flex, InputNumber, Select, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { colors, spacing } from '@/styles/tokens'
import { isEligible, type EligibleMember, type RosterAssignment, type RosterRequirement, type RosterSkill } from '../types'

export interface RequirementTableProps {
  requirements: RosterRequirement[]
  assignments: RosterAssignment[]
  eligible: EligibleMember[]
  skills: RosterSkill[]
  onAddRequirement: (skill: RosterSkill) => void
  onChangeCount: (requirementId: string, count: number) => void
  onRemoveRequirement: (requirementId: string) => void
  onAssign: (requirementId: string, members: { memberId: string; fullName: string }[]) => void
}

/**
 * Requirements of one group (a song, or the whole program) with their assignments (FE-35, FE-37, FE-38). Only
 * confirmed members holding the required skill are offered (decision 2026-10-01). Skills are matched by name until
 * the API contract defines skill ids on members (TBD).
 */
export function RequirementTable({
  requirements,
  assignments,
  eligible,
  skills,
  onAddRequirement,
  onChangeCount,
  onRemoveRequirement,
  onAssign,
}: RequirementTableProps) {
  const [newSkillId, setNewSkillId] = useState<string>()
  // UI normalisation, not a business rule: one row per skill in a group; the count covers several people.
  const freeSkills = skills.filter((skill) => !requirements.some((item) => item.skill.id === skill.id))

  const columns: TableColumnsType<RosterRequirement> = [
    { key: 'skill', title: 'Kỹ năng', width: 160, render: (_, item) => <Typography.Text strong>{item.skill.name}</Typography.Text> },
    {
      key: 'count',
      title: 'Số người',
      width: 110,
      render: (_, item) => (
        <InputNumber
          min={1}
          precision={0}
          value={item.count}
          aria-label={`Số người ${item.skill.name}`}
          onChange={(value) => value && onChangeCount(item.id, value)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      key: 'members',
      title: 'Ca viên được phân công',
      render: (_, item) => {
        const assigned = assignments.filter((entry) => entry.requirementId === item.id)
        // Members no longer eligible stay visible with a mark; they do not fill the position.
        const options = new Map(
          assigned.map((entry) => [
            entry.memberId,
            isEligible(eligible, entry.memberId, item) ? entry.fullName : `${entry.fullName} (không còn đủ điều kiện)`,
          ]),
        )
        for (const member of eligible) {
          if (member.skills.includes(item.skill.name) && !options.has(member.memberId)) options.set(member.memberId, member.fullName)
        }
        return (
          <Select
            mode="multiple"
            allowClear
            maxCount={item.count}
            aria-label={`Ca viên cho ${item.skill.name}`}
            placeholder={options.size ? 'Chọn ca viên' : 'Chưa có ca viên đã xác nhận có kỹ năng này'}
            value={assigned.map((entry) => entry.memberId)}
            options={[...options].map(([value, label]) => ({ value, label }))}
            optionFilterProp="label"
            onChange={(memberIds: string[]) =>
              onAssign(
                item.id,
                memberIds.map((memberId) => ({
                  memberId,
                  fullName: assigned.find((entry) => entry.memberId === memberId)?.fullName ?? options.get(memberId) ?? memberId,
                })),
              )
            }
            style={{ width: '100%', minWidth: 220 }}
          />
        )
      },
    },
    {
      key: 'status',
      title: 'Tình trạng',
      width: 120,
      render: (_, item) => {
        const missing =
          item.count - assignments.filter((entry) => entry.requirementId === item.id && isEligible(eligible, entry.memberId, item)).length
        return missing > 0 ? <Tag color="orange">Thiếu {missing}</Tag> : <Tag color="green">Đủ người</Tag>
      },
    },
    {
      key: 'remove',
      title: '',
      width: 56,
      align: 'right',
      render: (_, item) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onRemoveRequirement(item.id)}
          aria-label={`Bỏ yêu cầu ${item.skill.name}`}
        />
      ),
    },
  ]

  return (
    <Flex vertical gap={spacing.sm}>
      {requirements.length > 0 ? (
        <Table<RosterRequirement> rowKey="id" columns={columns} dataSource={requirements} pagination={false} scroll={{ x: 720 }} size="small" />
      ) : (
        <Typography.Text style={{ color: colors.textMuted }}>Chưa có yêu cầu nhân sự.</Typography.Text>
      )}
      <Flex wrap gap={spacing.sm}>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          aria-label="Kỹ năng cần thêm"
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
            if (skill) onAddRequirement(skill)
            setNewSkillId(undefined)
          }}
        >
          Thêm yêu cầu
        </Button>
      </Flex>
    </Flex>
  )
}
