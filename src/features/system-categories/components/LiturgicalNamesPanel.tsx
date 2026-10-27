import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, TranslationOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Form, Input, Select, Table, Tag, Typography } from 'antd'
import { useState } from 'react'
import { ApiError, requestFailureMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { CardTitle, EmptyState, ErrorState, FormDrawer, NoFilterResults, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { useDeleteLiturgicalName, useLiturgicalNames, useSaveLiturgicalName, useUntranslatedNames } from '../hooks/useLiturgicalNames'
import {
  liturgicalNameKindLabels,
  type LiturgicalNameKind,
  type LiturgicalNameTranslation,
  type LiturgicalNameTranslationValues,
} from '../types'

const pageSize = 20
const muted = { color: colors.textMuted }
const kindOptions = (Object.keys(liturgicalNameKindLabels) as LiturgicalNameKind[]).map((kind) => ({
  value: kind,
  label: liturgicalNameKindLabels[kind],
}))

/** Refusals of `/api/liturgical-name-translations` (Harmonia-BE LiturgicalNameTranslationService). */
const messages: Record<string, string> = {
  LITURGICAL_NAME_TRANSLATION_DUPLICATE: 'Tên tiếng Anh này đã có bản dịch cùng loại.',
  LITURGICAL_NAME_TRANSLATION_NOT_FOUND: 'Bản dịch không còn tồn tại. Danh sách đã được tải lại.',
}
const messageOf = (error: Error, fallback: string) =>
  (error instanceof ApiError && error.code && messages[error.code]) || requestFailureMessage(error, fallback)

/** Opening the form: a new translation, possibly for a name still in English, or an existing one. */
type FormState =
  | { open: false }
  | { open: true; translation?: LiturgicalNameTranslation; untranslated?: LiturgicalNameTranslationValues }

function TranslationModal({ form, onClose }: Readonly<{ form: FormState; onClose: () => void }>) {
  const { message } = App.useApp()
  const save = useSaveLiturgicalName()
  const [englishError, setEnglishError] = useState<string>()
  const editing = form.open ? form.translation : undefined
  // A name picked from the untranslated list is written exactly as the calendar returns it, so it is not edited.
  const fixedName = form.open && form.untranslated !== undefined

  const submit = (values: LiturgicalNameTranslationValues) => {
    if (save.isPending) return
    setEnglishError(undefined)
    save.mutate(
      { id: editing?.id, values },
      {
        onSuccess: () => {
          message.success(editing ? 'Đã lưu bản dịch.' : 'Đã thêm bản dịch.')
          onClose()
        },
        onError: (error) => {
          const text = messageOf(error, 'Không thể lưu bản dịch. Vui lòng thử lại.')
          if (error instanceof ApiError && error.code === 'LITURGICAL_NAME_TRANSLATION_DUPLICATE') setEnglishError(text)
          else message.error(text)
        },
      },
    )
  }

  return (
    <FormDrawer
      open={form.open}
      title={editing ? 'Sửa bản dịch' : 'Thêm bản dịch'}
      okText={editing ? 'Lưu thay đổi' : 'Thêm'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: save.isPending }}
      cancelButtonProps={{ disabled: save.isPending }}
      onCancel={() => {
        setEnglishError(undefined)
        onClose()
      }}
      destroyOnHidden
      drawerRender={(dom) => (
        <Form<LiturgicalNameTranslationValues>
          layout="vertical"
          initialValues={editing ?? (form.open ? form.untranslated : undefined) ?? { kind: 'Celebration' }}
          onFinish={submit}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item label="Loại" name="kind" rules={[{ required: true, message: 'Vui lòng chọn loại.' }]}>
        <Select options={kindOptions} disabled={fixedName} />
      </Form.Item>
      <Form.Item
        label="Tên tiếng Anh"
        name="englishName"
        validateStatus={englishError ? 'error' : undefined}
        help={englishError}
        extra={fixedName ? undefined : 'Viết đúng như lịch phụng vụ trả về, kể cả dấu phẩy và chữ hoa.'}
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập tên tiếng Anh.' },
          { max: 200, message: 'Tối đa 200 ký tự.' },
        ]}
      >
        <Input disabled={fixedName} />
      </Form.Item>
      <Form.Item
        label="Tên tiếng Việt"
        name="vietnameseName"
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập tên tiếng Việt.' },
          { max: 200, message: 'Tối đa 200 ký tự.' },
        ]}
      >
        <Input autoFocus />
      </Form.Item>
    </FormDrawer>
  )
}

