import { Button, Flex, Modal, Typography } from 'antd'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { colors, spacing, typography } from '@/styles/tokens'
import { LICENSES_URL, VEROVIO_LICENSE_ID, VEROVIO_SOURCE_URL, VEROVIO_VERSION } from './verovioNotice'

interface LicenseTexts {
  lgpl: string
  gpl: string
}

/** The two texts are loaded when the dialog is first opened (one chunk each), so they weigh nothing on the page that shows the credit. */
async function loadTexts(): Promise<LicenseTexts> {
  const [lgpl, gpl] = await Promise.all([import('./lgpl-3.0.txt?raw'), import('./gpl-3.0.txt?raw')])
  return { lgpl: lgpl.default, gpl: gpl.default }
}

/** The one scroll region of the dialog: focusable, so the keyboard can scroll it. The page behind is held by the dialog. */
const SCROLL: CSSProperties = { overflowY: 'auto', maxHeight: 'calc(100dvh - 180px)', paddingInlineEnd: spacing.sm }
/** Wrapped, never scrolled sideways: a second scroll direction inside the scroll region would be a nested one. */
const TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: typography.metadata.fontSize,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}
/** Inherits the colour of the surface it sits on, so it reads on the light page and on the dark ground of focus mode. */
const LINK: CSSProperties = { color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }

function Source({ href, children }: Readonly<{ href: string; children: string }>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={LINK}>
      {children}
    </a>
  )
}

function Fact({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <li>
      <strong>{label}:</strong> {children}
    </li>
  )
}

function LicenseBody({ texts }: Readonly<{ texts: LicenseTexts | 'failed' | undefined }>) {
  if (texts === undefined) return <Typography.Text role="status">Đang tải bản văn giấy phép…</Typography.Text>
  if (texts === 'failed')
    return (
      <Typography.Paragraph role="alert">
        Không tải được bản văn giấy phép. Vui lòng mở lại hộp thoại, hoặc đọc bản văn tại <Source href={LICENSES_URL}>{LICENSES_URL}</Source>.
      </Typography.Paragraph>
    )
  return (
    <>
      <Typography.Title level={5}>Bản văn LGPL-3.0</Typography.Title>
      <pre style={TEXT}>{texts.lgpl}</pre>
      <Typography.Title level={5} style={{ marginTop: spacing.lg }}>
        Bản văn GPL-3.0 (LGPL-3.0 dẫn chiếu giấy phép này)
      </Typography.Title>
      <pre style={TEXT}>{texts.gpl}</pre>
    </>
  )
}

/**
 * The credit line under a score that is on screen, and the dialog behind its "Giấy phép" button: library, version,
 * licence, source, how it is used, and the full licence texts. It only states facts; it gives no legal conclusion.
 */
export function ScoreCredit() {
  const [open, setOpen] = useState(false)
  const [texts, setTexts] = useState<LicenseTexts | 'failed'>()

  const show = () => {
    setOpen(true)
    if (texts && texts !== 'failed') return
    setTexts(undefined)
    loadTexts().then(setTexts, () => setTexts('failed'))
  }

  return (
    <>
      <Flex wrap align="center" gap={spacing.xs} style={{ marginTop: spacing.sm, fontSize: typography.metadata.fontSize, color: `var(--hm-focus-muted, ${colors.textMuted})` }}>
        <span>Bản nhạc được dựng bằng Verovio ·</span>
        <Button
          type="link"
          aria-label="Giấy phép của Verovio"
          aria-haspopup="dialog"
          onClick={show}
          style={{ color: `var(--hm-focus-text, ${colors.primary})`, textDecoration: 'underline', textUnderlineOffset: 2, paddingInline: spacing.xs }}
        >
          Giấy phép
        </Button>
      </Flex>
      <Modal
        open={open}
        centered
        destroyOnHidden
        footer={null}
        width={720}
        title="Giấy phép của Verovio"
        closable={{ 'aria-label': 'Đóng' }}
        onCancel={() => setOpen(false)}
      >
        <div role="region" aria-label="Nội dung giấy phép" tabIndex={0} style={SCROLL}>
          <Typography.Paragraph>Trang này dùng thư viện mã nguồn mở Verovio để dựng bản nhạc.</Typography.Paragraph>
          <ul style={{ paddingInlineStart: spacing.lg }}>
            <Fact label="Thư viện">Verovio, phiên bản {VEROVIO_VERSION}</Fact>
            <Fact label="Giấy phép">
              GNU Lesser General Public License phiên bản 3 ({VEROVIO_LICENSE_ID})
            </Fact>
            <Fact label="Mã nguồn">
              <Source href={VEROVIO_SOURCE_URL}>{VEROVIO_SOURCE_URL}</Source>
            </Fact>
            <Fact label="Cách dùng">
              Thư viện được dùng nguyên bản, chưa sửa đổi. Nó nằm trong một tệp riêng, chỉ tải khi mở bản nhạc.
            </Fact>
          </ul>
          <Typography.Paragraph>
            Bản văn đầy đủ của hai giấy phép dưới đây là bản gốc tiếng Anh, sao nguyên văn từ <Source href={LICENSES_URL}>{LICENSES_URL}</Source>.
          </Typography.Paragraph>
          <LicenseBody texts={texts} />
        </div>
      </Modal>
    </>
  )
}
