import { MailOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import type { CSSProperties, MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useContactEmail } from '@/features/settings'
import { BrandMark, StatusTag, type StatusTagProps } from '@/shared/ui'
import { colors, gold, media, radius, seasonColors, spacing, spine, typography } from '@/styles/tokens'
import { HeroVideo } from './HeroVideo'

/** One program from song list to celebration and who handles each part. */
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

  // A real link (open in a new tab, visible URL); a plain click still navigates inside the app.
  const goToSignIn = (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(paths.login)
  }
  const large = { paddingInline: spacing.xl, height: 52, fontSize: 16, fontWeight: 600 }

  return (
    <div style={{ background: colors.background }}>
      {/* Hero: a decorative looping video under a scrim that keeps the text at AA contrast, full bleed. */}
      <section
        aria-labelledby="hero-heading"
        className="landing-hero"
        style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate', minHeight: `max(600px, calc(100svh - ${bandHeight}px))`, background: media.backdrop, display: 'flex', flexDirection: 'column' }}
      >
        <HeroVideo />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: media.heroScrim }} />
        <header style={{ ...measure, position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBlock: spacing.lg }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm + 2, color: media.text, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
            <BrandMark size={36} />
            Harmonia
          </span>
          <Button ghost href={paths.login} onClick={goToSignIn} style={{ paddingInline: spacing.lg, height: 40, fontWeight: 600 }}>
            Đăng nhập
          </Button>
        </header>
        <div style={{ ...measure, position: 'relative', zIndex: 1, width: '100%', flex: 1, display: 'flex', alignItems: 'center', paddingBottom: spacing.xxl }}>
          <div style={{ maxWidth: 820 }}>
            <Typography.Title id="hero-heading" level={1} style={{ ...serif, color: media.text, fontSize: 96, lineHeight: 0.98, letterSpacing: '-0.015em', textWrap: 'balance' }}>
              Mỗi Thánh lễ, <br />
              một ca đoàn sẵn sàng.
            </Typography.Title>
            <Typography.Paragraph style={{ margin: `${spacing.lg}px 0 ${spacing.xl + spacing.sm}px`, maxWidth: '54ch', color: media.textMuted, fontSize: 18, lineHeight: 1.65 }}>
              Cha xứ duyệt bài hát, Ca trưởng lập lịch tập và phân công, ca viên luyện bài trên điện thoại. Harmonia giữ mọi
              bước trên cùng một lịch phụng vụ.
            </Typography.Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
              {/* On the dark scrim the sign-in is a white button. */}
              <Button className="landing-hero-sign-in" href={paths.login} onClick={goToSignIn} style={large}>
                Đăng nhập
              </Button>
              {/* Accounts are created by an Admin, so writing to the administrators is how a newcomer gets one. */}
              <Button ghost icon={<MailOutlined />} href={`mailto:${contactEmail}`} style={{ ...large, fontWeight: 500 }}>
                Liên hệ quản trị viên
              </Button>
            </div>
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

      {/* One program set like the printed order of a Mass: each part of the work and who does it. */}
      <section
        aria-labelledby="steps-heading"
        style={{ ...measure, paddingBlock: `${spacing.xxl * 2 + spacing.lg}px ${spacing.xxl * 2 + spacing.lg}px`, display: 'grid', gridTemplateColumns: '400px minmax(0, 1fr)', gap: spacing.xxl + spacing.lg, alignItems: 'start' }}
      >
        <div>
          <Typography.Title id="steps-heading" level={2} style={{ ...serif, fontSize: 52, lineHeight: 1.08, color: colors.textPrimary, textWrap: 'balance' }}>
            Từ danh sách bài hát đến ngày cử hành
          </Typography.Title>
          <Typography.Paragraph style={{ margin: `${spacing.lg}px 0 0`, fontSize: 17, color: colors.textBody }}>
            Mỗi Chúa Nhật trên lịch là một chương trình. Mỗi phần việc có người lo, và ai cũng thấy phần nào còn thiếu.
          </Typography.Paragraph>
        </div>
        {/* Set like the printed program sheet handed out before Mass: a titled sheet, gold double rule, leader dots. */}
        <div style={{ padding: `${spacing.xl + spacing.sm}px ${spacing.xxl}px ${spacing.lg}px`, background: colors.ivory, border: `1px solid ${colors.border}`, borderRadius: 2 }}>
          <p style={{ ...serif, fontSize: 24, lineHeight: 1.2, color: colors.textPrimary, textAlign: 'center' }}>Chương trình ca đoàn</p>
          <p style={{ margin: `${spacing.xs}px 0 0`, textAlign: 'center', fontSize: 13, color: colors.textMuted }}>Mỗi Thánh lễ, cùng những phần việc này</p>
          <div aria-hidden style={{ marginTop: spacing.md, height: 4, borderBlock: goldRule }} />
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {steps.map((step, index) => (
            <li key={step.title} style={{ padding: `${spacing.lg}px 0`, borderTop: index ? `1px solid ${colors.border}` : undefined }}>
              <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: spacing.md }}>
                <span style={{ ...serif, fontSize: 28, lineHeight: 1.2, color: colors.textPrimary, whiteSpace: 'nowrap' }}>{step.title}</span>
                {/* Leader dots, as in a printed Mass program. */}
                <span aria-hidden style={{ flex: 1, alignSelf: 'center', borderBottom: `2px dotted ${gold.line}`, transform: 'translateY(6px)' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: gold.ink, whiteSpace: 'nowrap' }}>{step.who}</span>
              </p>
              <p style={{ margin: `${spacing.xs}px 0 0`, fontSize: 15, color: colors.textBody }}>{step.text}</p>
            </li>
          ))}
          </ul>
        </div>
      </section>

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
