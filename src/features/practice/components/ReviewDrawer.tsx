import { App, Button, Flex, Input, Radio, Typography } from 'antd'
import { ErrorState, Form, FormDrawer, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { useCommentSubmission, useReviewSubmission, useScoreSubmission, useSubmission } from '../hooks/usePractice'
import { practiceErrorMessage } from '../practiceErrors'
import { formatDateTime } from '@/lib/api/dates'
import { formatDuration } from '../practiceFormat'
import { practiceStatusLabels, type ReviewResult } from '../types'

export interface ReviewDrawerProps {
  /** The submission to open; the drawer is closed without one. */
  submissionId?: string
  /** A first review started from the row: "Cần sửa" preselected, the comment starting at the moment heard. */
  initialResult?: ReviewResult
  initialComment?: string
  onClose: () => void
}

interface FormValues {
  result?: ReviewResult | 'keep'
  comment?: string
}

/** The comment without the moment mark the row fills in ("[0:12] "): a mark alone is not a comment. */
const commentWords = (value?: string) => value?.replace(/^\[\d+:\d{2}\]/, '').trim()

const resultOptions = [
  { value: 'passed', label: practiceStatusLabels.passed },
  { value: 'needsRevision', label: practiceStatusLabels.needsRevision },
]

/**
 * Advisory score against the assignment's MIDI reference (BE 5dc9d03), asked for on demand since the server analyses
 * the audio each time; it is not stored and does not decide the result.
 */
function AutoScore({ submissionId }: Readonly<{ submissionId: string }>) {
  const score = useScoreSubmission()
  const result = score.data
  return (
    <Flex vertical gap={spacing.xs} style={{ padding: spacing.sm, borderRadius: 8, background: colors.softSurface }}>
      <Flex align="center" justify="space-between" gap={spacing.sm} wrap>
        <Typography.Text strong>Chấm tự động (tham khảo)</Typography.Text>
        <Button size="small" loading={score.isPending} onClick={() => score.mutate(submissionId)}>
          {result ? 'Chấm lại' : 'Chấm tự động'}
        </Button>
      </Flex>
      {result && (
        <Typography.Text>
          <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize }}>{result.score}/100</Typography.Text>
          {` · cao độ ${result.pitchScore} · nhịp ${result.rhythmScore} · hát được ${result.coveragePercent}% giai điệu · bè ${result.trackName}`}
        </Typography.Text>
      )}
      {score.isError && (
        <Typography.Text type="danger">{practiceErrorMessage(score.error, 'Không chấm tự động được. Vui lòng thử lại.')}</Typography.Text>
      )}
      {!result && !score.isError && (
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
          So với bản mẫu MIDI của bài tập: 70% cao độ, 30% nhịp. Chỉ để tham khảo, không lưu và không thay kết quả chấm.
        </Typography.Text>
      )}
    </Flex>
  )
}

/**
 * Listen to a submission and review it manually (FE-42–FE-44, LI-03, LI-05). The first review sets "Đạt" or "Cần
 * chỉnh sửa", a comment required for the latter (POST …/feedback); later comments may change the result on the
 * member's newest attempt (POST …/comments). Earlier reviews stay as history.
 */
export function ReviewDrawer({ submissionId, initialResult, initialComment, onClose }: Readonly<ReviewDrawerProps>) {
  const { message } = App.useApp()
  const submission = useSubmission(submissionId)
  const review = useReviewSubmission()
  const comment = useCommentSubmission()
  const data = submission.data
  const reviewed = Boolean(data?.feedbacks.length)
  const saving = review.isPending || comment.isPending

  const handleFinish = ({ result, comment: text }: FormValues) => {
    if (!data || saving) return
    const callbacks = {
      onSuccess: () => {
        message.success(reviewed ? 'Đã thêm nhận xét.' : 'Đã chấm bài.')
        onClose()
      },
      onError: (error: Error) => message.error(practiceErrorMessage(error, 'Không thể lưu đánh giá. Vui lòng thử lại.')),
    }
    // "Đạt" chosen after starting from a row would otherwise send the bare mark as the comment.
    const trimmed = commentWords(text) ? text?.trim() : undefined
    if (reviewed) {
      comment.mutate({ id: data.id, comment: trimmed ?? '', result: result === 'keep' ? undefined : result }, callbacks)
    } else if (result && result !== 'keep') {
      review.mutate({ id: data.id, result, comment: trimmed }, callbacks)
    }
  }

  return (
    <FormDrawer
      open={Boolean(submissionId)}
      title={reviewed ? 'Nhận xét thêm' : 'Chấm bài nộp'}
      okText={reviewed ? 'Gửi nhận xét' : 'Lưu kết quả'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving, disabled: !data }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onClose}
      size={600}
      destroyOnHidden
      drawerRender={(dom) => (
        <Form<FormValues> layout="vertical" initialValues={{ result: initialResult, comment: initialComment }} onFinish={handleFinish}>
          {dom}
        </Form>
      )}
    >
      {submission.isPending && <SectionSkeleton rows={4} label="Đang tải bản thu" />}
      {submission.isError && (
        <ErrorState title="Không thể tải bản thu" error={submission.error} hasData={submission.data !== undefined} onRetry={() => submission.refetch()} retrying={submission.isFetching} />
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
          <AutoScore submissionId={data.id} />
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
                validator: (_, value?: string) => {
                  if (commentWords(value) || (!reviewed && getFieldValue('result') !== 'needsRevision')) return Promise.resolve()
                  const required = reviewed ? 'Vui lòng nhập nhận xét.' : 'Vui lòng nhập nhận xét khi cần chỉnh sửa.'
                  return Promise.reject(new Error(required))
                },
              }),
            ]}
          >
            <Input.TextArea rows={4} showCount maxLength={1000} placeholder="Nhận xét và hướng dẫn cho ca viên" />
          </Form.Item>
        </Flex>
      )}
    </FormDrawer>
  )
}
