import { ColorPicker, DatePicker, Flex, Form, Input, InputNumber, Tabs, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { PageHeader } from '@/shared/ui'
import { dateOnlyFieldProps } from '@/shared/utils/dateField'
import { colors, radius, spacing } from '@/styles/tokens'
import { CatalogManager } from '../components/CatalogManager'
import { descriptionColumn, descriptionField } from '../components/description'
import { LiturgicalNamesPanel } from '../components/LiturgicalNamesPanel'
import { MassSchedulesPanel } from '../components/MassSchedulesPanel'
import { SlotRequirementsCell } from '../components/SlotRequirements'
import { SongThemesPanel } from '../components/SongThemesPanel'
import {
  useCatalogItems,
  useLocations,
  useSaveCatalogItem,
  useSaveLocation,
  useSaveSeason,
  useSaveSlot,
  useSeasons,
  useSlots,
} from '../hooks/useCatalogs'
import type { BasicCatalog, LiturgicalCatalog, LiturgicalSeason, LiturgicalSlot } from '../types'

const formatDate = (value: string) => dayjs(value).format('DD/MM/YYYY')

const seasonFields = (
  <>
    <Flex gap={spacing.md} wrap>
      <Form.Item
        label="Ngày bắt đầu"
        name="startDate"
        {...dateOnlyFieldProps}
        rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu.' }]}
        style={{ flex: '1 1 160px' }}
      >
        <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        label="Ngày kết thúc"
        name="endDate"
        {...dateOnlyFieldProps}
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

function ColorSwatch({ colorHex }: Readonly<{ colorHex: string | null }>) {
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

const muted = (text: string) => <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>

function SlotsPanel() {
  return (
    <CatalogManager
      noun="phần phụng vụ"
      query={useSlots()}
      save={useSaveSlot()}
      nameMax={100}
      columns={[
        { key: 'order', title: 'Thứ tự mặc định', dataIndex: 'defaultOrder' },
        { key: 'requirements', title: 'Người cần mặc định', render: (_, slot: LiturgicalSlot) => <SlotRequirementsCell slot={slot} /> },
      ]}
      fields={
        <Form.Item
          label="Thứ tự mặc định"
          name="defaultOrder"
          extra="Vị trí của phần này trong Thánh lễ; danh sách chọn sắp theo thứ tự này."
          rules={[{ required: true, message: 'Vui lòng nhập thứ tự mặc định.' }]}
        >
          <InputNumber min={0} precision={0} style={{ width: 160 }} />
        </Form.Item>
      }
    />
  )
}

function LocationsPanel() {
  return (
    <CatalogManager
      noun="nơi cử hành"
      query={useLocations()}
      save={useSaveLocation()}
      nameMax={100}
      columns={[
        {
          key: 'address',
          title: 'Địa chỉ',
          dataIndex: 'address',
          render: (address: string | null) => address || muted('Chưa có địa chỉ'),
        },
      ]}
      fields={
        <Form.Item label="Địa chỉ (không bắt buộc)" name="address" rules={[{ max: 300, message: 'Địa chỉ tối đa 300 ký tự.' }]}>
          <Input.TextArea rows={2} showCount maxLength={300} />
        </Form.Item>
      }
    />
  )
}

function BasicCatalogPanel({ catalog, noun }: Readonly<{ catalog: BasicCatalog; noun: string }>) {
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

/**
 * The four catalogs Report 1 FE-50 lists, in its order, then the three the backend added (LookupsController) and the
 * fixed Mass times (MassSchedulesController) and the Vietnamese names of the liturgical calendar
 * (LiturgicalNameTranslationsController).
 */
const tabs: { key: LiturgicalCatalog | 'massSchedules' | 'liturgicalNames'; label: string; children: ReactNode }[] = [
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
  { key: 'songThemes', label: 'Chủ đề bài hát', children: <SongThemesPanel /> },
  { key: 'liturgicalSlots', label: 'Phần phụng vụ', children: <SlotsPanel /> },
  { key: 'worshipLocations', label: 'Nơi cử hành', children: <LocationsPanel /> },
  { key: 'massSchedules', label: 'Giờ lễ cố định', children: <MassSchedulesPanel /> },
  { key: 'liturgicalNames', label: 'Tên phụng vụ', children: <LiturgicalNamesPanel /> },
]

/**
 * Admin: liturgical seasons, Mass types, ceremony types, event categories, song themes, liturgical slots, worship
 * locations (FE-50), the fixed weekly Mass times and the Vietnamese names of the liturgical calendar.
 */
export function LiturgicalCategoriesPage() {
  const [tab, setTab] = useUrlTab(
    tabs.map(({ key }) => key),
    'seasons',
  )
  return (
    <>
      <PageHeader
        title="Danh mục phụng vụ"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Danh mục phụng vụ' }]}
      />
      <Tabs destroyOnHidden activeKey={tab} onChange={setTab} items={tabs} />
    </>
  )
}
