import { SearchOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Drawer, Flex, Input, Table, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { errorMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyChoir, EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { acceptRegistration, deleteRegistration, listRegistrations, type MemberRegistration } from '../api/memberRegistrationsApi'

const pageSize = 20
const key = ['member-registrations'] as const
const when = (value: string) => dayjs(parseUtc(value)).format('DD/MM/YYYY HH:mm')

const failure = (error: Error, fallback: string) =>
  errorMessage(
    error,
    {
      MEMBER_REGISTRATION_NOT_FOUND: 'Yêu cầu không còn trong danh sách. Có thể đã được xử lý.',
      USER_EMAIL_ALREADY_EXISTS: 'Email này đã có tài khoản. Bạn có thể xoá yêu cầu này.',
    },
    fallback,
  )

/**
 * Admin: requests to join the choir (UC-45). Every row is waiting: the backend has no status, a request leaves the list
 * when it is accepted or deleted. The list carries every field, so the detail reads from it (there is no detail endpoint).
 */
export function MemberRegistrationsPage() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<MemberRegistration>()
  const keyword = useDebouncedValue(search)
  const registrations = useQuery({
    queryKey: [...key, keyword, page],
    queryFn: () => listRegistrations(keyword, page, pageSize),
    placeholderData: keepPreviousData,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const accept = useMutation({ mutationFn: acceptRegistration, onSettled: refresh })
  const remove = useMutation({ mutationFn: deleteRegistration, onSettled: refresh })
  const total = registrations.data?.totalCount ?? 0

  const handleAccept = (item: MemberRegistration) =>
    modal.confirm({
      title: `Chấp nhận yêu cầu của ${item.fullName}?`,
      content: `Hệ thống sẽ tạo tài khoản Ca viên và gửi mật khẩu đầu tiên tới ${item.email}. Yêu cầu sẽ rời danh sách.`,
      okText: 'Tạo tài khoản',
      cancelText: 'Hủy',
      onOk: () =>
        accept
          .mutateAsync(item.id)
          .then(() => {
            message.success(`Đã tạo tài khoản Ca viên cho ${item.fullName}. Mật khẩu đầu tiên đã được gửi qua email.`)
            setViewing(undefined)
          })
          .catch((error: Error) => message.error(failure(error, 'Không thể chấp nhận yêu cầu. Vui lòng thử lại.'))),
    })

  const handleDelete = (item: MemberRegistration) =>
    modal.confirm({
      title: `Xoá yêu cầu của ${item.fullName}?`,
      content: 'Yêu cầu sẽ bị xoá và không khôi phục được. Không có tài khoản nào được tạo.',
      okText: 'Xoá yêu cầu',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      autoFocusButton: 'cancel',
      onOk: () =>
        remove
          .mutateAsync(item.id)
          .then(() => {
            message.success('Đã xoá yêu cầu.')
            setViewing(undefined)
          })
          .catch((error: Error) => message.error(failure(error, 'Không thể xoá yêu cầu. Vui lòng thử lại.'))),
    })

  const columns: TableColumnsType<MemberRegistration> = [
    {
      key: 'person',
      title: 'Người đăng ký',
      render: (_, item) => (
        <Flex vertical>
          <Typography.Text strong>{item.fullName}</Typography.Text>
          <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>{item.email}</Typography.Text>
        </Flex>
      ),
    },
    { key: 'phone', title: 'Điện thoại', render: (_, item) => item.phone ?? 'Chưa có' },
    { key: 'note', title: 'Lời nhắn', ellipsis: true, render: (_, item) => item.note ?? 'Không có' },
    { key: 'createdAt', title: 'Gửi lúc', render: (_, item) => when(item.createdAt) },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, item) => (
        <Flex justify="flex-end" gap={spacing.xs}>
          <Button onClick={() => setViewing(item)} aria-label={`Xem yêu cầu của ${item.fullName}`}>Xem</Button>
          <Button type="primary" onClick={() => handleAccept(item)} aria-label={`Chấp nhận yêu cầu của ${item.fullName}`}>Chấp nhận</Button>
          <Button type="text" danger onClick={() => handleDelete(item)} aria-label={`Xoá yêu cầu của ${item.fullName}`}>Xoá</Button>
        </Flex>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Đăng ký gia nhập"
        description="Yêu cầu tham gia ca đoàn gửi từ trang chủ đang chờ xử lý."
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Đăng ký gia nhập' }]}
      />
      {registrations.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách yêu cầu" />}
      {registrations.isError && (
        <ErrorState title="Không thể tải danh sách yêu cầu" error={registrations.error} hasData={registrations.data !== undefined} onRetry={() => registrations.refetch()} retrying={registrations.isFetching} />
      )}
      {registrations.data !== undefined && total === 0 && !keyword && (
        <EmptyState icon={<EmptyChoir />} title="Chưa có yêu cầu nào" description="Yêu cầu gửi từ trang chủ sẽ xuất hiện tại đây." />
      )}
      {registrations.data !== undefined && (total > 0 || keyword) && (
        <Card styles={{ body: { padding: 0 } }}>
          <div style={{ padding: spacing.md, maxWidth: 400 }}>
            <label htmlFor="registration-search" style={{ display: 'block', marginBottom: 4, fontSize: typography.metadata.fontSize, color: colors.textMuted }}>Tìm theo họ tên hoặc email</label>
            <Input
              id="registration-search"
              allowClear
              prefix={<SearchOutlined aria-hidden />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}><NoFilterResults onClearFilters={() => setSearch('')} /></div>
          ) : (
            <Table<MemberRegistration>
              rowKey="id"
              columns={columns}
              dataSource={registrations.data.items}
              loading={registrations.isPlaceholderData}
              pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
            />
          )}
        </Card>
      )}

      <Drawer
        open={Boolean(viewing)}
        title={viewing ? `Yêu cầu của ${viewing.fullName}` : 'Yêu cầu'}
        size={480}
        onClose={() => setViewing(undefined)}
        footer={
          viewing && (
            <Flex justify="flex-end" gap={spacing.sm}>
              <Button danger onClick={() => handleDelete(viewing)}>Xoá yêu cầu</Button>
              <Button type="primary" onClick={() => handleAccept(viewing)}>Chấp nhận</Button>
            </Flex>
          )
        }
      >
        {viewing && (
          <Descriptions
            column={1}
            items={[
              { key: 'status', label: 'Trạng thái', children: 'Đang chờ xử lý' },
              { key: 'name', label: 'Họ tên', children: viewing.fullName },
              { key: 'email', label: 'Email', children: viewing.email },
              { key: 'phone', label: 'Điện thoại', children: viewing.phone ?? 'Chưa có' },
              { key: 'note', label: 'Lời nhắn', children: <span style={{ whiteSpace: 'pre-line' }}>{viewing.note ?? 'Không có'}</span> },
              { key: 'at', label: 'Gửi lúc', children: when(viewing.createdAt) },
            ]}
          />
        )}
      </Drawer>
    </>
  )
}
