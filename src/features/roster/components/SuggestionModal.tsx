import { Checkbox, Flex, Modal, Typography } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing } from '@/styles/tokens'
import { useRosterSuggestions } from '../hooks/useRoster'
import type { RosterSuggestion } from '../types'

export interface SuggestionModalProps {
  open: boolean
  programId: string
  /** Human label of a requirement, e.g. "Tenor · Con Bước Lên Bàn Thờ"; undefined when it no longer exists. */
  describe: (requirementId: string) => string | undefined
  onApply: (suggestions: RosterSuggestion[]) => void
  onCancel: () => void
}

const keyOf = (suggestion: RosterSuggestion) => `${suggestion.requirementId}:${suggestion.memberId}`

/**
 * Suggestions returned by the backend for open positions (FE-36). The Director chooses which to apply; nothing is
 * assigned automatically.
 */
export function SuggestionModal({ open, programId, describe, onApply, onCancel }: SuggestionModalProps) {
  const suggestions = useRosterSuggestions(programId, open)
  const [deselected, setDeselected] = useState<string[]>([])
  const usable = (suggestions.data ?? []).filter((item) => describe(item.requirementId))
  const selected = usable.filter((item) => !deselected.includes(keyOf(item)))

  return (
    <Modal
      open={open}
      title="Gợi ý nhân sự"
      okText={selected.length ? `Áp dụng ${selected.length} gợi ý` : 'Áp dụng'}
      cancelText="Hủy"
      okButtonProps={{ disabled: selected.length === 0 }}
      onOk={() => onApply(selected)}
      onCancel={onCancel}
      afterClose={() => setDeselected([])}
      width={600}
      destroyOnHidden
    >
      <Typography.Paragraph style={{ color: colors.textMuted }}>
        Gợi ý dựa trên dữ liệu của hệ thống; bạn chọn gợi ý muốn áp dụng rồi lưu phân công.
      </Typography.Paragraph>
      {suggestions.isPending && <SectionSkeleton rows={4} label="Đang tải gợi ý" />}
      {suggestions.isError && (
        <ErrorState title="Không thể tải gợi ý" onRetry={() => suggestions.refetch()} retrying={suggestions.isFetching} />
      )}
      {suggestions.isSuccess && usable.length === 0 && <EmptyState title="Không có gợi ý cho các vị trí còn trống" />}
      {usable.length > 0 && (
        <Flex vertical gap={spacing.xs} style={{ maxHeight: 360, overflowY: 'auto' }}>
          {usable.map((item) => (
            <Checkbox
              key={keyOf(item)}
              checked={!deselected.includes(keyOf(item))}
              onChange={(event) =>
                setDeselected((current) =>
                  event.target.checked ? current.filter((key) => key !== keyOf(item)) : [...current, keyOf(item)],
                )
              }
              style={{ padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.md, marginInlineStart: 0 }}
            >
              <Flex vertical>
                <Typography.Text strong>{item.fullName}</Typography.Text>
                <Typography.Text style={{ color: colors.textMuted }}>{describe(item.requirementId)}</Typography.Text>
              </Flex>
            </Checkbox>
          ))}
        </Flex>
      )}
    </Modal>
  )
}
