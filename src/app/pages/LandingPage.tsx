import {
  AppstoreOutlined,
  CheckCircleFilled,
  CustomerServiceOutlined,
  MailOutlined,
  MobileOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import type { ComponentType, MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { contactEmail } from '@/config/contact'
import { StatusTag } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'

interface RoleSummary {
  title: string
  platform: string
  icon: ComponentType
  duties: string[]
}

const roleSummaries: RoleSummary[] = [
  {
    title: 'Cha xứ / Hội đồng Phụng vụ',
    platform: 'Web',
    icon: ReadOutlined,
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
    icon: CustomerServiceOutlined,
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
    icon: MobileOutlined,
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
    icon: SafetyCertificateOutlined,
    duties: [
      'Quản lý tài khoản và xác nhận vai trò người dùng.',
      'Cấu hình danh mục kỹ năng, mùa phụng vụ, loại Thánh lễ, loại nghi lễ và loại sự kiện.',
      'Xem và xuất báo cáo theo tháng, sự kiện hoặc mùa phụng vụ.',
      'Xem lịch sử hoạt động của hệ thống.',
    ],
  },
]

function LandingBrandLogo() {
  return (
    <div
      aria-hidden
      style={{
        width: 36,
        height: 36,
        borderRadius: radius.md,
        background: 'linear-gradient(135deg, #8E3B4B 0%, #A24557 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(142, 59, 75, 0.28)',
        flexShrink: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4V20" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M18 4V20" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M6 12H18" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="7" r="1.5" fill="#F3C68F" />
        <path d="M9.5 17C11 16 13 16 14.5 17" stroke="#F3C68F" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/** Public landing page (Stitch SHARED-04), rendered outside the application shell. */
export function LandingPage() {
  const navigate = useNavigate()

  // A real link (open in a new tab, visible URL); a plain click still navigates inside the app.
  const goToSignIn = (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(paths.login)
  }
  const signIn = (
    <Button
      type="primary"
      href={paths.login}
      onClick={goToSignIn}
      style={{
        paddingInline: spacing.lg,
        height: 42,
        fontWeight: 600,
      }}
    >
      Đăng nhập
    </Button>
  )

  // Accounts are created by an Admin, so writing to the administrators is how a newcomer gets one.
  const contact = (
    <Button
      icon={<MailOutlined />}
      href={`mailto:${contactEmail}`}
      style={{
        paddingInline: spacing.lg,
        height: 42,
        borderRadius: radius.md,
        fontWeight: 500,
      }}
    >
      Liên hệ quản trị viên
    </Button>
  )

  return (
    <Flex vertical gap={spacing.xxl} style={{ paddingBottom: spacing.xxl }}>
      <Flex
        component="header"
        justify="space-between"
        align="center"
        wrap
        gap={spacing.md}
        style={{
          paddingBlock: spacing.md,
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Flex align="center" gap={spacing.sm}>
          <LandingBrandLogo />
          <Typography.Text
            strong
            style={{
              fontSize: typography.sectionHeading.fontSize,
              color: colors.primary,
              letterSpacing: '-0.02em',
            }}
          >
            Harmonia
          </Typography.Text>
        </Flex>
        {signIn}
      </Flex>

      {/* Hero section */}
      <section
        style={{
          padding: `${spacing.xl}px 0`,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'rgba(142, 59, 75, 0.08)',
            border: '1px solid rgba(142, 59, 75, 0.15)',
            color: colors.primary,
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: spacing.md,
          }}
        >
          <AppstoreOutlined />
          Hệ thống Quản lý Thánh nhạc & Điều phối Phụng vụ
        </div>

        <Typography.Title
          level={1}
          style={{
            margin: 0,
            maxWidth: 780,
            fontWeight: 800,
            fontSize: 38,
            lineHeight: 1.25,
            letterSpacing: '-0.03em',
            color: colors.textPrimary,
          }}
        >
          Điều phối ca đoàn và quản lý âm nhạc phụng vụ
        </Typography.Title>
        {/* 65ch keeps lines at a readable 65-75 characters. */}
        <Typography.Paragraph
          style={{
            margin: `${spacing.lg}px 0 ${spacing.xl}px`,
            maxWidth: '65ch',
            color: colors.textBody,
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Harmonia giúp Cha xứ / Hội đồng Phụng vụ, Ca trưởng và thành viên ca đoàn cùng chuẩn bị chương trình phụng vụ,
          danh sách bài hát, lịch tập và phân công phục vụ trên một hệ thống chung.
        </Typography.Paragraph>
        <Flex wrap gap={spacing.md}>
          {signIn}
          {contact}
        </Flex>
      </section>

      {/* Roles section */}
      <section aria-labelledby="roles-heading">
        <div style={{ marginBottom: spacing.xl }}>
          <Typography.Title
            id="roles-heading"
            level={2}
            style={{
              margin: 0,
              fontSize: 24,
              letterSpacing: '-0.02em',
              fontWeight: 700,
            }}
          >
            Mỗi vai trò, một không gian làm việc
          </Typography.Title>
          <Typography.Text style={{ color: colors.textMuted, fontSize: 14 }}>
            Được phân quyền chuyên biệt theo đúng sứ vụ và trách nhiệm trong cộng đoàn.
          </Typography.Text>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: spacing.lg,
          }}
        >
          {roleSummaries.map((role) => {
            const Icon = role.icon
            return (
              <article
                key={role.title}
                style={{
                  padding: spacing.xl,
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: radius.lg,
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
                  <div
                    aria-hidden
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      background: 'rgba(142, 59, 75, 0.08)',
                      color: colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    <Icon />
                  </div>
                  <StatusTag color={role.platform === 'Web' ? 'blue' : 'green'}>{role.platform}</StatusTag>
                </Flex>

                <Typography.Title
                  level={3}
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {role.title}
                </Typography.Title>

                <ul
                  style={{
                    margin: `${spacing.md}px 0 0`,
                    padding: 0,
                    listStyle: 'none',
                    color: colors.textBody,
                    flex: 1,
                  }}
                >
                  {role.duties.map((duty) => (
                    <li
                      key={duty}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginBottom: spacing.sm,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                      }}
                    >
                      <CheckCircleFilled
                        style={{
                          color: colors.primary,
                          fontSize: 14,
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      />
                      <span>{duty}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      {/* Contact section */}
      <section
        aria-labelledby="contact-heading"
        style={{
          padding: spacing.xl,
          background: 'linear-gradient(135deg, rgba(142, 59, 75, 0.04) 0%, rgba(248, 249, 250, 0.6) 100%)',
          border: '1px solid rgba(142, 59, 75, 0.12)',
          borderRadius: radius.lg,
        }}
      >
        <Flex vertical gap={spacing.xs}>
          <Typography.Title
            id="contact-heading"
            level={2}
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Liên hệ
          </Typography.Title>
          <Typography.Paragraph style={{ margin: 0, color: colors.textBody, fontSize: 14 }}>
            Cần tài khoản hoặc hỗ trợ? Gửi email cho quản trị viên Harmonia:{' '}
            <Typography.Link
              href={`mailto:${contactEmail}`}
              style={{ fontWeight: 600, color: colors.primary }}
            >
              {contactEmail}
            </Typography.Link>
          </Typography.Paragraph>
        </Flex>
      </section>

      <footer
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          paddingTop: spacing.lg,
          textAlign: 'center',
        }}
      >
        <Typography.Text style={{ color: colors.textMuted, fontSize: 13 }}>
          Harmonia · Hệ thống điều phối ca đoàn và quản lý âm nhạc phụng vụ
        </Typography.Text>
      </footer>
    </Flex>
  )
}
