import { EditOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Table, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { accountName, useActiveDirectors } from '@/features/users'
import { ApiError } from '@/lib/api/errors'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { ChoirFormDrawer } from '../components/ChoirFormDrawer'
import { ChoirMembersDrawer } from '../components/ChoirMembersDrawer'
import { useChoirs, useSaveChoir } from '../hooks/useChoirs'
import type { Choir, ChoirValues } from '../types'

type FormState = { open: false } | { open: true; choir?: Choir }

const muted = { color: colors.textMuted }

/** The Admin's form: the directors list is an Admin endpoint, so it is loaded only here. */
function AdminChoirForm({ form, onClose }: Readonly<{ form: FormState; onClose: () => void }>) {
  const { message } = App.useApp()
  const save = useSaveChoir()
  const directors = useActiveDirectors()
  const [nameError, setNameError] = useState<string>()
  const editing = form.open ? form.choir : undefined

  const handleSubmit = (values: ChoirValues) => {
    if (save.isPending) return
    setNameError(undefined)
    save.mutate(
      { id: editing?.id, values },
      {
        onSuccess: () => {
          message.success(editing ? 'Đã lưu thay đổi ca đoàn.' : 'Đã thêm ca đoàn.')
          onClose()
        },
        onError: (error) => {
          const text = choirErrorMessage(error, 'Không thể lưu ca đoàn. Vui lòng thử lại.')
          // A taken name is shown under the name field, where it can be fixed.
          if (error instanceof ApiError && error.code === 'CHOIR_NAME_ALREADY_EXISTS') setNameError(text)
          else message.error(text)
        },
      },
    )
  }

  return (
    <ChoirFormDrawer
      open={form.open}
      choir={editing}
      nameError={nameError}
      saving={save.isPending}
      directors={(directors.data ?? []).map((account) => ({ value: account.id, label: accountName(account) }))}
      directorsLoading={directors.isPending}
      onSubmit={handleSubmit}
      onCancel={() => {
        setNameError(undefined)
        onClose()
      }}
    />
  )
}

/**
 * The choirs of the parish (D7, D8, `/api/choirs`). Admin: every choir, add, rename, switch off, choose its Choir
 * Director, and its members. Choir Director: their own choirs and their members. Both add members from the whole
 * parish.
 */
export function ChoirsPage({ role }: Readonly<{ role: 'admin' | 'director' }>) {
  const admin = role === 'admin'
  const choirs = useChoirs()
  const [form, setForm] = useState<FormState>({ open: false })
  const [membersOf, setMembersOf] = useState<Choir>()

  const addButton = admin && (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setForm({ open: true })}>
      Thêm ca đoàn
    </Button>
  )

  const columns: TableColumnsType<Choir> = [
    {
      key: 'name',
      title: 'Ca đoàn',
      render: (_, choir) => (
        <Flex vertical>
          <Typography.Text strong>{choir.name}</Typography.Text>
          <Typography.Text style={{ ...muted, maxWidth: 480 }}>{choir.description ?? 'Chưa có mô tả'}</Typography.Text>
        </Flex>
      ),
    },
    ...(admin
      ? [
          {
            key: 'director',
            title: 'Ca trưởng phụ trách',
            render: (_: unknown, choir: Choir) => choir.directorName ?? <Typography.Text style={muted}>Chưa có</Typography.Text>,
          },
        ]
      : []),
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, choir) => (
        <StatusTag color={choir.isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
          {choir.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </StatusTag>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      fixed: 'right',
      render: (_, choir) => (
        <Flex justify="flex-end" gap={4}>
          <Button icon={<TeamOutlined />} onClick={() => setMembersOf(choir)} aria-label={`Ca viên của ${choir.name}`}>
            Ca viên
          </Button>
          {admin && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setForm({ open: true, choir })}
              aria-label={`Chỉnh sửa ${choir.name}`}
            />
          )}
        </Flex>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={admin ? 'Ca đoàn' : 'Ca đoàn của tôi'}
        breadcrumb={admin ? [{ title: 'Quản trị hệ thống' }, { title: 'Ca đoàn' }] : [{ title: 'Ca trưởng' }, { title: 'Ca đoàn' }]}
        description={
          admin
            ? 'Quản lý các ca đoàn của giáo xứ và ca trưởng phụ trách từng ca đoàn. Một ca viên có thể thuộc nhiều ca đoàn.'
            : 'Các ca đoàn bạn phụ trách và ca viên trong từng ca đoàn. Một ca viên có thể thuộc nhiều ca đoàn.'
        }
        extra={addButton}
      />
      {choirs.isPending && <SectionSkeleton rows={4} label="Đang tải ca đoàn" />}
      {choirs.isError && (
        <ErrorState title="Không thể tải ca đoàn" error={choirs.error} hasData={choirs.data !== undefined} onRetry={() => choirs.refetch()} retrying={choirs.isFetching} />
      )}
      {choirs.isSuccess && choirs.data.length === 0 && (
        <EmptyState
          title={admin ? 'Chưa có ca đoàn nào' : 'Bạn chưa phụ trách ca đoàn nào'}
          description={
            admin
              ? 'Thêm ca đoàn đầu tiên rồi chọn ca trưởng phụ trách.'
              : 'Quản trị viên chọn ca trưởng phụ trách cho từng ca đoàn. Liên hệ quản trị viên để được giao ca đoàn.'
          }
          action={addButton || undefined}
        />
      )}
      {choirs.isSuccess && choirs.data.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <Table<Choir> rowKey="id" pagination={false} dataSource={choirs.data} scroll={{ x: 'max-content' }} columns={columns} />
        </Card>
      )}
      {admin && <AdminChoirForm form={form} onClose={() => setForm({ open: false })} />}
      <ChoirMembersDrawer choir={membersOf} onClose={() => setMembersOf(undefined)} />
    </>
  )
}

export const AdminChoirsPage = () => <ChoirsPage role="admin" />

export const DirectorChoirsPage = () => <ChoirsPage role="director" />
