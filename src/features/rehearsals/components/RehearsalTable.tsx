import { CheckSquareOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Typography, type TableColumnsType } from 'antd'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { colors, typography } from '@/styles/tokens'
import { formatRehearsalTime } from '../rehearsalFormat'
import type { Rehearsal } from '../types'

export interface RehearsalTableProps {
  rehearsals: Rehearsal[]
  programs: Map<string, LiturgicalProgram>
  onTakeAttendance: (rehearsal: Rehearsal) => void
  onEdit: (rehearsal: Rehearsal) => void
  onDelete: (rehearsal: Rehearsal) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

export function RehearsalTable({ rehearsals, programs, onTakeAttendance, onEdit, onDelete }: RehearsalTableProps) {
  const columns: TableColumnsType<Rehearsal> = [
    {
      key: 'name',
      title: 'Buổi tập',
      render: (_, rehearsal) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{rehearsal.name}</Typography.Text>
          {rehearsal.note && (
            <Typography.Text style={muted} ellipsis={{ tooltip: rehearsal.note }}>
              {rehearsal.note}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      key: 'program',
      title: 'Chương trình phụng vụ',
      render: (_, rehearsal) => {
        const program = programs.get(rehearsal.programId)
        if (!program) return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        return (
          <Flex vertical gap={2}>
            <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>{program.eventName}</Link>
            <Typography.Text style={{ ...muted, fontFamily: typography.fontFamilyNumeric }}>{formatProgramDate(program.date)}</Typography.Text>
          </Flex>
        )
      },
    },
    {
      key: 'time',
      title: 'Thời gian & địa điểm',
      render: (_, rehearsal) => (
        <Flex vertical gap={2}>
          <Typography.Text>{formatRehearsalTime(rehearsal)}</Typography.Text>
          {rehearsal.location && <Typography.Text style={muted}>{rehearsal.location}</Typography.Text>}
        </Flex>
      ),
    },
    {
      key: 'songs',
      title: 'Bài hát tập',
      render: (_, rehearsal) =>
        rehearsal.songs.length === 0 ? (
          <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        ) : (
          <ul style={{ margin: 0, paddingInlineStart: 18 }}>
            {rehearsal.songs.map((song) => (
              <li key={song.songId}>{song.title}</li>
            ))}
          </ul>
        ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, rehearsal) => (
        <Flex justify="flex-end" gap={4}>
          <Button type="link" icon={<CheckSquareOutlined />} onClick={() => onTakeAttendance(rehearsal)}>
            Điểm danh
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(rehearsal)} aria-label={`Sửa ${rehearsal.name}`} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(rehearsal)}
            aria-label={`Xoá ${rehearsal.name}`}
          />
        </Flex>
      ),
    },
  ]

  return <Table<Rehearsal> rowKey="id" columns={columns} dataSource={rehearsals} pagination={false} scroll={{ x: 900 }} />
}
