import { PlayCircleOutlined } from '@ant-design/icons'
import { Button, Flex, Modal, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { formatDateTime } from '@/lib/api/dates'
import { colors, spacing, typography } from '@/styles/tokens'
import { skillLevelLabels, type PendingSkill, type SkillEvidence } from '../types'

export interface PendingSkillTableProps {
  skills: PendingSkill[]
  /** Server-side paging of GET /api/member-skills/pending. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  /** Id of the declaration being decided; its buttons are disabled meanwhile. */
  busyId?: string
  onPageChange: (page: number) => void
  onApprove: (skill: PendingSkill) => void
  onReject: (skill: PendingSkill) => void
}

const muted = { color: colors.textMuted }

export function PendingSkillTable({
  skills,
  page,
  pageSize,
  total,
  loading,
  busyId,
  onPageChange,
  onApprove,
  onReject,
}: Readonly<PendingSkillTableProps>) {
  const [clip, setClip] = useState<{ skill: PendingSkill; evidence: SkillEvidence }>()
  const columns: TableColumnsType<PendingSkill> = [
    {
      key: 'member',
      title: 'Ca viên',
      dataIndex: 'memberName',
      render: (memberName: string) => <Typography.Text strong>{memberName}</Typography.Text>,
    },
    {
      key: 'skill',
      title: 'Kỹ năng',
      render: (_, skill) => (
        <Flex vertical>
          <Typography.Text>{skill.skillName}</Typography.Text>
          <Typography.Text style={{ ...muted, fontSize: typography.metadata.fontSize }}>{skill.categoryName}</Typography.Text>
        </Flex>
      ),
    },
    {
      key: 'level',
      title: 'Trình độ',
      dataIndex: 'level',
      render: (level?: PendingSkill['level']) =>
        level ? (
          <Tag style={{ marginInlineEnd: 0 }}>{skillLevelLabels[level]}</Tag>
        ) : (
          <Typography.Text style={muted}>Không nêu</Typography.Text>
        ),
    },
    {
      key: 'evidence',
      title: 'Minh chứng',
      render: (_, skill) => {
        const { evidence } = skill
        if (!evidence) return <Typography.Text style={muted}>Không gửi</Typography.Text>
        return evidence.kind === 'voice' ? (
          <audio controls preload="none" src={evidence.url} aria-label={`Nghe minh chứng ${skill.skillName} của ${skill.memberName}`} style={{ height: 36, width: 240 }} />
        ) : (
          <Button icon={<PlayCircleOutlined />} onClick={() => setClip({ skill, evidence })} aria-label={`Xem clip ${skill.skillName} của ${skill.memberName}`}>
            Xem clip
          </Button>
        )
      },
    },
    {
      key: 'declaredAt',
      title: 'Ngày khai báo',
      dataIndex: 'declaredAt',
      render: (declaredAt: string) => (
        <Typography.Text style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatDateTime(declaredAt)}
        </Typography.Text>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, skill) => (
        <Flex gap={spacing.xs} justify="flex-end">
          <Button
            type="primary"
            data-action="approve"
            disabled={busyId === skill.id}
            onClick={() => onApprove(skill)}
            aria-label={`Duyệt ${skill.skillName} của ${skill.memberName}`}
          >
            Duyệt
          </Button>
          <Button
            danger
            disabled={busyId === skill.id}
            onClick={() => onReject(skill)}
            aria-label={`Từ chối ${skill.skillName} của ${skill.memberName}`}
          >
            Từ chối
          </Button>
        </Flex>
      ),
    },
  ]

  return (
    <>
      <Table<PendingSkill>
        rowKey="id"
        columns={columns}
        dataSource={skills}
        loading={loading}
        pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: onPageChange }}
        scroll={{ x: 'max-content' }}
      />
      {/* The signed link expires; the list is read again on focus, which renews it. */}
      <Modal
        open={Boolean(clip)}
        title={clip ? `${clip.skill.skillName} · ${clip.skill.memberName}` : undefined}
        footer={null}
        width={720}
        destroyOnHidden
        onCancel={() => setClip(undefined)}
      >
        {clip && (
          <video controls autoPlay src={clip.evidence.url} aria-label={`Clip minh chứng: ${clip.evidence.fileName}`} style={{ width: '100%', borderRadius: 8 }} />
        )}
      </Modal>
    </>
  )
}
