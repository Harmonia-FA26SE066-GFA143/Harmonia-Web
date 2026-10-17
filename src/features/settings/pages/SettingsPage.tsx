import { App, Button, Card, Flex, Form, Input, InputNumber, Switch } from 'antd'
import type { ReactNode } from 'react'
import { CardTitle, EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { useSettings, useUpdateSettings } from '../hooks/useSettings'
import { settingErrorMessage } from '../settingsErrors'
import type { SystemSetting } from '../types'

type FieldValue = string | number | boolean | null

/** Wording for the keys of Harmonia-BE SystemSettingKeys; the backend descriptions are English, for developers. */
const copy: Record<string, { label: string; help?: string; multiline?: boolean }> = {
  'Parish.Name': { label: 'Tên giáo xứ' },
  'Choir.Name': { label: 'Tên ca đoàn' },
  'System.Announcement': {
    label: 'Thông báo chung',
    help: 'Hiện ở đầu trang cho mọi người dùng. Để trống để ẩn.',
    multiline: true,
  },
  'Roster.RecentServiceDays': {
    label: 'Số ngày tính là phục vụ gần đây',
    help: 'Khi gợi ý phân công, lần phục vụ trong bấy nhiêu ngày trước sự kiện được tính là gần đây.',
  },
  'Roster.AiSuggestionEnabled': {
    label: 'Dùng AI để gợi ý phân công',
    help: 'Tắt thì gợi ý phân công chỉ theo các quy tắc có sẵn.',
  },
  'Practice.AllowLateSubmission': {
    label: 'Cho nộp bài tập trễ hạn',
    help: 'Ca viên vẫn nộp được bản thu sau hạn nộp; bản nộp trễ vẫn tính là quá hạn.',
  },
  'Rehearsal.AttendanceOpensMinutesBefore': {
    label: 'Mở điểm danh trước giờ tập (phút)',
    help: 'Ca trưởng điểm danh được từ bấy nhiêu phút trước khi buổi tập bắt đầu.',
  },
}

const groups: { title: string; keys: string[] }[] = [
  { title: 'Giáo xứ và thông báo', keys: ['Parish.Name', 'Choir.Name', 'System.Announcement'] },
  { title: 'Phân công phục vụ', keys: ['Roster.RecentServiceDays', 'Roster.AiSuggestionEnabled'] },
  { title: 'Luyện tập', keys: ['Practice.AllowLateSubmission'] },
  { title: 'Lịch tập và điểm danh', keys: ['Rehearsal.AttendanceOpensMinutesBefore'] },
]

function toField({ dataType, value }: SystemSetting): FieldValue {
  if (dataType === 'int') return Number(value)
  if (dataType === 'bool') return value === 'true'
  return value
}

/** The text the backend stores (SystemSetting.SetValue): "42", "true" / "false", trimmed text. */
const toText = ({ dataType }: SystemSetting, field: FieldValue) =>
  dataType === 'bool' ? String(Boolean(field)) : String(field ?? '').trim()

function SettingField({ setting }: Readonly<{ setting: SystemSetting }>) {
  const { label, help, multiline } = copy[setting.key] ?? { label: setting.key, help: setting.description }
  const { dataType, minValue, maxValue } = setting
  let input: ReactNode = <Input maxLength={1000} />
  if (dataType === 'bool') input = <Switch />
  if (dataType === 'int') input = <InputNumber min={minValue} max={maxValue} precision={0} style={{ width: 160 }} />
  if (dataType === 'json' || multiline) input = <Input.TextArea rows={3} showCount maxLength={1000} />
  const range = dataType === 'int' && minValue !== undefined && maxValue !== undefined ? `Từ ${minValue} đến ${maxValue}.` : undefined

  return (
    <Form.Item
      label={label}
      name={setting.id}
      extra={[help, range].filter(Boolean).join(' ') || undefined}
      valuePropName={dataType === 'bool' ? 'checked' : 'value'}
      rules={[
        ...(dataType === 'int' ? [{ required: true, message: `Vui lòng nhập ${label.toLowerCase()}.` }] : []),
        ...(dataType === 'json'
          ? [
              {
                validator: (_: unknown, value?: string) => {
                  try {
                    JSON.parse(value ?? '')
                    return Promise.resolve()
                  } catch {
                    return Promise.reject(new Error('Giá trị phải là JSON hợp lệ.'))
                  }
                },
              },
            ]
          : []),
      ]}
    >
      {input}
    </Form.Item>
  )
}

/**
 * Admin: general system settings (FE-51, `/api/system-settings`). The backend fixes the set of settings
 * (`SystemSettingKeys`); the Admin edits their values. Saving sends only the settings that changed. This supersedes
 * "Report 1 lists no concrete setting" (stitch-screen-map.md, Phase 2).
 */
export function SettingsPage() {
  const { message } = App.useApp()
  const settings = useSettings()
  const update = useUpdateSettings()
  const all = settings.data ?? []
  const known = new Set(groups.flatMap((group) => group.keys))
  const others = all.filter((setting) => !known.has(setting.key))
  const sections = [
    ...groups.map((group) => ({
      title: group.title,
      items: group.keys.flatMap((key) => all.filter((setting) => setting.key === key)),
    })),
    { title: 'Khác', items: others },
  ].filter((section) => section.items.length > 0)

  const handleFinish = (values: Record<string, FieldValue>) => {
    if (update.isPending) return
    const changes = all
      .map((setting) => ({ setting, value: toText(setting, values[setting.id]) }))
      .filter(({ setting, value }) => value !== setting.value)
      .map(({ setting, value }) => ({ id: setting.id, value }))
    if (changes.length === 0) {
      message.info('Không có thay đổi nào để lưu.')
      return
    }
    update.mutate(changes, {
      onSuccess: () => message.success(`Đã lưu ${changes.length} thiết lập.`),
      onError: (error) => message.error(settingErrorMessage(error, 'Không thể lưu cấu hình. Vui lòng thử lại.')),
    })
  }

  return (
    <>
      <PageHeader
        title="Cấu hình chung"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Cấu hình chung' }]}
        description="Quản lý các thiết lập chung của hệ thống Harmonia."
      />
      {settings.isPending && <SectionSkeleton rows={6} label="Đang tải cấu hình" />}
      {settings.isError && (
        <ErrorState title="Không thể tải cấu hình" onRetry={() => settings.refetch()} retrying={settings.isFetching} />
      )}
      {settings.isSuccess && all.length === 0 && <EmptyState title="Chưa có thiết lập nào" />}
      {settings.isSuccess && all.length > 0 && (
        <Form<Record<string, FieldValue>>
          layout="vertical"
          initialValues={Object.fromEntries(all.map((setting) => [setting.id, toField(setting)]))}
          onFinish={handleFinish}
          style={{ maxWidth: 720 }}
        >
          <Flex vertical gap={spacing.lg}>
            {sections.map((section) => (
              <Card key={section.title} title={<CardTitle>{section.title}</CardTitle>}>
                {section.items.map((setting) => (
                  <SettingField key={setting.id} setting={setting} />
                ))}
              </Card>
            ))}
            <Flex justify="flex-end">
              <Button type="primary" htmlType="submit" loading={update.isPending}>
                Lưu thay đổi
              </Button>
            </Flex>
          </Flex>
        </Form>
      )}
    </>
  )
}
