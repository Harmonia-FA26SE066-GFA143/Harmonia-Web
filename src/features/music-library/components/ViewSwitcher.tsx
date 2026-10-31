import { TableOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Flex, Radio, Typography, type RadioChangeEvent } from 'antd'
import { colors, spacing, typography } from '@/styles/tokens'
import type { DensityMode, ViewMode } from './viewStorage'

export interface ViewSwitcherProps {
  view: ViewMode
  density: DensityMode
  onViewChange: (view: ViewMode) => void
  onDensityChange: (density: DensityMode) => void
}

/**
 * View switcher for the music library: toggles between index list and table mode,
 * and controls display density (compact / comfortable) with localStorage persistence.
 */
export function ViewSwitcher({
  view,
  density,
  onViewChange,
  onDensityChange,
}: Readonly<ViewSwitcherProps>) {
  return (
    <Flex align="center" gap={spacing.md} wrap="wrap">
      <Flex align="center" gap={spacing.xs}>
        <Typography.Text
          style={{
            fontSize: typography.metadata.fontSize,
            color: colors.textMuted,
            userSelect: 'none',
          }}
        >
          Chế độ xem
        </Typography.Text>
        <Radio.Group
          optionType="button"
          value={view}
          aria-label="Chế độ xem danh sách"
          onChange={(event: RadioChangeEvent) => onViewChange(event.target.value as ViewMode)}
        >
          <Radio.Button value="index">
            <UnorderedListOutlined aria-hidden style={{ marginInlineEnd: spacing.xs }} />
            Mục lục
          </Radio.Button>
          <Radio.Button value="table">
            <TableOutlined aria-hidden style={{ marginInlineEnd: spacing.xs }} />
            Bảng
          </Radio.Button>
        </Radio.Group>
      </Flex>

      <Flex align="center" gap={spacing.xs}>
        <Typography.Text
          style={{
            fontSize: typography.metadata.fontSize,
            color: colors.textMuted,
            userSelect: 'none',
          }}
        >
          Mật độ
        </Typography.Text>
        <Radio.Group
          optionType="button"
          value={density}
          aria-label="Mật độ hiển thị"
          onChange={(event: RadioChangeEvent) => onDensityChange(event.target.value as DensityMode)}
        >
          <Radio.Button value="comfortable">Thoải mái</Radio.Button>
          <Radio.Button value="compact">Gọn</Radio.Button>
        </Radio.Group>
      </Flex>
    </Flex>
  )
}