/** Names of the synced calendar still shown in English, each one translatable in a click. */
function UntranslatedCard({ onTranslate }: Readonly<{ onTranslate: (name: LiturgicalNameTranslationValues) => void }>) {
  const missing = useUntranslatedNames()
  return (
    <Card title={<CardTitle>Tên còn tiếng Anh</CardTitle>} style={{ marginBottom: spacing.lg }}>
      {missing.isPending && <SectionSkeleton rows={2} label="Đang tải tên còn tiếng Anh" />}
      {missing.isError && (
        <ErrorState headingLevel={3} title="Không thể tải tên còn tiếng Anh" error={missing.error} hasData={false} onRetry={() => missing.refetch()} retrying={missing.isFetching} />
      )}
      {missing.data?.length === 0 && (
        <Typography.Text style={muted}>Mọi tên của các năm đã đồng bộ đều đã có tiếng Việt.</Typography.Text>
      )}
      {missing.data && missing.data.length > 0 && (
        <Flex vertical gap={spacing.xs}>
          <Typography.Text style={muted}>
            Các tên này đang hiện tiếng Anh trên lịch phụng vụ. Thứ trong tuần và Chúa nhật theo mùa đã được dịch tự động.
          </Typography.Text>
          {missing.data.map((name) => (
            <Flex key={`${name.kind}-${name.englishName}`} align="center" justify="space-between" gap={spacing.sm} wrap>
              <Flex align="center" gap={spacing.xs} wrap>
                <Tag style={{ marginInlineEnd: 0 }}>{liturgicalNameKindLabels[name.kind]}</Tag>
                <Typography.Text>{name.englishName}</Typography.Text>
              </Flex>
              <Button
                size="small"
                icon={<TranslationOutlined />}
                onClick={() => onTranslate({ ...name, vietnameseName: '' })}
                aria-label={`Dịch ${name.englishName}`}
              >
                Dịch
              </Button>
            </Flex>
          ))}
        </Flex>
      )}
    </Card>
  )
}

/**
 * Admin: Vietnamese names of the liturgical calendar (`/api/liturgical-name-translations`). The backend shows them on
 * every liturgical day as soon as they are saved; deleting one brings the English name back unless a rule covers it.
 */
export function LiturgicalNamesPanel() {
  const { message, modal } = App.useApp()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<LiturgicalNameKind>()
  const [page, setPage] = useState(1)
  const keyword = useDebouncedValue(search)
  const names = useLiturgicalNames({ keyword, kind }, { pageNumber: page, pageSize })
  const remove = useDeleteLiturgicalName()
  const [form, setForm] = useState<FormState>({ open: false })
  const filtered = Boolean(keyword.trim() || kind)

  const confirmDelete = (translation: LiturgicalNameTranslation) =>
    modal.confirm({
      title: `Xoá bản dịch "${translation.vietnameseName}"?`,
      content: 'Lịch phụng vụ sẽ hiện lại tên tiếng Anh cho tên này, trừ khi tên được dịch tự động theo quy tắc.',
      okText: 'Xoá bản dịch',
      okButtonProps: { danger: true },
      // Enter on a destructive dialog must not run it.
      autoFocusButton: 'cancel',
      cancelText: 'Hủy',
      onOk: () =>
        remove
          .mutateAsync(translation.id)
          .then(() => message.success('Đã xoá bản dịch.'))
          .catch((error: Error) => message.error(messageOf(error, 'Không thể xoá bản dịch. Vui lòng thử lại.'))),
    })

  const total = names.data?.totalCount ?? 0

  return (
    <>
      <UntranslatedCard onTranslate={(untranslated) => setForm({ open: true, untranslated })} />
      <Card styles={{ body: { padding: 0 } }}>
        <Flex wrap justify="space-between" align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
          <Flex wrap gap={spacing.sm} style={{ flex: '1 1 360px' }}>
            <Input
              allowClear
              prefix={<SearchOutlined aria-hidden />}
              placeholder="Tìm theo tên tiếng Anh hoặc tiếng Việt…"
              aria-label="Tìm bản dịch"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              style={{ flex: '1 1 240px', maxWidth: 360 }}
            />
            <Select
              allowClear
              aria-label="Loại tên"
              placeholder="Mọi loại"
              value={kind}
              onChange={(value?: LiturgicalNameKind) => {
                setKind(value)
                setPage(1)
              }}
              options={kindOptions}
              style={{ minWidth: 160 }}
            />
          </Flex>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setForm({ open: true })}>
            Thêm bản dịch
          </Button>
        </Flex>
        {names.isPending && <SectionSkeleton rows={5} label="Đang tải bản dịch" />}
        {names.isError && (
          <ErrorState title="Không thể tải bản dịch" error={names.error} hasData={names.data !== undefined} onRetry={() => names.refetch()} retrying={names.isFetching} />
        )}
        {names.isSuccess && total === 0 && (
          <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
            {filtered ? (
              <NoFilterResults
                onClearFilters={() => {
                  setSearch('')
                  setKind(undefined)
                }}
              />
            ) : (
              <EmptyState headingLevel={3} title="Chưa có bản dịch nào" description="Thêm bản dịch hoặc dịch các tên còn tiếng Anh ở trên." />
            )}
          </div>
        )}
        {names.isSuccess && total > 0 && (
          <Table<LiturgicalNameTranslation>
            rowKey="id"
            dataSource={names.data.items}
            loading={names.isPlaceholderData}
            scroll={{ x: 'max-content' }}
            pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
            columns={[
              { key: 'kind', title: 'Loại', render: (_, item) => liturgicalNameKindLabels[item.kind] },
              { key: 'english', title: 'Tên tiếng Anh', dataIndex: 'englishName' },
              { key: 'vietnamese', title: 'Tên tiếng Việt', render: (_, item) => <Typography.Text strong>{item.vietnameseName}</Typography.Text> },
              {
                key: 'actions',
                title: 'Thao tác',
                align: 'right',
                fixed: 'right',
                render: (_, item) => (
                  <Flex justify="flex-end" gap={4}>
                    <Button type="text" icon={<EditOutlined />} onClick={() => setForm({ open: true, translation: item })} aria-label={`Sửa bản dịch ${item.englishName}`} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(item)} aria-label={`Xoá bản dịch ${item.englishName}`} />
                  </Flex>
                ),
              },
            ]}
          />
        )}
      </Card>
      <TranslationModal form={form} onClose={() => setForm({ open: false })} />
    </>
  )
}
