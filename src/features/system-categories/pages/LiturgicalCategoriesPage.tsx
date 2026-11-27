import { ColorPicker, DatePicker, Flex, Input, InputNumber, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { KeyboardEvent, ReactNode } from 'react'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { EmptyCell, Form, PageHeader, SELECT_POPUP_PROPS } from '@/shared/ui'
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
import { calendarSeasonLabels, type BasicCatalog, type LiturgicalCatalog, type LiturgicalSeason, type LiturgicalSlot } from '../types'

const formatDate = (value: string) => dayjs(value).format('DD/MM/YYYY')

const calendarKeyOptions = Object.entries(calendarSeasonLabels).map(([value, label]) => ({ value, label }))

/** A keyed season spans every year; dates, when given, come as a pair (SaveLiturgicalSeasonRequestValidator, BE a395ce0). */
const periodOf = (season: LiturgicalSeason): ReactNode => {
  const dates = season.startDate && season.endDate ? `${formatDate(season.startDate)} – ${formatDate(season.endDate)}` : undefined
  if (!season.calendarKey) return dates ?? <EmptyCell />
  const key = `Theo lịch: ${calendarSeasonLabels[season.calendarKey]}`
  return dates ? `${key} · ${dates}` : `${key} (hằng năm)`
}

// A keyed season may leave out both dates, never just one; a season without a key needs both.
const dateRequired = (other: 'startDate' | 'endDate', message: string) =>
  ({ getFieldValue }: { getFieldValue: (name: string) => unknown }) => ({
    validator: (_: unknown, value?: string | null) =>
      value || (getFieldValue('calendarKey') && !getFieldValue(other)) ? Promise.resolve() : Promise.reject(new Error(message)),
  })

const seasonFields = (
  <>
    <Form.Item
      label="Theo mùa của lịch phụng vụ"
      name="calendarKey"
      normalize={(value?: string) => value ?? null}
      extra="Chọn khi mùa này lặp lại hằng năm theo lịch phụng vụ; khi đó có thể bỏ trống ngày."
    >
      <Select {...SELECT_POPUP_PROPS} allowClear placeholder="Không gắn với lịch" options={calendarKeyOptions} aria-label="Theo mùa của lịch phụng vụ" />
    </Form.Item>
    <Flex gap={spacing.md} wrap>
      <Form.Item
        label="Ngày bắt đầu"
        name="startDate"
        {...dateOnlyFieldProps}
        dependencies={['calendarKey', 'endDate']}
        rules={[dateRequired('endDate', 'Vui lòng chọn ngày bắt đầu.')]}
        style={{ flex: '1 1 160px' }}
      >
        <DatePicker {...SELECT_POPUP_PROPS} format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        label="Ngày kết thúc"
        name="endDate"
        {...dateOnlyFieldProps}
        dependencies={['calendarKey', 'startDate']}
        rules={[
          dateRequired('startDate', 'Vui lòng chọn ngày kết thúc.'),
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
        <DatePicker {...SELECT_POPUP_PROPS} format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
      </Form.Item>
    </Flex>
    <Form.Item
      label="Màu phụng vụ"
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
  if (!colorHex) return <EmptyCell text="Chưa chọn" />
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
          render: (_, season: LiturgicalSeason) => periodOf(season),
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
          render: (address: string | null) => address || <EmptyCell text="Chưa có địa chỉ" />,
        },
      ]}
      fields={
        <Form.Item label="Địa chỉ" name="address" rules={[{ max: 300, message: 'Địa chỉ tối đa 300 ký tự.' }]}>
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

type CatalogTabKey = LiturgicalCatalog | 'massSchedules' | 'liturgicalNames'

interface CatalogTabItem {
  key: CatalogTabKey
  label: string
  children: ReactNode
}

/**
 * The four catalogs Report 1 FE-50 lists, in its order, then the three the backend added (LookupsController), the
 * fixed Mass times (MassSchedulesController) and the Vietnamese names of the liturgical calendar
 * (LiturgicalNameTranslationsController), grouped cleanly in a vertical navigation rail.
 */
const catalogGroups: { title: string; items: CatalogTabItem[] }[] = [
  {
    title: 'Lịch & Phụng vụ',
    items: [
      { key: 'seasons', label: 'Mùa phụng vụ', children: <SeasonsPanel /> },
      { key: 'liturgicalSlots', label: 'Phần phụng vụ', children: <SlotsPanel /> },
      { key: 'massSchedules', label: 'Giờ lễ cố định', children: <MassSchedulesPanel /> },
      { key: 'liturgicalNames', label: 'Tên phụng vụ', children: <LiturgicalNamesPanel /> },
    ],
  },
  {
    title: 'Loại lễ & Địa điểm',
    items: [
      { key: 'massTypes', label: 'Loại Thánh lễ', children: <BasicCatalogPanel catalog="massTypes" noun="loại Thánh lễ" /> },
      {
        key: 'ceremonyTypes',
        label: 'Loại nghi thức',
        children: <BasicCatalogPanel catalog="ceremonyTypes" noun="loại nghi thức" />,
      },
      { key: 'worshipLocations', label: 'Nơi cử hành', children: <LocationsPanel /> },
    ],
  },
  {
    title: 'Phân loại & Chủ đề',
    items: [
      {
        key: 'eventCategories',
        label: 'Danh mục sự kiện',
        children: <BasicCatalogPanel catalog="eventCategories" noun="danh mục sự kiện" />,
      },
      { key: 'songThemes', label: 'Chủ đề bài hát', children: <SongThemesPanel /> },
    ],
  },
]

const tabs: CatalogTabItem[] = catalogGroups.flatMap((group) => group.items)

/**
 * Admin: liturgical seasons, Mass types, ceremony types, event categories, song themes, liturgical slots, worship
 * locations (FE-50), the fixed weekly Mass times and the Vietnamese names of the liturgical calendar.
 */
export function LiturgicalCategoriesPage() {
  const [tab, setTab] = useUrlTab(
    tabs.map(({ key }) => key),
    'seasons',
  )
  const active = tabs.find((item) => item.key === tab) ?? tabs[0]

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentKey: CatalogTabKey) => {
    const index = tabs.findIndex((item) => item.key === currentKey)
    if (index === -1) return
    let nextIndex = -1
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextKey = tabs[nextIndex].key
    setTab(nextKey)
    document.getElementById(`catalog-tab-${nextKey}`)?.focus()
  }

  return (
    <>
      <PageHeader
        title="Danh mục phụng vụ"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Danh mục phụng vụ' }]}
        description="Danh mục dùng khi lập chương trình phụng vụ và lịch lễ."
      />
      <div className="admin-catalogs">
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Các danh mục phụng vụ"
          className="admin-catalogs__nav hm-paper"
        >
          {catalogGroups.map((group) => (
            <div key={group.title} className="admin-catalogs__group">
              <p className="hm-rubric admin-catalogs__heading">{group.title}</p>
              {group.items.map((item) => {
                const selected = item.key === active.key
                return (
                  <button
                    key={item.key}
                    id={`catalog-tab-${item.key}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`catalog-panel-${item.key}`}
                    tabIndex={selected ? 0 : -1}
                    className={selected ? 'admin-catalogs__tab is-active' : 'admin-catalogs__tab'}
                    onClick={() => setTab(item.key)}
                    onKeyDown={(event) => onTabKeyDown(event, item.key)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div
          key={active.key}
          role="tabpanel"
          id={`catalog-panel-${active.key}`}
          aria-labelledby={`catalog-tab-${active.key}`}
          className="admin-catalogs__panel"
        >
          {active.children}
        </div>
      </div>
    </>
  )
}
