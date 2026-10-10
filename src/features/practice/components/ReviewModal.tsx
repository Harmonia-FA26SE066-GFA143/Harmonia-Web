import { App, Flex, Form, Input, Modal, Radio, Typography } from 'antd'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { useCommentSubmission, useReviewSubmission, useSubmission } from '../hooks/usePractice'
import { practiceErrorMessage } from '../practiceErrors'
import { formatDateTime, formatDuration } from '../practiceFormat'
import { practiceStatusLabels, type ReviewResult } from '../types'

export interface ReviewModalProps {
  /** The submission to open; the modal is closed without one. */
  submissionId?: string
  onClose: () => void
}

interface FormValues {
  result?: ReviewResult | 'keep'
  comment?: string
}

const resultOptions = [
  { value: 'passed', label: practiceStatusLabels.passed },
  { value: 'needsRevision', label: practiceStatusLabels.needsRevision },
]

/**
 * Listen to a submission and review it manually (FE-42–FE-44, LI-03, LI-05). The first review sets "Đạt" or "Cần
 * chỉnh sửa", a comment required for the latter (POST …/feedback); later comments may change the result on the
 * member's newest attempt (POST …/comments). Earlier reviews stay as history.
 */
export function ReviewModal({ submissionId, onClose }: ReviewModalProps) {
  const { message } = App.useApp()
  const submission = useSubmission(submissionId)
  const review = useReviewSubmission()
  const comment = useCommentSubmission()
  const data = submission.data
  const reviewed = Boolean(data?.feedbacks.length)
  const saving = review.isPending || comment.isPending

  const handleFinish = ({ result, comment: text }: FormValues) => {
    if (!data) return
    const callbacks = {
      onSuccess: () => {
        message.success(reviewed ? 'Đã thêm nhận xét.' : 'Đã chấm bài.')
        onClose()
      },
      onError: (error: Error) => message.error(practiceErrorMessage(error, 'Không thể lưu đánh giá. Vui lòng thử lại.')),
    }
    const trimmed = text?.trim() || undefined
    if (reviewed) {
      comment.mutate({ id: data.id, comment: trimmed ?? '', result: result === 'keep' ? undefined : result }, callbacks)
    } else if (result && result !== 'keep') {
      review.mutate({ id: data.id, result, comment: trimmed }, callbacks)
    }
  }

  return (
    <Modal
      open={Boolean(submissionId)}
      title={reviewed ? 'Nhận xét thêm' : 'Chấm bài nộp'}
      okText={reviewed ? 'Gửi nhận xét' : 'Lưu kết quả'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving, disabled: !data }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onClose}
      mask={{ closable: !saving }}
      width={600}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<FormValues> layout="vertical" disabled={saving} initialValues={{ result: undefined }} onFinish={handleFinish}>
          {dom}
        </Form>
      )}
    >
      {submission.isPending && <SectionSkeleton rows={4} label="Đang tải bản thu" />}
      {submission.isError && (
        <ErrorState title="Không thể tải bản thu" onRetry={() => submission.refetch()} retrying={submission.isFetching} />
      )}
      {data && (
        <Flex vertical gap={spacing.md}>
          <div>
            <Typography.Text strong>{data.memberName}</Typography.Text>
            <Typography.Paragraph style={{ color: colors.textMuted, margin: 0 }}>
              {data.assignmentTitle} · lần {data.attemptNo}, nộp lúc {formatDateTime(data.submittedAt)} ·{' '}
              {formatDuration(data.durationSeconds)}
            </Typography.Paragraph>
          </div>
          <audio controls src={data.audioUrl} style={{ width: '100%' }} aria-label={`Bản thu của ${data.memberName}`} />
          {data.feedbacks.length > 0 && (
            <div>
              <Typography.Text strong>Đánh giá đã có</Typography.Text>
              <ul style={{ margin: `${spacing.xs}px 0 0`, paddingInlineStart: 18 }}>
                {data.feedbacks.map((feedback) => (
                  <li key={feedback.id}>
                    <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                      {formatDateTime(feedback.reviewedAt)} · {practiceStatusLabels[feedback.result]}
                      {feedback.reviewerName && ` · ${feedback.reviewerName}`}
                    </Typography.Text>
                    {feedback.comment && <div>{feedback.comment}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Form.Item
            label={reviewed ? 'Đổi kết quả' : 'Kết quả'}
            name="result"
            rules={reviewed ? [] : [{ required: true, message: 'Vui lòng chọn kết quả.' }]}
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={reviewed ? [{ value: 'keep', label: 'Giữ nguyên' }, ...resultOptions] : resultOptions}
            />
          </Form.Item>
          <Form.Item
            label="Nhận xét"
            name="comment"
            dependencies={['result']}
            rules={[
              { max: 1000, message: 'Nhận xét tối đa 1000 ký tự.' },
              ({ getFieldValue }) => ({
                validator: (_, value?: string) =>
                  value?.trim() || (!reviewed && getFieldValue('result') !== 'needsRevision')
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(reviewed ? 'Vui lòng nhập nhận xét.' : 'Vui lòng nhập nhận xét khi cần chỉnh sửa.'),
                      ),
              }),
            ]}
          >
            <Input.TextArea rows={4} showCount maxLength={1000} placeholder="Nhận xét và hướng dẫn cho ca viên" />
          </Form.Item>
        </Flex>
      )}
    </Modal>
  )
}
