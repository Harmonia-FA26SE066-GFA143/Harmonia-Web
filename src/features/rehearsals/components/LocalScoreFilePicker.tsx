import { FolderOpenOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { BrowserFileScoreSource } from '../score/source/BrowserFileScoreSource'
import type { ScorePackageSource } from '../score/source/types'
import { colors, radius, spacing } from '@/styles/tokens'

type FileKind = 'score' | 'audio'

const fields: { kind: FileKind; label: string; action: string; accept: string }[] = [
  { kind: 'score', label: 'Tệp bản nhạc (.musicxml, .mxl)', action: 'Chọn tệp bản nhạc', accept: '.musicxml,.mxl' },
  { kind: 'audio', label: 'Tệp âm thanh (.wav)', action: 'Chọn tệp âm thanh', accept: '.wav' },
]

/**
 * TEMPORARY source: lets a score and its WAV be opened from this computer until Track A connects the API.
 * Remove this file and its one use in `ScorePracticeSection` then. Nothing here leaves the browser.
 * The native file input is hidden: its button text follows the browser's language, so a Vietnamese button opens it.
 */
export function LocalScoreFilePicker({ onPick }: Readonly<{ onPick: (source: ScorePackageSource) => void }>) {
  const id = useId()
  const chosen = useRef<Partial<Record<FileKind, File>>>({})
  const inputs = useRef<Partial<Record<FileKind, HTMLInputElement | null>>>({})
  const [names, setNames] = useState<Partial<Record<FileKind, string>>>({})

  const choose = (kind: FileKind) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    chosen.current[kind] = file
    setNames((current) => ({ ...current, [kind]: file?.name }))
    const { score, audio } = chosen.current
    if (score && audio) onPick(new BrowserFileScoreSource({ score, audio }))
  }

  return (
    <section
      aria-label="Mở bản nhạc từ máy"
      style={{ marginTop: spacing.lg, padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radius.lg }}
    >
      <Typography.Text strong>Mở bản nhạc từ máy</Typography.Text>
      <Typography.Paragraph type="secondary" style={{ marginBottom: spacing.sm }}>
        Vui lòng chọn cả hai tệp của cùng một bài. Tệp chỉ mở trên máy này, không được tải lên.
      </Typography.Paragraph>
      <Flex wrap gap={spacing.lg}>
        {fields.map(({ kind, label, action, accept }) => (
          <div key={kind} style={{ flex: 1, minWidth: 240 }}>
            <Typography.Text id={`${id}-${kind}-label`} style={{ display: 'block', marginBottom: spacing.xs }}>
              {label}
            </Typography.Text>
            <Flex align="center" gap={spacing.sm}>
              <Button
                icon={<FolderOpenOutlined aria-hidden />}
                aria-describedby={`${id}-${kind}-label ${id}-${kind}-name`}
                onClick={() => inputs.current[kind]?.click()}
              >
                {action}
              </Button>
              <Typography.Text id={`${id}-${kind}-name`} type="secondary" ellipsis style={{ minWidth: 0 }}>
                {names[kind] ?? 'Chưa chọn tệp'}
              </Typography.Text>
            </Flex>
            <input
              ref={(element) => {
                inputs.current[kind] = element
              }}
              type="file"
              accept={accept}
              aria-label={label}
              hidden
              onChange={choose(kind)}
            />
          </div>
        ))}
      </Flex>
    </section>
  )
}
