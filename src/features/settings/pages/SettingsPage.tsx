import { Alert, App, Button, Card, Flex, Input, InputNumber, Modal, Switch, Typography } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'
import { CardTitle, EmptyState, ErrorState, Form, PageHeader, SaveButton, SectionSkeleton, useJustSaved } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
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

function SettingField({ setting, previewText }: Readonly<{ setting: SystemSetting; previewText?: string }>) {
  const { dataType, minValue, maxValue, displayName: label, description: help } = setting
  let input: ReactNode = <Input maxLength={1000} />
  if (dataType === 'bool') input = <Switch />
  if (dataType === 'int') input = <InputNumber min={minValue} max={maxValue} precision={0} style={{ width: 160 }} />
  if (dataType === 'json' || multilineKeys.has(setting.key)) input = <Input.TextArea rows={3} showCount maxLength={1000} />
  const range = dataType === 'int' && minValue !== undefined && maxValue !== undefined ? `Từ ${minValue} đến ${maxValue}.` : undefined

  return (
    <>
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
      {setting.key === 'System.Announcement' && previewText && (
        <Alert
          type="info"
          showIcon
          title="Xem trước thông báo hiển thị"
          description={previewText}
          style={{ marginTop: -spacing.sm, marginBottom: spacing.md }}
        />
      )}
    </>
  )
}

/**
 * Admin: general system settings (FE-51, `/api/system-settings`). The backend fixes the set of settings
 * (`SystemSettingKeys`) with their Vietnamese label, section, order and explanation; the Admin edits their values.
 * Saving sends only the settings that changed.
 */
export function SettingsPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<Record<string, FieldValue>>()
  const settings = useSettings()
  const update = useUpdateSettings()
  const [justSaved, markSaved] = useJustSaved()
  const all = useMemo(() => (settings.data ?? []).toSorted((a, b) => a.order - b.order), [settings.data])
  // One card per section, in the order of its first setting.
  const sections = useMemo(
    () =>
      [...new Set(all.map((setting) => setting.group))].map((title, index) => ({
        id: `settings-group-${index}`,
        title: title || 'Khác',
        items: all.filter((setting) => setting.group === title),
      })),
    [all],
  )
  const initialValues = useMemo(
    () => Object.fromEntries(all.map((setting) => [setting.id, toField(setting)])),
    [all],
  )
  const watched = Form.useWatch([], form)
  const dirtyCount = useMemo(() => {
    if (!watched) return 0
    return all.filter((setting) => setting.id in watched && toText(setting, watched[setting.id]) !== setting.value).length
  }, [all, watched])
  const [activeSectionId, setActiveSectionId] = useState<string>('settings-group-0')

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirtyCount > 0 && currentLocation.pathname !== nextLocation.pathname,
  )
  useBeforeUnload((event) => {
    if (dirtyCount > 0) event.preventDefault()
  })

  useEffect(() => {
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible?.target.id) setActiveSectionId(visible.target.id)
      },
      { rootMargin: '-120px 0px -65% 0px', threshold: 0 },
    )
    for (const section of sections) {
      const node = document.getElementById(section.id)
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [sections])

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
      onSuccess: () => {
        markSaved()
        message.success(`Đã lưu ${changes.length} thiết lập.`)
      },
      onError: (error) => {
        const reason = settingErrorMessage(error, 'Không thể lưu cấu hình. Vui lòng thử lại.')
        const saved = (error as { savedCount?: number }).savedCount ?? 0
        message.error(saved > 0 ? `Đã lưu ${saved} trên ${changes.length} thiết lập, phần còn lại chưa lưu. ${reason}` : reason)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Cấu hình chung"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Cấu hình chung' }]}
        description="Thiết lập do hệ thống quy định. Chỉ những mục bạn thay đổi được lưu."
      />
      {settings.isPending && <SectionSkeleton rows={6} label="Đang tải cấu hình" />}
      {settings.isError && (
        <ErrorState title="Không thể tải cấu hình" error={settings.error} hasData={settings.data !== undefined} onRetry={() => settings.refetch()} retrying={settings.isFetching} />
      )}
      {settings.data !== undefined && all.length === 0 && <EmptyState title="Chưa có thiết lập nào" />}
      {settings.data !== undefined && all.length > 0 && (
        <Form<Record<string, FieldValue>>
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleFinish}
        >
          {/* The groups in the BE order, with their index and the save button kept in view on the right (artifact SettingsPage). */}
          <div className="admin-settings">
            <Flex vertical gap={spacing.md}>
              {sections.map((section) => (
                <Card key={section.title} id={section.id} className="admin-settings__group" title={<CardTitle>{section.title}</CardTitle>}>
                  {section.items.map((setting) => {
                    const current = watched && setting.id in watched ? watched[setting.id] : toField(setting)
                    const previewText = setting.key === 'System.Announcement' ? String(current ?? '').trim() : undefined
                    return <SettingField key={setting.id} setting={setting} previewText={previewText} />
                  })}
                </Card>
              ))}
            </Flex>
            <aside className="admin-settings__aside">
              <nav aria-labelledby="settings-index-heading" className="hm-sheet-section">
                <header className="hm-sheet-section__head">
                  <h2 id="settings-index-heading" className="hm-rubric">
                    Nhóm thiết lập
                  </h2>
                </header>
                <ul className="admin-settings__index">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={activeSectionId === section.id ? 'is-active' : undefined}
                        onClick={() => setActiveSectionId(section.id)}
                      >
                        {section.title}
                        <span>{section.items.length}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: dirtyCount > 0 ? colors.primary : colors.textMuted }}>
                {dirtyCount > 0 ? `${dirtyCount} thay đổi chưa lưu.` : 'Chưa có thay đổi nào.'}
              </Typography.Text>
              <SaveButton saved={justSaved} type="primary" htmlType="submit" loading={update.isPending} block>
                Lưu thay đổi
              </SaveButton>
              {dirtyCount > 0 && (
                <Button block disabled={update.isPending} onClick={() => form.resetFields()}>
                  Hoàn tác
                </Button>
              )}
            </aside>
          </div>
        </Form>
      )}
      <Modal
        open={blocker.state === 'blocked'}
        title="Rời khỏi trang cấu hình?"
        okText="Rời khỏi trang"
        cancelText="Ở lại"
        okButtonProps={{ danger: true }}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Bạn có {dirtyCount} thay đổi chưa lưu. Rời khỏi trang lúc này sẽ bỏ qua các thay đổi đó.
      </Modal>
    </>
  )
}
