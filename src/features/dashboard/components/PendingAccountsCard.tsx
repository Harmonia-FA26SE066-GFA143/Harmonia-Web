import { UserAddOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Skeleton, Typography } from 'antd'
import { colors, spacing, typography } from '@/styles/tokens'

export interface PendingAccountsCardProps {
  /** Number of accounts awaiting role confirmation; undefined while loading. */
  count?: number
  loading?: boolean
  error?: boolean
  onRetry: () => void
  onOpen: () => void
}

/** Pending self-registered accounts (DECIDED 2026-09-26: shown as a count on the Admin dashboard). */
export function PendingAccountsCard({ count, loading = false, error = false, onRetry, onOpen }: PendingAccountsCardProps) {
  return (
    <Card styles={{ body: { padding: spacing.lg } }}>
      <Flex wrap align="center" justify="space-between" gap={spacing.md}>
        <Flex align="center" gap={spacing.md}>
          <Flex
            aria-hidden
            align="center"
            justify="center"
            style={{ width: 48, height: 48, borderRadius: 10, background: colors.primarySoft, color: colors.primary, fontSize: 22 }}
          >
            <UserAddOutlined />
          </Flex>
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Tài khoản chờ xác nhận
            </Typography.Title>
            {loading && <Skeleton.Input active size="small" style={{ width: 120, marginTop: spacing.xs }} />}
            {error && (
              <Typography.Text style={{ color: colors.textMuted }}>Không thể tải số tài khoản chờ xác nhận.</Typography.Text>
            )}
            {!loading && !error && (
              <Typography.Text style={{ color: colors.textMuted }}>
                <span style={{ fontFamily: typography.fontFamilyNumeric, fontWeight: 700, color: colors.textPrimary }}>
                  {count}
                </span>{' '}
                tài khoản tự đăng ký đang chờ bạn xác nhận vai trò.
              </Typography.Text>
            )}
          </div>
        </Flex>
        {error ? (
          <Button onClick={onRetry}>Thử lại</Button>
        ) : (
          <Button type="primary" onClick={onOpen} disabled={loading}>
            Xem và xác nhận
          </Button>
        )}
      </Flex>
    </Card>
  )
}
