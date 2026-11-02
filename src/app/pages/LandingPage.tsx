import { MailOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import type { CSSProperties, MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useContactEmail } from '@/features/settings'
import { BrandMark } from '@/shared/ui'
import { colors, gold, media, radius, sizes, spacing, spine, typography } from '@/styles/tokens'
import { HeroVideo } from './HeroVideo'

/** One program from song list to celebration, who does each step (the six steps of `PreparationSteps`). */
const steps = [
  { title: 'Soạn danh sách', who: 'Ca trưởng', text: 'Chọn bài cho từng phần của Thánh lễ.' },
  { title: 'Duyệt bài hát', who: 'Cha xứ', text: 'Duyệt, yêu cầu sửa hoặc từ chối kèm ghi chú.' },
  { title: 'Xác nhận tham gia', who: 'Ca viên', text: 'Trả lời trên điện thoại: có, không hay chưa chắc.' },
  { title: 'Phân công', who: 'Ca trưởng', text: 'Đủ người cho từng bè, từng nhạc cụ.' },
  { title: 'Tập và luyện', who: 'Cả ca đoàn', text: 'Điểm danh buổi tập, nộp bản thu, nhận xét.' },
  { title: 'Cử hành', who: 'Giáo xứ', text: 'Ca đoàn phục vụ Thánh lễ.' },
]

const roles = [
  { title: 'Cha xứ', where: 'Trên web', text: 'Lập chương trình phụng vụ, duyệt danh sách bài hát và theo dõi việc chuẩn bị cho các lễ quan trọng.' },
  { title: 'Ca trưởng', where: 'Trên web', text: 'Quản lý ca viên và kho bài hát, lập lịch tập, phân công, giao bài và điểm danh.' },
  { title: 'Ca viên, nhạc công', where: 'Trên ứng dụng di động', text: 'Xác nhận tham gia, xem bài đã duyệt, nộp bản thu luyện tập và đọc nhận xét.' },
  { title: 'Quản trị viên', where: 'Trên web', text: 'Cấp tài khoản, cấu hình danh mục phụng vụ và xuất báo cáo.' },
]

const display: CSSProperties = { fontFamily: typography.displayFontFamily, fontWeight: 600, margin: 0 }

function Eyebrow({ children, onMedia = false }: Readonly<{ children: string; onMedia?: boolean }>) {
  return (
    <Flex align="center" gap={spacing.sm} style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: onMedia ? gold.soft : gold.ink }}>
      <span aria-hidden style={{ width: 32, height: 1, background: gold.line }} />
      {children}
    </Flex>
  )
}

