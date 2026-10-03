import { Button, Flex, Typography } from 'antd'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors, radius, spacing, typography } from '@/styles/tokens'

interface RoleSummary {
  title: string
  platform: string
  duties: string[]
}

/**
 * Role summaries condensed from docs/local/business/actors.md (Report 1 FE-01–FE-54).
 * Stitch SHARED-04 content without a business source (7-step process, figures, program mockups) is omitted.
 */
const roleSummaries: RoleSummary[] = [
  {
    title: 'Cha xứ / Hội đồng Phụng vụ',
    platform: 'Web',
    duties: [
      'Lập hoặc xem xét chương trình phụng vụ hằng tuần.',
      'Phê duyệt, từ chối hoặc yêu cầu chỉnh sửa danh sách bài hát đề xuất, kèm ghi chú.',
      'Theo dõi tình trạng chuẩn bị của ca đoàn cho các sự kiện quan trọng.',
      'Xem báo cáo lịch sử phục vụ, sử dụng bài hát và chuẩn bị sự kiện.',
    ],
  },
  {
    title: 'Ca trưởng',
    platform: 'Web',
    duties: [
      'Quản lý thành viên ca đoàn và duyệt kỹ năng đã khai báo.',
      'Quản lý kho bài hát, tài liệu tập và phân loại bài hát.',
      'Đề xuất danh sách bài hát và lập lịch tập cho sự kiện.',
      'Gửi yêu cầu xác nhận tham gia, phân công phục vụ, giao bài tập và điểm danh.',
    ],
  },
  {
    title: 'Thành viên ca đoàn / Nhạc công',
    platform: 'Ứng dụng di động',
    duties: [
      'Xem hồ sơ cá nhân, khai báo kỹ năng và theo dõi trạng thái duyệt.',
      'Xem sự kiện sắp tới và phản hồi tham gia.',
      'Xem danh sách bài hát đã duyệt và tài liệu tập.',
      'Nộp bản thu âm bài tập và xem nhận xét của Ca trưởng.',
    ],
  },
  {
    title: 'Quản trị viên',
    platform: 'Web',
    duties: [
      'Quản lý tài khoản và xác nhận vai trò người dùng.',
      'Cấu hình danh mục kỹ năng, mùa phụng vụ, loại Thánh lễ, loại nghi lễ và loại sự kiện.',
      'Xem và xuất báo cáo theo tháng, sự kiện hoặc mùa phụng vụ.',
      'Xem lịch sử hoạt động của hệ thống.',
    ],
  },
]

/** Public landing page (Stitch SHARED-04), rendered outside the application shell. */
export function LandingPage() {
  const navigate = useNavigate()

  const actions = (
    <Flex wrap gap={spacing.sm}>
      <Button type="primary" onClick={() => navigate(paths.login)}>
        Đăng nhập
      </Button>
    </Flex>
  )

  return (
    <Flex vertical gap={spacing.xxl}>
      <Flex component="header" justify="space-between" align="center" wrap gap={spacing.md}>
        <Typography.Text strong style={{ fontSize: typography.sectionHeading.fontSize, color: colors.primary }}>
          Harmonia
        </Typography.Text>
        {actions}
      </Flex>

      <section style={{ maxWidth: 720 }}>
        <Typography.Title level={1} style={{ margin: 0, fontWeight: typography.pageTitle.fontWeight }}>
          Điều phối ca đoàn và quản lý âm nhạc phụng vụ
        </Typography.Title>
        <Typography.Paragraph style={{ margin: `${spacing.md}px 0 ${spacing.lg}px`, color: colors.textBody }}>
          Harmonia giúp Cha xứ / Hội đồng Phụng vụ, Ca trưởng và thành viên ca đoàn cùng chuẩn bị chương trình phụng vụ,
          danh sách bài hát, lịch tập và phân công phục vụ trên một hệ thống chung.
        </Typography.Paragraph>
        {actions}
      </section>

      <section aria-labelledby="roles-heading">
        <Typography.Title id="roles-heading" level={2} style={{ margin: `0 0 ${spacing.lg}px` }}>
          Mỗi vai trò, một không gian làm việc
        </Typography.Title>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: spacing.lg,
          }}
        >
          {roleSummaries.map((role) => (
            <article
              key={role.title}
              style={{
                padding: spacing.lg,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
              }}
            >
              <Typography.Title level={3} style={{ margin: 0 }}>
                {role.title}
              </Typography.Title>
              <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                {role.platform}
              </Typography.Text>
              <ul style={{ margin: `${spacing.md}px 0 0`, paddingInlineStart: spacing.lg, color: colors.textBody }}>
                {role.duties.map((duty) => (
                  <li key={duty} style={{ marginBottom: spacing.xs }}>
                    {duty}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md }}>
        <Typography.Text style={{ color: colors.textMuted }}>
          Harmonia · Hệ thống điều phối ca đoàn và quản lý âm nhạc phụng vụ
        </Typography.Text>
      </footer>
    </Flex>
  )
}
