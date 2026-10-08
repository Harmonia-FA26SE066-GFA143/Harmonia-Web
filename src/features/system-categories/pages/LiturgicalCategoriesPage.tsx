import { ColorPicker, DatePicker, Flex, Form, Tabs, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import { PageHeader } from '@/shared/ui'
import { colors, radius, spacing } from '@/styles/tokens'
import { CatalogManager } from '../components/CatalogManager'
import { descriptionColumn, descriptionField } from '../components/description'
import { useCatalogItems, useSaveCatalogItem, useSaveSeason, useSeasons } from '../hooks/useCatalogs'
import type { BasicCatalog, LiturgicalCatalog, LiturgicalSeason } from '../types'

const formatDate = (value: string) => dayjs(value).format('DD/MM/YYYY')

// The form keeps `DateOnly` strings (YYYY-MM-DD), the pickers work on dayjs values.
const dateProps = {
  getValueProps: (value?: string) => ({ value: value ? dayjs(value) : undefined }),
  normalize: (date?: Dayjs | null) => date?.format('YYYY-MM-DD'),
}

const seasonFields = (
  <>
    <Flex gap={spacing.md} wrap>
      <Form.Item
        label="Ngày bắt đầu"
        name="startDate"
        {...dateProps}
        rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu.' }]}
        style={{ flex: '1 1 160px' }}
      >
        <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        label="Ngày kết thúc"
        name="endDate"
        {...dateProps}
        dependencies={['startDate']}
        rules={[
          { required: true, message: 'Vui lòng chọn ngày kết thúc.' },
          ({ getFieldValue }) => ({
            validator: (_, end?: string) => {
              const start: string | undefined = getFieldValue('startDate')
              return !end || !start || end > start
                ? Promise.resolve()
                : Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu.'))
            },
          }),
        ]}
        style={{ flex: '1 1 160px' }}
      >
        <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
      </Form.Item>
    </Flex>
    <Form.Item
      label="Màu phụng vụ (không bắt buộc)"
      name="colorHex"
      getValueFromEvent={(color: { cleared: boolean; toHexString: () => string }) =>
        color.cleared ? null : color.toHexString()
      }
    >
      <ColorPicker
        allowClear
        disabledAlpha
        format="hex"
        showText={(color) => (color.cleared ? 'Chưa chọn màu' : color.toHexString().toUpperCase())}
      />
    </Form.Item>
  </>
)

function ColorSwatch({ colorHex }: { colorHex: string | null }) {
  if (!colorHex) return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
  // The code is shown next to the swatch, so the colour is never the only cue.
  return (
    <Flex align="center" gap={spacing.xs}>
      <span
        aria-hidden
        style={{ width: 16, height: 16, borderRadius: radius.sm, background: colorHex, border: `1px solid ${colors.border}` }}
      />
      <Typography.Text>{colorHex.toUpperCase()}</Typography.Text>
    </Flex>
  )
}

function SeasonsPanel() {
  return (
    <CatalogManager
      noun="mùa phụng vụ"
      query={useSeasons()}
      save={useSaveSeason()}
      nameMax={100}
      columns={[
        {
          key: 'period',
          title: 'Thời gian',
          render: (_, season: LiturgicalSeason) => `${formatDate(season.startDate)} – ${formatDate(season.endDate)}`,
        },
        {
          key: 'color',
          title: 'Màu',
          dataIndex: 'colorHex',
          render: (colorHex: string | null) => <ColorSwatch colorHex={colorHex} />,
        },
      ]}
      fields={seasonFields}
    />
  )
}

function BasicCatalogPanel({ catalog, noun }: { catalog: BasicCatalog; noun: string }) {
  return (
    <CatalogManager
      noun={noun}
      query={useCatalogItems(catalog)}
      save={useSaveCatalogItem(catalog)}
      columns={[descriptionColumn]}
      fields={descriptionField}
    />
  )
}

/** The four catalogs Report 1 FE-50 lists, in its order. */
const tabs: { key: LiturgicalCatalog; label: string; children: ReactNode }[] = [
  { key: 'seasons', label: 'Mùa phụng vụ', children: <SeasonsPanel /> },
  { key: 'massTypes', label: 'Loại Thánh lễ', children: <BasicCatalogPanel catalog="massTypes" noun="loại Thánh lễ" /> },
  {
    key: 'ceremonyTypes',
    label: 'Loại nghi thức',
    children: <BasicCatalogPanel catalog="ceremonyTypes" noun="loại nghi thức" />,
  },
  {
    key: 'eventCategories',
    label: 'Danh mục sự kiện',
    children: <BasicCatalogPanel catalog="eventCategories" noun="danh mục sự kiện" />,
  },
]

/** Admin: liturgical seasons, Mass types, ceremony types and event categories (FE-50). */
export function LiturgicalCategoriesPage() {
  return (
    <>
      <PageHeader
        title="Danh mục phụng vụ"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Danh mục phụng vụ' }]}
        description="Cấu hình mùa phụng vụ, loại Thánh lễ, loại nghi thức và danh mục sự kiện."
      />
      <Tabs destroyOnHidden items={tabs} />
    </>
  )
}
