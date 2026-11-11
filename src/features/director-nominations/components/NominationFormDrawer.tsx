import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Input, Select, Skeleton, Typography } from 'antd'
import { useState } from 'react'
import { useChoirs } from '@/features/choirs'
import { useChoirMembers } from '@/features/members'
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

/** Choir Director: nominates a member of their own choirs. The record is shown before sending, as a warning only. */
export function NominationFormDrawer({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<Values>()
  const [problem, setProblem] = useState<string>()
  const members = useChoirMembers(open)
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
          message.success('Đã gửi đề cử. Cha xứ sẽ nhận được thông báo.')
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
        setProblem(undefined)
      }}
      forceRender
    >
      <Form<Values> form={form} layout="vertical" requiredMark="optional" onFinish={submit} scrollToFirstError>
        <Form.Item name="memberId" label="Ca viên" rules={[{ required: true, message: 'Vui lòng chọn ca viên.' }]}>
          <Select
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Chọn ca viên trong ca đoàn của bạn"
            loading={members.isPending && open}
            options={members.data?.map((member) => ({ value: member.id, label: member.fullName }))}
            notFoundContent={members.isError ? 'Không tải được danh sách ca viên' : 'Không có ca viên'}
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
