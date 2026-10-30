import { App, Button, Card, Flex, Input, InputNumber, Switch } from 'antd'
import type { ReactNode } from 'react'
import { CardTitle, EmptyState, ErrorState, Form, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { useSettings, useUpdateSettings } from '../hooks/useSettings'
import { settingErrorMessage } from '../settingsErrors'
import type { SystemSetting } from '../types'

type FieldValue = string | number | boolean | null

/** Text settings long enough to want several lines. */
const multilineKeys = new Set(['System.Announcement'])

function toField({ dataType, value }: SystemSetting): FieldValue {
  if (dataType === 'int') return Number(value)
  if (dataType === 'bool') return value === 'true'
  return value
}

/** The text the backend stores (SystemSetting.SetValue): "42", "true" / "false", trimmed text. */
const toText = ({ dataType }: SystemSetting, field: FieldValue) =>
  dataType === 'bool' ? String(Boolean(field)) : String(field ?? '').trim()

function SettingField({ setting }: Readonly<{ setting: SystemSetting }>) {
  const { dataType, minValue, maxValue, displayName: label, description: help } = setting
  let input: ReactNode = <Input maxLength={1000} />
  if (dataType === 'bool') input = <Switch />
  if (dataType === 'int') input = <InputNumber min={minValue} max={maxValue} precision={0} style={{ width: 160 }} />
  if (dataType === 'json' || multilineKeys.has(setting.key)) input = <Input.TextArea rows={3} showCount maxLength={1000} />
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
 * (`SystemSettingKeys`) with their Vietnamese label, section, order and explanation; the Admin edits their values.
 * Saving sends only the settings that changed. This supersedes "Report 1 lists no concrete setting"
 * (stitch-screen-map.md, Phase 2).
 */
export function SettingsPage() {
  const { message } = App.useApp()
  const settings = useSettings()
  const update = useUpdateSettings()
  const all = (settings.data ?? []).toSorted((a, b) => a.order - b.order)
  // One card per section, in the order of its first setting.
  const sections = [...new Set(all.map((setting) => setting.group))].map((title) => ({
    title: title || 'Khác',
    items: all.filter((setting) => setting.group === title),
  }))

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
      />
      {settings.isPending && <SectionSkeleton rows={6} label="Đang tải cấu hình" />}
      {settings.isError && (
        <ErrorState title="Không thể tải cấu hình" error={settings.error} hasData={settings.data !== undefined} onRetry={() => settings.refetch()} retrying={settings.isFetching} />
      )}
      {settings.data !== undefined && all.length === 0 && <EmptyState title="Chưa có thiết lập nào" />}
      {settings.data !== undefined && all.length > 0 && (
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
