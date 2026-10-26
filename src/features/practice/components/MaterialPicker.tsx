import { CustomerServiceOutlined, ExportOutlined, FileTextOutlined, FolderOpenOutlined, ReadOutlined } from '@ant-design/icons'
import { Button, Checkbox, Flex, Tag, Typography } from 'antd'
import type { ComponentType } from 'react'
import { materialKindLabels, type SongMaterial } from '@/features/music-library'
import { colors, radius, spacing, typography } from '@/styles/tokens'

const kindIcons: Record<SongMaterial['kind'], ComponentType> = {
  sheetMusic: ReadOutlined,
  lyrics: FileTextOutlined,
  sampleAudio: CustomerServiceOutlined,
  rehearsalMaterial: FolderOpenOutlined,
}

const isAudio = ({ fileName }: SongMaterial) => /\.(mp3|m4a|wav)$/i.test(fileName)

/**
 * The song's materials as choices, each with its kind and a preview (play the audio, open the sheet), so the Director
 * sees what members will receive. Value: the chosen material ids, in the order of the list.
 */
export function MaterialPicker({
  materials,
  value,
  onChange,
}: Readonly<{ materials: SongMaterial[]; value?: string[]; onChange?: (value: string[]) => void }>) {
  return (
    <Checkbox.Group value={value} onChange={onChange} style={{ width: '100%' }}>
      <Flex vertical gap={spacing.sm} style={{ width: '100%' }}>
        {materials.map((material) => {
          const Icon = kindIcons[material.kind]
          const selected = value?.includes(material.id)
          return (
            <Flex
              key={material.id}
              wrap
              align="center"
              gap={spacing.sm}
              style={{
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radius.md,
                border: `1px solid ${selected ? colors.primary : colors.border}`,
                background: selected ? colors.primarySoft : colors.surface,
              }}
            >
              <Checkbox value={material.id} style={{ flex: '1 1 240px', minWidth: 0 }}>
                <Flex align="center" gap={spacing.sm}>
                  <span aria-hidden style={{ color: colors.primary, fontSize: 18 }}>
                    <Icon />
                  </span>
                  <span>
                    <Typography.Text strong>{material.title}</Typography.Text>
                    <br />
                    <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                      {materialKindLabels[material.kind]}
                      {material.targetSkillName ? '' : ' · cả ca đoàn'}
                    </Typography.Text>
                  </span>
                  {material.targetSkillName && <Tag style={{ marginInlineEnd: 0 }}>{material.targetSkillName}</Tag>}
                </Flex>
              </Checkbox>
              {isAudio(material) ? (
                <audio controls preload="none" src={material.url} aria-label={`Nghe ${material.title}`} style={{ height: 36, maxWidth: '100%' }} />
              ) : (
                <Button
                  type="link"
                  icon={<ExportOutlined />}
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Mở ${material.title} (tab mới)`}
                >
                  Mở
                </Button>
              )}
            </Flex>
          )
        })}
      </Flex>
    </Checkbox.Group>
  )
}
