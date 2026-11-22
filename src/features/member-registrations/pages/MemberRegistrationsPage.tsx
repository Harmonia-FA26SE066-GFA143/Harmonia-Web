import { SearchOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Avatar, Button, Card, Descriptions, Drawer, Flex, Input, Modal, Table, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { parseUtc } from '@/lib/api/dates'
import { errorMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { genderLabel, nameInitial, personName } from '@/shared/utils/personName'
import { EmptyChoir, EmptyState, ErrorState, Form, NoFilterResults, PageHeader, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, sizes, spacing, typography } from '@/styles/tokens'
import { acceptRegistration, deleteRegistration, listRegistrations, type MemberRegistration } from '../api/memberRegistrationsApi'
import { registrationsKey } from '../hooks/useWaitingRegistrations'

const pageSize = 20
const key = registrationsKey
const when = (value: string) => dayjs(parseUtc(value)).format('DD/MM/YYYY HH:mm')
const emptyValue = (label: 'Chưa có' | 'Không có') => (
  <Typography.Text style={{ color: colors.textMuted }}>{label}</Typography.Text>
)

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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<MemberRegistration>()
  const [rejecting, setRejecting] = useState<MemberRegistration>()
  const [rejectForm] = Form.useForm<{ reason: string }>()
  const keyword = useDebouncedValue(search)
  const registrations = useQuery({
    queryKey: [...key, keyword, page],
    queryFn: () => listRegistrations(keyword, page, pageSize),
    placeholderData: keepPreviousData,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const accept = useMutation({
    mutationFn: acceptRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choir-members'] })
      queryClient.invalidateQueries({ queryKey: ['member-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'accounts'] })
    },
    onSettled: refresh,
  })
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
            // The new member is in no choir yet, and only members of a choir are asked to serve: lead on to that step.
            message.success({
              duration: 8,
              content: (
                <>
                  Đã tạo tài khoản Ca viên cho {item.fullName}. Mật khẩu đầu tiên được gửi qua email; nếu không nhận được, ca viên chọn “Quên mật khẩu?” ở trang
                  đăng nhập. Ca viên chưa thuộc ca đoàn nào.{' '}
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(paths.admin.choirs)}>
                    Xếp vào ca đoàn
                  </Button>
                </>
              ),
            })
            setViewing(undefined)
          })
          .catch((error: Error) => message.error(failure(error, 'Không thể chấp nhận yêu cầu. Vui lòng thử lại.'))),
    })

  const handleDelete = (item: MemberRegistration) => {
    rejectForm.resetFields()
    setRejecting(item)
  }

  const submitReject = ({ reason }: { reason: string }) => {
    if (!rejecting) return
    const item = rejecting
    remove
      .mutateAsync({ id: item.id, reason })
      .then(() => {
        message.success(`Đã từ chối yêu cầu. Lý do được gửi tới ${item.email}.`)
        setRejecting(undefined)
        setViewing(undefined)
      })
      .catch((error: Error) => message.error(failure(error, 'Không thể từ chối yêu cầu. Vui lòng thử lại.')))
  }

  const columns: TableColumnsType<MemberRegistration> = [
    {
      key: 'person',
      title: 'Người đăng ký',
      render: (_, item) => (
        <Flex align="center" gap={spacing.sm}>
          <Avatar aria-hidden style={{ flexShrink: 0, background: colors.softSurface, color: colors.textBody, fontWeight: 600 }}>
            {nameInitial(item.fullName)}
          </Avatar>
          <Flex vertical align="flex-start">
            <Typography.Text strong>{personName(item.fullName, item.saintName)}</Typography.Text>
            <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>{item.email}</Typography.Text>
            {item.possibleDuplicates?.length ? (
              <StatusTag color="gold" style={{ marginTop: spacing.xs }}>
                Có thể trùng {item.possibleDuplicates.length} {item.possibleDuplicates.some((d) => d.kind === 'User') ? 'tài khoản hoặc yêu cầu' : 'yêu cầu'}
              </StatusTag>
            ) : null}
          </Flex>
        </Flex>
      ),
    },
    { key: 'phone', title: 'Điện thoại', render: (_, item) => item.phone ?? emptyValue('Chưa có') },
    { key: 'note', title: 'Lời nhắn', ellipsis: true, render: (_, item) => item.note ?? emptyValue('Không có') },
    { key: 'createdAt', title: 'Gửi lúc', render: (_, item) => when(item.createdAt) },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'center',
      width: 300,
      render: (_, item) => (
        <Flex justify="center" gap={spacing.xs}>
          <Button onClick={() => setViewing(item)} aria-label={`Xem yêu cầu của ${item.fullName}`}>Xem</Button>
          <Button type="primary" onClick={() => handleAccept(item)} aria-label={`Chấp nhận yêu cầu của ${item.fullName}`}>Chấp nhận</Button>
          <Button type="text" danger onClick={() => handleDelete(item)} aria-label={`Từ chối yêu cầu của ${item.fullName}`}>Từ chối</Button>
        </Flex>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Đăng ký gia nhập"
        description={
          registrations.data && !keyword
            ? `${total} yêu cầu đang chờ xử lý, gửi từ trang chủ.`
            : 'Yêu cầu tham gia ca đoàn gửi từ trang chủ đang chờ xử lý.'
        }
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
          <Flex wrap align="end" gap={spacing.sm} style={{ padding: spacing.md }}>
            <Flex vertical gap={4} style={{ flex: '1 1 260px', maxWidth: 360 }}>
              <label htmlFor="registration-search" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>Tìm theo họ tên hoặc email</label>
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
            </Flex>
            <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted, lineHeight: `${sizes.controlHeight}px` }}>
              {total} yêu cầu
            </Typography.Text>
          </Flex>
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
              <Button danger onClick={() => handleDelete(viewing)}>Từ chối</Button>
              <Button type="primary" onClick={() => handleAccept(viewing)}>Chấp nhận</Button>
            </Flex>
          )
        }
      >
        {viewing && (
          <Descriptions
            className="hm-key-value"
            column={1}
            items={[
              { key: 'status', label: 'Trạng thái', children: 'Đang chờ xử lý' },
              { key: 'saint', label: 'Tên thánh', children: viewing.saintName ?? emptyValue('Chưa có') },
              { key: 'name', label: 'Họ tên', children: viewing.fullName },
              { key: 'gender', label: 'Giới tính', children: genderLabel(viewing.gender) ?? emptyValue('Chưa có') },
              { key: 'email', label: 'Email', children: viewing.email },
              { key: 'phone', label: 'Điện thoại', children: viewing.phone ?? emptyValue('Chưa có') },
              { key: 'note', label: 'Lời nhắn', children: viewing.note ? <span style={{ whiteSpace: 'pre-line' }}>{viewing.note}</span> : emptyValue('Không có') },
              { key: 'at', label: 'Gửi lúc', children: when(viewing.createdAt) },
            ]}
          />
        )}
        {viewing?.possibleDuplicates?.length ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: spacing.lg }}
            message="Có thể trùng người đã đăng ký"
            description={
              <ul style={{ margin: 0, paddingInlineStart: spacing.lg }}>
                {viewing.possibleDuplicates.map((d) => (
                  <li key={`${d.kind}-${d.id}`}>
                    {d.kind === 'User' ? 'Tài khoản' : 'Yêu cầu khác'}: {d.fullName} ({d.email}), trùng {d.matchedOn === 'Phone' ? 'số điện thoại' : 'họ tên và tên thánh'}
                  </li>
                ))}
              </ul>
            }
          />
        ) : null}
      </Drawer>

      <Modal
        open={Boolean(rejecting)}
        title={rejecting ? `Từ chối yêu cầu của ${rejecting.fullName}?` : 'Từ chối yêu cầu'}
        okText="Từ chối yêu cầu"
        okButtonProps={{ danger: true, loading: remove.isPending }}
        cancelText="Hủy"
        onOk={() => rejectForm.submit()}
        onCancel={() => setRejecting(undefined)}
        destroyOnHidden
      >
        <Typography.Paragraph style={{ color: colors.textMuted }}>
          Yêu cầu sẽ rời danh sách và không tạo tài khoản nào. Lý do được gửi qua email tới {rejecting?.email}.
        </Typography.Paragraph>
        <Form form={rejectForm} layout="vertical" onFinish={submitReject}>
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[
              { required: true, whitespace: true, message: 'Vui lòng nhập lý do từ chối.' },
              { max: 500, message: 'Vui lòng nhập tối đa 500 ký tự.' },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea rows={3} showCount maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
