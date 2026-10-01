import { Alert, Flex, Form, Input, Modal, Radio, Typography } from 'antd'
import { colors, spacing, typography } from '@/styles/tokens'
import { formatDateTime, formatDuration } from '../practiceFormat'
import { practiceStatusLabels, type PracticeSubmission, type ReviewResult } from '../types'

export interface ReviewModalProps {
  /** The submission under review; the modal is closed when absent. */
  submission?: PracticeSubmission
  assignmentTitle?: string
  saving?: boolean
  onSubmit: (review: { result: ReviewResult; feedback?: string }) => void
  onCancel: () => void
}

interface FormValues {
  result?: ReviewResult
  feedback?: string
}

/**
 * Listen to a submission and review it manually (FE-42–FE-44, LI-03, LI-05): "Đạt" or "Cần chỉnh sửa", feedback
 * required for "Cần chỉnh sửa". A later review replaces the current result; earlier ones stay as history
 * (decision 2026-10-01).
 */
export function ReviewModal({ submission, assignmentTitle, saving = false, onSubmit, onCancel }: ReviewModalProps) {
  // Edit only the review of the current submission; a resubmission starts a new review (decision 2026-10-01).
  const reviews = submission?.reviews ?? []
  const current = reviews[0]?.submittedAt === submission?.submittedAt ? reviews[0] : undefined
  const history = current ? reviews.slice(1) : reviews

  return (
    <Modal
      open={Boolean(submission)}
      title={current ? 'Sửa đánh giá' : 'Đánh giá bài nộp'}
      okText="Lưu đánh giá"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      width={600}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<FormValues>
          layout="vertical"
          disabled={saving}
          initialValues={{ result: current?.result, feedback: current?.feedback }}
          onFinish={(values) => values.result && onSubmit({ result: values.result, feedback: values.feedback?.trim() || undefined })}
        >
          {dom}
        </Form>
      )}
    >
      {submission && (
        <Flex vertical gap={spacing.md}>
          <div>
            <Typography.Text strong>{submission.fullName}</Typography.Text>
            <Typography.Paragraph style={{ color: colors.textMuted, margin: 0 }}>
              {assignmentTitle} · nộp lúc {formatDateTime(submission.submittedAt)} · {formatDuration(submission.durationSeconds)}
            </Typography.Paragraph>
          </div>
          {submission.audioUrl ? (
            <audio controls src={submission.audioUrl} style={{ width: '100%' }} aria-label={`Bản thu của ${submission.fullName}`} />
          ) : (
            <Alert type="info" showIcon title="Chưa nghe được bản thu: cách hệ thống cấp tệp âm thanh chưa được định nghĩa." />
          )}
          <div>
            <Form.Item label="Đánh giá" name="result" rules={[{ required: true, message: 'Vui lòng chọn kết quả đánh giá.' }]}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={[
                  { value: 'passed', label: practiceStatusLabels.passed },
                  { value: 'needsRevision', label: practiceStatusLabels.needsRevision },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="Nhận xét"
              name="feedback"
              dependencies={['result']}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, value?: string) =>
                    getFieldValue('result') !== 'needsRevision' || value?.trim()
                      ? Promise.resolve()
                      : Promise.reject(new Error('Vui lòng nhập nhận xét khi cần chỉnh sửa.')),
                }),
              ]}
            >
              <Input.TextArea rows={4} placeholder="Nhận xét và hướng dẫn cho ca viên" />
            </Form.Item>
          </div>
          {history.length > 0 && (
            <div>
              <Typography.Text strong>Đánh giá trước đây</Typography.Text>
              <ul style={{ margin: `${spacing.xs}px 0 0`, paddingInlineStart: 18 }}>
                {history.map((review) => (
                  <li key={review.reviewedAt}>
                    <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                      {formatDateTime(review.reviewedAt)} · {practiceStatusLabels[review.result]} (bài nộp lúc{' '}
                      {formatDateTime(review.submittedAt)})
                    </Typography.Text>
                    {review.feedback && <div>{review.feedback}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Flex>
      )}
    </Modal>
  )
}