/** Public landing page (Stitch SHARED-04, redrawn 2026-11-02), rendered outside the application shell. */
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
  const large = { paddingInline: spacing.lg, height: 48, fontSize: 15, fontWeight: 600 }

  return (
    <Flex vertical style={{ paddingBottom: spacing.xl }}>
      <Flex component="header" justify="space-between" align="center" style={{ paddingBottom: spacing.lg }}>
        <Flex align="center" gap={spacing.sm}>
          <BrandMark size={36} />
          <Typography.Text strong style={{ fontSize: typography.sectionHeading.fontSize, color: colors.primary, letterSpacing: '-0.02em' }}>
            Harmonia
          </Typography.Text>
        </Flex>
        <Button type="primary" href={paths.login} onClick={goToSignIn} style={{ paddingInline: spacing.lg, height: sizes.controlHeight, fontWeight: 600 }}>
          Đăng nhập
        </Button>
      </Flex>

      {/* Hero: a decorative looping video under a scrim that keeps the text at AA contrast. */}
      <section
        aria-labelledby="hero-heading"
        className="landing-hero"
        style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate', display: 'flex', alignItems: 'center', minHeight: 600, borderRadius: radius.lg * 2, background: media.backdrop }}
      >
        <HeroVideo />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: media.heroScrim }} />
        <div style={{ position: 'relative', zIndex: 1, padding: `${spacing.xxl * 2}px ${spacing.xxl + spacing.lg}px`, maxWidth: 800 }}>
          <Eyebrow onMedia>Âm nhạc phụng vụ của giáo xứ</Eyebrow>
          <Typography.Title id="hero-heading" level={1} style={{ ...display, marginTop: spacing.lg, color: media.text, fontSize: 68, lineHeight: 1.05 }}>
            Mỗi Thánh lễ,{' '}
            <br />
            một ca đoàn sẵn sàng.
          </Typography.Title>
          <Typography.Paragraph style={{ margin: `${spacing.lg}px 0 ${spacing.xl}px`, maxWidth: '56ch', color: media.textMuted, fontSize: 17, lineHeight: 1.7 }}>
            Cha xứ duyệt bài hát, Ca trưởng lập lịch tập và phân công, ca viên luyện bài trên điện thoại. Harmonia giữ mọi
            bước trên cùng một lịch phụng vụ.
          </Typography.Paragraph>
          <Flex wrap gap={spacing.md}>
            {/* On the dark scrim the sign-in is a white button; the header keeps the burgundy one. */}
            <Button className="landing-hero-sign-in" href={paths.login} onClick={goToSignIn} style={large}>
              Đăng nhập
            </Button>
            {/* Accounts are created by an Admin, so writing to the administrators is how a newcomer gets one. */}
            <Button ghost icon={<MailOutlined />} href={`mailto:${contactEmail}`} style={{ ...large, fontWeight: 500 }}>
              Liên hệ quản trị viên
            </Button>
          </Flex>
        </div>
      </section>

      <section aria-labelledby="steps-heading" style={{ marginTop: spacing.xxl * 2 }}>
        <Eyebrow>Một chương trình phụng vụ</Eyebrow>
        <Typography.Title id="steps-heading" level={2} style={{ ...display, marginTop: spacing.sm, fontSize: 40, lineHeight: 1.15 }}>
          Từ danh sách bài hát đến ngày cử hành
        </Typography.Title>
        <ol style={{ position: 'relative', listStyle: 'none', margin: `${spacing.xl + spacing.sm}px 0 0`, padding: 0, display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          <span aria-hidden style={{ position: 'absolute', top: 15, insetInline: '0 8%', height: 1, background: gold.line }} />
          {steps.map((step, index) => {
            const last = index === steps.length - 1
            return (
              <li key={step.title} style={{ position: 'relative', paddingInlineEnd: spacing.lg }}>
                <span
                  aria-hidden
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: `1.5px solid ${colors.primary}`,
                    background: last ? colors.primary : colors.background,
                    color: last ? media.text : colors.primary,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </span>
                <Typography.Text strong style={{ display: 'block', marginTop: spacing.md, fontSize: 15, color: colors.textPrimary }}>
                  {step.title}
                </Typography.Text>
                <Typography.Text style={{ display: 'block', fontSize: typography.metadata.fontSize, fontWeight: 500, color: gold.ink }}>{step.who}</Typography.Text>
                <Typography.Text style={{ display: 'block', marginTop: spacing.xs, fontSize: 13, color: colors.textMuted }}>{step.text}</Typography.Text>
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="roles-heading" style={{ marginTop: spacing.xxl * 2, display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: spacing.xxl + spacing.md }}>
        <div>
          <Eyebrow>Bốn vai trò</Eyebrow>
          <Typography.Title id="roles-heading" level={2} style={{ ...display, marginTop: spacing.sm, fontSize: 40, lineHeight: 1.15 }}>
            Mỗi người một việc, chung một lịch.
          </Typography.Title>
          <Typography.Paragraph style={{ margin: `${spacing.md}px 0 0`, color: colors.textMuted, fontSize: 15 }}>
            Quyền được chia theo đúng trách nhiệm trong cộng đoàn.
          </Typography.Paragraph>
        </div>
        <div>
          {roles.map((role, index) => (
            <article
              key={role.title}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px minmax(0, 1fr)',
                gap: spacing.lg,
                padding: `${spacing.lg}px 0`,
                borderTop: `1px solid ${colors.border}`,
                borderBottom: index === roles.length - 1 ? `1px solid ${colors.border}` : undefined,
              }}
            >
              <div>
                <Typography.Title level={3} style={{ margin: 0, fontSize: 18 }}>
                  {role.title}
                </Typography.Title>
                <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>{role.where}</Typography.Text>
              </div>
              <Typography.Paragraph style={{ margin: 0, fontSize: 15, color: colors.textBody }}>{role.text}</Typography.Paragraph>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="contact-heading"
        style={{ marginTop: spacing.xxl * 2, padding: `${spacing.xxl}px ${spacing.xxl + spacing.md}px`, borderRadius: radius.lg * 2, background: spine.background }}
      >
        <Flex justify="space-between" align="center" gap={spacing.xl} wrap>
          <div>
            <Typography.Title id="contact-heading" level={2} style={{ ...display, color: media.text, fontSize: 36 }}>
              Cần tài khoản cho giáo xứ?
            </Typography.Title>
            <Typography.Paragraph style={{ margin: `${spacing.sm}px 0 0`, color: spine.text }}>
              Quản trị viên Harmonia sẽ cấp tài khoản và vai trò cho bạn.
            </Typography.Paragraph>
          </div>
          <a
            href={`mailto:${contactEmail}`}
            className="on-media-link"
            style={{ display: 'inline-flex', alignItems: 'center', height: 48, paddingInline: spacing.lg, borderRadius: radius.md, background: media.text, color: colors.primary, fontWeight: 600 }}
          >
            {contactEmail}
          </a>
        </Flex>
      </section>

      <footer style={{ marginTop: spacing.xxl, paddingTop: spacing.lg, borderTop: `1px solid ${colors.border}`, textAlign: 'center' }}>
        <Typography.Text style={{ color: colors.textMuted, fontSize: 13 }}>Harmonia · Hệ thống điều phối ca đoàn và quản lý âm nhạc phụng vụ</Typography.Text>
      </footer>
    </Flex>
  )
}
