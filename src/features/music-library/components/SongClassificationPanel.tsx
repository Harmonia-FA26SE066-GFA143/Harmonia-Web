import { EditOutlined } from '@ant-design/icons'
import { Button, Descriptions, Flex, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import type { NamedRef, SkillRequirement, SongClassification } from '../types'

const unclassified = (
  <Typography.Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>Chưa phân loại</Typography.Text>
)

function tags(labels: string[]): ReactNode {
  if (labels.length === 0) return unclassified
  return (
    <Flex wrap gap={4}>
      {labels.map((label) => (
        <Tag key={label} style={{ marginInlineEnd: 0 }}>
          {label}
        </Tag>
      ))}
    </Flex>
  )
}

const names = (refs: NamedRef[]) => refs.map((ref) => ref.name)
const requirements = (items: SkillRequirement[]) =>
  items.map((item) => `${item.skillName} ×${item.requiredCount}${item.isMandatory ? ' (bắt buộc)' : ''}`)

export interface SongClassificationPanelProps {
  classification?: SongClassification | null
  loading?: boolean
  failed?: boolean
  error?: unknown
  hasData?: boolean
  onRetry?: () => void
  onEdit?: () => void
}

/**
 * The FE-29 dimensions of one song, each with any number of values (GET /api/songs/{id}/classification). The
 * "Phân loại" tab of the song page.
 */
export function SongClassificationPanel({ classification, loading, failed, error, hasData, onRetry, onEdit }: Readonly<SongClassificationPanelProps>) {
  return (
    <Flex vertical gap={spacing.md}>
      {onEdit && (
        <Button icon={<EditOutlined />} onClick={onEdit} disabled={!classification} style={{ alignSelf: 'flex-end' }}>
          Chỉnh sửa phân loại
        </Button>
      )}
      {loading && <SectionSkeleton rows={2} label="Đang tải phân loại" />}
      {failed && <ErrorState headingLevel={2} title="Không thể tải phân loại" error={error} hasData={hasData} onRetry={onRetry} />}
      {classification && (
        <Descriptions
          layout="vertical"
          colon={false}
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { key: 'season', label: 'Mùa phụng vụ', children: tags(names(classification.liturgicalSeasons)) },
            { key: 'massType', label: 'Loại Thánh lễ', children: tags(names(classification.massTypes)) },
            { key: 'ceremonyType', label: 'Loại nghi thức', children: tags(names(classification.ceremonyTypes)) },
            { key: 'theme', label: 'Chủ đề', children: tags(names(classification.songThemes)) },
            { key: 'slot', label: 'Phần phụng vụ', children: tags(names(classification.liturgicalSlots)) },
            { key: 'vocal', label: 'Yêu cầu bè giọng', children: tags(requirements(classification.vocalRequirements)) },
            {
              key: 'instrument',
              label: 'Yêu cầu nhạc cụ',
              children: tags(requirements(classification.instrumentRequirements)),
            },
          ]}
        />
      )}
    </Flex>
  )
}
