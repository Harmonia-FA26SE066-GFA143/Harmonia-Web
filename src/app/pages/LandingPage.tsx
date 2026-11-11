import { MailOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import { useCallback, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useContactEmail } from '@/features/settings'
import { BrandMark, HeroNave, StatusTag, visuallyHidden, type StatusTagProps } from '@/shared/ui'
import { colors, gold, media, radius, seasonColors, spacing, spine, typography } from '@/styles/tokens'
import { LandingStory } from './LandingStory'

const roles = [
  { title: 'Cha xứ', where: 'Trên web', text: 'Lập chương trình phụng vụ, duyệt danh sách bài hát và theo dõi việc chuẩn bị cho các lễ quan trọng.' },
  { title: 'Ca trưởng', where: 'Trên web', text: 'Quản lý ca viên và kho bài hát, lập lịch tập, phân công, giao bài và điểm danh.' },
  { title: 'Ca viên, nhạc công', where: 'Trên ứng dụng di động', text: 'Xác nhận tham gia, xem bài đã duyệt, nộp bản thu luyện tập và đọc nhận xét.' },
  { title: 'Quản trị viên', where: 'Trên web', text: 'Cấp tài khoản, cấu hình danh mục phụng vụ và xuất báo cáo.' },
]

type Mark = { label: string } & Pick<StatusTagProps, 'color' | 'mark'>

/**
 * Illustration only (labelled "Minh hoạ" on the page): the Sundays of Advent 2026 with made-up preparation states, to
 * show what a Director sees. Not data from the backend; the public page has none.
 */
const advent: { day: string; month: string; celebration: string; marks: Mark[] }[] = [
  { day: '29', month: 'tháng 11', celebration: 'Chúa Nhật I Mùa Vọng', marks: [{ label: 'Đã duyệt danh sách', color: 'green' }, { label: 'Đủ phân công', color: 'green' }] },
  { day: '06', month: 'tháng 12', celebration: 'Chúa Nhật II Mùa Vọng', marks: [{ label: 'Đã duyệt danh sách', color: 'green' }, { label: 'Thiếu 2 giọng trầm', color: 'gold' }] },
  { day: '13', month: 'tháng 12', celebration: 'Chúa Nhật III Mùa Vọng', marks: [{ label: 'Chờ Cha xứ duyệt', color: 'gold' }] },
  { day: '20', month: 'tháng 12', celebration: 'Chúa Nhật IV Mùa Vọng', marks: [{ label: 'Chưa lập danh sách', mark: 'draft' }] },
]

const serif: CSSProperties = { fontFamily: typography.displayFontFamily, fontWeight: 600, fontVariantNumeric: 'lining-nums', margin: 0 }
// The page runs edge to edge; its content keeps the shell's measure.
const measure: CSSProperties = { maxWidth: 1360, marginInline: 'auto', paddingInline: 40 }
const goldRule = `1px solid ${gold.line}`
// The ivory band fills the rest of the first screen under the hero.
const bandHeight = 260

/** Public landing page (redesigned 2026-11-03 as a week of the liturgical calendar), rendered outside the application shell. */
export function LandingPage() {
  const navigate = useNavigate()
  // Set by the Admin (Contact.Email, readable before signing in); the project address until then.
  const contactEmail = useContactEmail()
  const aperture = useRef<HTMLCanvasElement>(null)
  const [modelUnavailable, setModelUnavailable] = useState(false)
  const showPhoto = useCallback(() => setModelUnavailable(true), [])

  // A real link (open in a new tab, visible URL); a plain click still navigates inside the app.
  const goTo = (path: string) => (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(path)
  }
  const goToSignIn = goTo(paths.login)
  const large = { paddingInline: spacing.xl, height: 52, fontSize: 16, fontWeight: 600 }

  return (
    <div style={{ background: colors.background }}>
      {/*
        Hero: the name set very large behind a window of light, which covers the foot of its middle letters. The drawn
        nave and its scrim lie under both. The name is decoration here: the header and the heading say it to readers.
      */}
      <section aria-labelledby="hero-heading" className="landing-hero">
        <HeroNave aperture={aperture} onUnavailable={showPhoto} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: media.heroScrim }} />
        <header style={{ ...measure, position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBlock: spacing.lg }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm + 2, color: media.text, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
            <BrandMark size={36} />
            {/* The name is already written across the hero. */}
            <span style={visuallyHidden}>Harmonia</span>
          </span>
          <Button ghost href={paths.login} onClick={goToSignIn} style={{ paddingInline: spacing.lg, height: 40, fontWeight: 600 }}>
            Đăng nhập
          </Button>
        </header>
        <div aria-hidden className="landing-hero__name">
          Harmonia
        </div>
        <div className="landing-hero__stage">
          <Typography.Paragraph className="landing-hero__lead" style={{ margin: 0, color: media.textMuted, fontSize: 16, lineHeight: 1.6 }}>
            Cha xứ duyệt bài hát, Ca trưởng lập lịch tập và phân công, ca viên luyện bài trên điện thoại. Harmonia giữ mọi
            bước trên cùng một lịch phụng vụ.
          </Typography.Paragraph>
          <div className="landing-hero__window">
            {modelUnavailable ? (
              <img src="/media/church-light-poster.webp" alt="" aria-hidden className="landing-hero__light" />
            ) : (
              <canvas ref={aperture} role="presentation" className="landing-hero__light" />
            )}
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: media.windowScrim }} />
            <Typography.Title id="hero-heading" level={1} style={{ ...serif, position: 'relative', color: media.text, fontSize: 40, lineHeight: 1.08, textAlign: 'center', textWrap: 'balance' }}>
              Mỗi Thánh lễ, <br />
              một ca đoàn sẵn sàng.
            </Typography.Title>
            {/* On the dark scrim the sign-in is a white button. */}
            <Button className="landing-hero-sign-in" href={paths.login} onClick={goToSignIn} style={{ ...large, position: 'relative', marginTop: spacing.lg }}>
              Đăng nhập
            </Button>
          </div>
          <div className="landing-hero__contact">
            {/* A request to join, not an account: an Admin decides and the server then emails the sign-in. */}
            <Button ghost href={paths.join} onClick={goTo(paths.join)} style={{ height: 44, fontWeight: 500, marginInlineEnd: spacing.sm }}>
              Đăng ký tham gia ca đoàn
            </Button>
            <Button ghost icon={<MailOutlined />} href={`mailto:${contactEmail}`} style={{ height: 44, fontWeight: 500 }}>
              Liên hệ quản trị viên
            </Button>
          </div>
        </div>
      </section>

      {/* The season band: the one place on this page where season colour and the ribbon appear. */}
      <section aria-labelledby="season-heading" style={{ background: colors.ivory, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ ...measure, minHeight: bandHeight - 1, display: 'grid', gridTemplateColumns: '240px repeat(4, minmax(0, 1fr))' }}>
          <div style={{ position: 'relative', padding: `${spacing.xxl + spacing.lg}px ${spacing.lg}px ${spacing.lg}px 0` }}>
            <span
              aria-hidden
              className="hm-unroll"
              style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 60, background: seasonColors.purple.cloth, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
            />
            <h2 id="season-heading" style={{ ...serif, fontSize: 36, lineHeight: 1.1, color: seasonColors.purple.ink }}>
              Mùa Vọng
            </h2>
            <Typography.Text style={{ display: 'block', marginTop: spacing.xs, fontSize: 13, color: colors.textMuted }}>
              Bốn Chúa Nhật chuẩn bị mừng Chúa Giáng Sinh
            </Typography.Text>
            <Typography.Text style={{ display: 'block', marginTop: spacing.md, fontSize: 12, fontWeight: 500, color: gold.ink }}>
              Minh hoạ, không phải dữ liệu thật
            </Typography.Text>
          </div>
          <ol className="hm-stagger" style={{ display: 'contents', listStyle: 'none' }}>
            {advent.map((sunday) => (
              <li key={sunday.day} style={{ padding: `${spacing.lg + spacing.xs}px ${spacing.lg}px ${spacing.lg + spacing.xs}px`, borderLeft: `1px solid ${colors.border}` }}>
                <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: spacing.sm, color: colors.primary }}>
                  <span style={{ fontSize: 42, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em' }}>{sunday.day}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{sunday.month}</span>
                </p>
                <p style={{ ...serif, margin: `${spacing.sm + 2}px 0 ${spacing.md}px`, fontSize: 25, lineHeight: 1.15, color: colors.textPrimary, textWrap: 'balance' }}>{/* Keep "Chúa Nhật I" together so the title breaks before the season. */}
                  {sunday.celebration.replace(/(Nhật) /, '$1 ')}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs + 2 }}>
                  {sunday.marks.map(({ label, ...mark }) => (
                    <StatusTag key={label} {...mark} style={{ marginInlineEnd: 0 }}>
                      {label}
                    </StatusTag>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <LandingStory />

      {/* The close: the roles and the way in, on the songbook's bookcloth. */}
      <section aria-labelledby="roles-heading" style={{ background: spine.background, color: spine.text }}>
        <div style={{ ...measure, paddingBlock: `${spacing.xxl * 2}px ${spacing.xxl}px` }}>
          <Typography.Title id="roles-heading" level={2} style={{ ...serif, fontSize: 52, lineHeight: 1.08, color: media.text, maxWidth: 640 }}>
            Mỗi người một việc, chung một lịch.
          </Typography.Title>
          <Typography.Paragraph style={{ margin: `${spacing.md}px 0 0`, fontSize: 17, color: spine.text }}>
            Quyền được chia theo đúng trách nhiệm trong cộng đoàn.
          </Typography.Paragraph>
          <div style={{ marginTop: spacing.xxl + spacing.md, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderTop: goldRule }}>
            {roles.map((role, index) => (
              <article key={role.title} style={{ padding: `${spacing.lg + spacing.xs}px ${spacing.lg}px 0`, paddingInlineStart: index ? spacing.lg : 0, borderLeft: index ? goldRule : undefined }}>
                <Typography.Title level={3} style={{ ...serif, fontSize: 30, lineHeight: 1.15, color: media.text }}>
                  {role.title}
                </Typography.Title>
                <Typography.Text style={{ display: 'block', marginTop: spacing.xs, fontSize: 12, fontWeight: 500, color: spine.groupTitle }}>{role.where}</Typography.Text>
                <Typography.Paragraph style={{ margin: `${spacing.md}px 0 0`, fontSize: 15, lineHeight: 1.65, color: spine.text }}>{role.text}</Typography.Paragraph>
              </article>
            ))}
          </div>

          <div
            style={{
              marginTop: spacing.xxl * 2,
              paddingTop: spacing.xxl,
              borderTop: goldRule,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: spacing.xl,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Typography.Title id="contact-heading" level={2} style={{ ...serif, fontSize: 40, lineHeight: 1.1, color: media.text }}>
                Cần tài khoản cho giáo xứ?
              </Typography.Title>
              <Typography.Paragraph style={{ margin: `${spacing.sm}px 0 0`, fontSize: 16, color: spine.text }}>
                Quản trị viên Harmonia sẽ cấp tài khoản và vai trò cho bạn.
              </Typography.Paragraph>
            </div>
            <a
              href={`mailto:${contactEmail}`}
              className="on-media-link"
              style={{ display: 'inline-flex', alignItems: 'center', height: 52, paddingInline: spacing.xl, borderRadius: radius.md, background: media.text, color: colors.primary, fontSize: 16, fontWeight: 600 }}
            >
              {contactEmail}
            </a>
          </div>

          <footer style={{ marginTop: spacing.xxl * 2, display: 'flex', alignItems: 'center', gap: spacing.sm, color: spine.groupTitle, fontSize: 13 }}>
            <BrandMark size={20} />
            Harmonia · Hệ thống điều phối ca đoàn và quản lý âm nhạc phụng vụ
          </footer>
        </div>
      </section>
    </div>
  )
}
