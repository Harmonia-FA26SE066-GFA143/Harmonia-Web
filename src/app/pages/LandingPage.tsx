import {
  CheckCircleFilled,
  MailOutlined,
} from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useContactEmail } from '@/features/settings'
import { BrandMark } from '@/shared/ui'
import { cardSurface, colors, media, radius, sizes, spacing, typography } from '@/styles/tokens'
import { HeroVideo } from './HeroVideo'

interface RoleSummary {
  title: string
  platform: string
  duties: string[]
}

const roleSummaries: RoleSummary[] = [
  {
    title: 'Cha xứ',
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
  // Set by the Admin (Contact.Email, readable before signing in); the project address until then.
  const contactEmail = useContactEmail()

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
        height: sizes.controlHeight,
        fontWeight: 600,
      }}
    >
      Đăng nhập
    </Button>
  )

  // Accounts are created by an Admin, so writing to the administrators is how a newcomer gets one.
  const contact = (
    <Button
      ghost
      icon={<MailOutlined />}
      href={`mailto:${contactEmail}`}
      style={{
        paddingInline: spacing.lg,
        height: sizes.controlHeight,
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
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Flex align="center" gap={spacing.sm}>
          <BrandMark size={36} />
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

      {/* Hero: a decorative looping video under a scrim that keeps the text at AA contrast. */}
      <section
        aria-labelledby="hero-heading"
        className="landing-hero"
        style={{
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate',
          display: 'flex',
          alignItems: 'center',
          minHeight: 520,
          borderRadius: radius.lg,
          background: media.backdrop,
        }}
      >
        <HeroVideo />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: media.heroScrim }} />
        <div style={{ position: 'relative', zIndex: 1, padding: spacing.xxl + spacing.sm }}>
          <Typography.Title
            id="hero-heading"
            level={1}
            style={{
              margin: 0,
              maxWidth: 720,
              color: media.text,
              fontWeight: 800,
              fontSize: 42,
              lineHeight: 1.22,
              letterSpacing: '-0.03em',
            }}
          >
            Điều phối ca đoàn và quản lý âm nhạc phụng vụ
          </Typography.Title>
          {/* 60ch keeps lines at a readable length. */}
          <Typography.Paragraph
            style={{
              margin: `${spacing.lg}px 0 ${spacing.xl}px`,
              maxWidth: '60ch',
              color: media.textMuted,
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Harmonia giúp Cha xứ, Ca trưởng và thành viên ca đoàn cùng chuẩn bị chương trình phụng vụ,
            danh sách bài hát, lịch tập và phân công phục vụ trên một hệ thống chung.
          </Typography.Paragraph>
          <Flex wrap gap={spacing.md}>
            {/* On the dark scrim the sign-in is a white button; the header keeps the burgundy one. */}
            <Button
              className="landing-hero-sign-in"
              href={paths.login}
              onClick={goToSignIn}
              style={{ paddingInline: spacing.lg, height: sizes.controlHeight, fontWeight: 600 }}
            >
              Đăng nhập
            </Button>
            {contact}
          </Flex>
        </div>
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
            return (
              <article
                key={role.title}
                style={{
                  ...cardSurface,
                  padding: spacing.xl,
                  borderRadius: radius.lg,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography.Title
                  level={3}
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {role.title}
                </Typography.Title>
                <Typography.Text style={{ color: colors.textMuted }}>Dùng trên {role.platform === 'Web' ? 'web' : 'ứng dụng di động'}</Typography.Text>

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
          background: colors.primarySoft,
          border: `1px solid ${colors.primaryFocus}`,
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
          borderTop: `1px solid ${colors.border}`,
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
