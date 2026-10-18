import { EditOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Table, Typography } from 'antd'
import { useState } from 'react'
import { ApiError } from '@/lib/api/errors'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { ChoirFormModal } from '../components/ChoirFormModal'
import { ChoirMembersDrawer } from '../components/ChoirMembersDrawer'
import { useChoirs, useSaveChoir } from '../hooks/useChoirs'
import type { Choir, ChoirValues } from '../types'

type FormState = { open: false } | { open: true; choir?: Choir }

/**
 * Choir Director: the choirs of the parish (D7, `/api/choirs`): add, rename, switch off, and their members. One Choir
 * Director manages every choir; a member can belong to several. The backend does not filter other pages by choir yet.
 */
export function ChoirsPage() {
  const { message } = App.useApp()
  const choirs = useChoirs()
  const save = useSaveChoir()
  const [form, setForm] = useState<FormState>({ open: false })
  const [nameError, setNameError] = useState<string>()
  const [membersOf, setMembersOf] = useState<Choir>()

  const openForm = (choir?: Choir) => {
    setNameError(undefined)
    setForm({ open: true, choir })
  }

  const editing = form.open ? form.choir : undefined
  const handleSubmit = (values: ChoirValues) => {
    if (save.isPending) return
    setNameError(undefined)
    save.mutate(
      { id: editing?.id, values },
      {
        onSuccess: () => {
          message.success(editing ? 'Đã lưu thay đổi ca đoàn.' : 'Đã thêm ca đoàn.')
          setForm({ open: false })
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

  const addButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
      Thêm ca đoàn
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Ca đoàn"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Ca đoàn' }]}
        description="Quản lý các ca đoàn của giáo xứ và ca viên trong từng ca đoàn. Một ca viên có thể thuộc nhiều ca đoàn."
        extra={addButton}
      />
      {choirs.isPending && <SectionSkeleton rows={4} label="Đang tải ca đoàn" />}
      {choirs.isError && <ErrorState title="Không thể tải ca đoàn" onRetry={() => choirs.refetch()} retrying={choirs.isFetching} />}
      {choirs.isSuccess && choirs.data.length === 0 && (
        <EmptyState title="Chưa có ca đoàn nào" description="Thêm ca đoàn đầu tiên rồi gán ca viên vào ca đoàn." action={addButton} />
      )}
      {choirs.isSuccess && choirs.data.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <Table<Choir>
            rowKey="id"
            pagination={false}
            dataSource={choirs.data}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                key: 'name',
                title: 'Ca đoàn',
                render: (_, choir) => (
                  <Flex vertical>
                    <Typography.Text strong>{choir.name}</Typography.Text>
                    <Typography.Text style={{ color: colors.textMuted, maxWidth: 480 }}>{choir.description ?? 'Chưa có mô tả'}</Typography.Text>
                  </Flex>
                ),
              },
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
                    <Button type="text" icon={<EditOutlined />} onClick={() => openForm(choir)} aria-label={`Chỉnh sửa ${choir.name}`} />
                  </Flex>
                ),
              },
            ]}
          />
        </Card>
      )}
      <ChoirFormModal
        open={form.open}
        choir={editing}
        nameError={nameError}
        saving={save.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setForm({ open: false })}
      />
      <ChoirMembersDrawer choir={membersOf} onClose={() => setMembersOf(undefined)} />
    </>
  )
}
