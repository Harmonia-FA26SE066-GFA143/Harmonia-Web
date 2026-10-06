import { Card, Descriptions, Flex, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors } from '@/styles/tokens'
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
  items.map((item) => (item.isMandatory ? `${item.skillName} (bắt buộc)` : item.skillName))

export interface SongClassificationCardProps {
  classification?: SongClassification | null
  loading?: boolean
  failed?: boolean
  onRetry?: () => void
}

/** The FE-29 dimensions of one song, each with any number of values (GET /api/songs/{id}/classification). */
export function SongClassificationCard({ classification, loading, failed, onRetry }: SongClassificationCardProps) {
  return (
    <Card title="Phân loại">
      {loading && <SectionSkeleton rows={2} label="Đang tải phân loại" />}
      {failed && <ErrorState title="Không thể tải phân loại" onRetry={onRetry} />}
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
            { key: 'vocal', label: 'Yêu cầu bè giọng', children: tags(requirements(classification.vocalRequirements)) },
            {
              key: 'instrument',
              label: 'Yêu cầu nhạc cụ',
              children: tags(requirements(classification.instrumentRequirements)),
            },
          ]}
        />
      )}
    </Card>
  )
}
