import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Input, Select, Skeleton, Typography } from 'antd'
import { useState } from 'react'
import { useChoirs } from '@/features/choirs'
import { searchMembers } from '@/features/members'
import { getSession } from '@/lib/auth/session'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { Form, FormDrawer } from '@/shared/ui'
import { spacing, typography } from '@/styles/tokens'
import { createNomination, getEligibility } from '../api/nominationsApi'
import { nominationErrorMessage } from '../nominationErrors'
import { NominationStatsList } from './NominationStatsList'

interface Values {
  memberId: string
  reason: string
  proposedChoirId?: string
}

/**
 * Choir Director (members of their choirs) or Parish Priest (any member of the parish, BE e18e49b) nominates a member.
 * Members are searched on the server, so a parish larger than one page still finds everyone. The record is shown
 * before sending, as a warning only.
 */
export function NominationFormDrawer({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<Values>()
  const [problem, setProblem] = useState<string>()
  const isPriest = getSession()?.user.roleName === 'ParishPriest'
  const [keyword, setKeyword] = useState('')
  const search = useDebouncedValue(keyword)
  // The chosen member keeps its name in the field while the next search shows other people.
  const [chosen, setChosen] = useState<{ value: string; label: string }>()
  const members = useQuery({
    queryKey: ['director-nominations', 'members', search],
    queryFn: () => searchMembers({ search, status: 'active' }, { pageNumber: 1, pageSize: 20 }),
    enabled: open,
  })
  const memberOptions = members.data?.items.map((member) => ({ value: member.id, label: member.fullName })) ?? []
  if (chosen && !memberOptions.some((option) => option.value === chosen.value)) memberOptions.unshift(chosen)
  const choirs = useChoirs(open)
  const memberId = Form.useWatch('memberId', form)
  const eligibility = useQuery({
    queryKey: ['director-nominations', 'eligibility', memberId],
    queryFn: () => getEligibility(memberId),
    enabled: Boolean(memberId),
    retry: false,
  })
  const create = useMutation({ mutationFn: createNomination })

  const submit = (values: Values) => {
    if (create.isPending) return
    setProblem(undefined)
    create.mutate(
      { ...values, reason: values.reason.trim() },
      {
        onSuccess: () => {
          message.success(isPriest ? 'Đã tạo đề cử. Bạn có thể duyệt ngay trong danh sách.' : 'Đã gửi đề cử. Cha xứ sẽ nhận được thông báo.')
          void queryClient.invalidateQueries({ queryKey: ['director-nominations'] })
          onClose()
        },
        onError: (error) => setProblem(nominationErrorMessage(error, 'Không thể gửi đề cử. Vui lòng thử lại.')),
      },
    )
  }

  return (
    <FormDrawer
      open={open}
      title="Đề cử Ca trưởng"
      okText="Gửi đề cử"
      okButtonProps={{ loading: create.isPending }}
      onOk={() => form.submit()}
      onCancel={onClose}
      afterClose={() => {
        form.resetFields()
        setKeyword('')
        setChosen(undefined)
        setProblem(undefined)
      }}
      forceRender
    >
      <Form<Values> form={form} layout="vertical" requiredMark="optional" onFinish={submit} scrollToFirstError>
        <Form.Item name="memberId" label="Ca viên" rules={[{ required: true, message: 'Vui lòng chọn ca viên.' }]}>
          <Select
            showSearch={{ filterOption: false, onSearch: setKeyword }}
            placeholder={isPriest ? 'Tìm ca viên trong giáo xứ theo họ tên hoặc email' : 'Tìm ca viên trong ca đoàn của bạn'}
            loading={members.isFetching && open}
            options={memberOptions}
            onChange={(value: string, option) => setChosen(option && !Array.isArray(option) ? { value, label: String(option.label) } : undefined)}
            notFoundContent={members.isError ? 'Không tải được danh sách ca viên' : 'Không có ca viên phù hợp'}
          />
        </Form.Item>
        {memberId && (
          <section aria-label="Thành tích của ca viên" style={{ marginBottom: spacing.lg }}>
            <Typography.Title level={3} style={{ fontSize: typography.cardHeading.fontSize, marginTop: 0 }}>Thành tích</Typography.Title>
            {eligibility.isPending && <Skeleton active paragraph={{ rows: 3 }} title={false} />}
            {eligibility.isError && <Alert type="error" showIcon title={nominationErrorMessage(eligibility.error, 'Không tải được thành tích của ca viên.')} />}
            {eligibility.data && (
              <>
                <NominationStatsList stats={eligibility.data} />
                {!eligibility.data.meetsAll && (
                  <Alert type="warning" showIcon title="Ca viên chưa đạt đủ ngưỡng. Bạn vẫn có thể đề cử, Cha xứ sẽ cân nhắc." style={{ marginTop: spacing.sm }} />
                )}
              </>
            )}
          </section>
        )}
        <Form.Item name="reason" label="Lý do đề cử" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do đề cử.' }, { max: 1000, message: 'Vui lòng nhập tối đa 1000 ký tự.' }]}>
          <Input.TextArea rows={4} showCount maxLength={1000} />
        </Form.Item>
        <Form.Item name="proposedChoirId" label="Ca đoàn đề xuất" extra="Admin sẽ chọn ca đoàn khi bổ nhiệm.">
          <Select allowClear placeholder="Chọn ca đoàn" loading={choirs.isPending && open} options={choirs.data?.map((choir) => ({ value: choir.id, label: choir.name }))} />
        </Form.Item>
        {problem && <Alert type="error" showIcon title={problem} />}
      </Form>
    </FormDrawer>
  )
}
