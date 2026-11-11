import { ArrowRightOutlined, CheckOutlined, ClockCircleOutlined, DownOutlined, EllipsisOutlined, MinusOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState, type ReactNode } from 'react'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import {
  MassTimeMark,
  massTimeLabels,
  massTimeOf,
  preparationItems,
  SongListStatusTag,
  usePreparationStatus,
  type LiturgicalProgram,
  type PreparationItem,
  type PreparationState,
} from '@/features/liturgical-programs'
import { SectionSkeleton, useReducedMotion, VoicePartIcon } from '@/shared/ui'
import { colors, gold, spacing, typography } from '@/styles/tokens'

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`
const detailPath = (program: LiturgicalProgram) => generatePath(paths.director.programDetail, { programId: program.id })
const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

const stateIcon: Record<Exclude<PreparationState, 'done'>, ReactNode> = {
  waiting: <ClockCircleOutlined />,
  progress: <EllipsisOutlined />,
  todo: <MinusOutlined />,
}

// What waits on the Director reads first. The items stay independent: no numbers, no connectors.
const stateOrder: Record<PreparationState, number> = { waiting: 0, todo: 1, progress: 2, done: 3 }

/** Where each preparation item is worked on. */
function itemAction(program: LiturgicalProgram, label: string) {
  const songList = generatePath(paths.director.songListProposal, { programId: program.id })
  const actions: Record<string, { to: string; text: string }> = {
    'Danh sách bài hát': { to: songList, text: 'Mở danh sách' },
    'Cha xứ duyệt': { to: songList, text: 'Xem danh sách' },
    'Xác nhận tham gia': { to: paths.director.participation, text: 'Mở xác nhận' },
    'Chốt phân công': { to: `${paths.director.roster}?programId=${program.id}`, text: 'Mở phân công' },
    Tập: { to: paths.director.rehearsals, text: 'Mở lịch tập' },
  }
  return actions[label]
}

/** Counts up to the number once when it arrives; the words beside it always carry the final value for readers. */
function CountIn({ value }: Readonly<{ value: number }>) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (reduced) return
    let current = 0
    const timer = setInterval(() => {
      current += 1
      setShown(Math.min(current, value))
      if (current >= value) clearInterval(timer)
    }, 80)
    return () => clearInterval(timer)
  }, [reduced, value])

  return (
    <span aria-hidden className="ordo-count">
      {reduced ? value : shown}
    </span>
  )
}

function MissingRow({ program, item, children }: Readonly<{ program: LiturgicalProgram; item: PreparationItem; children?: ReactNode }>) {
  const action = itemAction(program, item.label)
  return (
    <li className="ordo-missing">
      <span aria-hidden className={`ordo-missing__icon is-${item.state}`}>
        {stateIcon[item.state as Exclude<PreparationState, 'done'>]}
      </span>
      <div style={{ minWidth: 0 }}>
        <Typography.Text style={{ display: 'block', fontWeight: 600, color: colors.textPrimary }}>{item.label}</Typography.Text>
        {item.note && <Typography.Text style={muted}>{item.note}</Typography.Text>}
      </div>
      <Typography.Text className={`ordo-missing__value is-${item.state}`}>{item.value}</Typography.Text>
      {action ? (
        <Link to={action.to} style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          {action.text} <ArrowRightOutlined aria-hidden />
        </Link>
      ) : (
        <span />
      )}
      {children && <div className="ordo-missing__extra">{children}</div>}
    </li>
  )
}

/** What the open program still lacks, first and largest; what is finished folds into one line. */
function Preparation({ program }: Readonly<{ program: LiturgicalProgram }>) {
  const prep = usePreparationStatus(program.id)
  if (prep.isPending) return <SectionSkeleton rows={3} label="Đang tải tình hình chuẩn bị" />

  // The celebration is a date, not a job.
  const items = preparationItems({ date: program.date, songListStatus: program.songListStatus, status: prep.data, failed: prep.isError, viewer: 'director' }).filter(
    (item) => item.label !== 'Cử hành',
  )
  if (prep.isError) {
    return (
      <Flex align="center" gap={spacing.sm} wrap style={{ padding: spacing.lg }}>
        <Typography.Text type="danger">Không thể tải tình hình chuẩn bị.</Typography.Text>
        <Button onClick={() => prep.refetch()} loading={prep.isFetching}>
          Thử lại
        </Button>
      </Flex>
    )
  }

  const missing = items.filter((item) => item.state !== 'done').sort((a, b) => stateOrder[a.state] - stateOrder[b.state])
  const done = items.filter((item) => item.state === 'done')
  const shortages = prep.data?.rosterShortages ?? []

  return (
    <div className="ordo-panel">
      <div>
        <CountIn value={missing.length} />
        {/* A live region without role="status", which would hide the heading inside it. */}
        <div aria-live="polite" aria-atomic>
          <Typography.Title level={4} style={{ margin: 0, fontSize: typography.cardHeading.fontSize }}>
            {missing.length === 0 ? 'Đã đủ mọi mục' : `Còn thiếu ${missing.length} mục`}
          </Typography.Title>
        </div>
        <Typography.Text style={muted}>Các mục được cập nhật độc lập.</Typography.Text>
      </div>
      <div style={{ minWidth: 0 }}>
        {missing.length > 0 && (
          <ul aria-label="Các mục còn thiếu" className="hm-stagger" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {missing.map((item) => (
              <MissingRow key={item.label} program={program} item={item}>
                {item.label === 'Chốt phân công' &&
                  (shortages.length > 0 ? (
                    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, margin: 0, padding: 0, listStyle: 'none' }}>
                      {shortages.map((shortage) => (
                        <li key={`${shortage.skillName}-${shortage.songTitle ?? ''}`} className="ordo-shortage">
                          <Typography.Text style={{ fontWeight: 600 }}>Thiếu {shortage.requiredCount - shortage.assignedCount}</Typography.Text>{' '}
                          <VoicePartIcon name={shortage.skillName} /> <Typography.Text>{shortage.skillName}</Typography.Text>
                          <Typography.Text style={{ ...muted, display: 'block' }}>
                            {shortage.songTitle ? `${shortage.songTitle} · ` : 'Cả buổi lễ · '}đã có {shortage.assignedCount}/{shortage.requiredCount}
                          </Typography.Text>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Typography.Text style={muted}>
                      {program.songListStatus === 'approved' ? 'Đủ người cho mọi vị trí đã khai.' : 'Nhu cầu nhân sự được tính sau khi danh sách bài hát được duyệt.'}
                    </Typography.Text>
                  ))}
              </MissingRow>
            ))}
          </ul>
        )}
        {done.length > 0 && (
          <Typography.Paragraph style={{ ...muted, margin: `${spacing.md}px 0 0` }}>
            <CheckOutlined aria-hidden style={{ marginRight: spacing.xs }} />
            Đã xong: {done.map((item) => `${item.label} (${item.value})`).join(', ')}
          </Typography.Paragraph>
        )}
      </div>
    </div>
  )
}

function OrdoRow({ program, open, onToggle }: Readonly<{ program: LiturgicalProgram; open: boolean; onToggle: () => void }>) {
  const navigate = useNavigate()
  const date = dayjs(program.date)
  const hour = massTimeOf(program.time)
  const days = date.startOf('day').diff(dayjs().startOf('day'), 'day')
  const panelId = `ordo-panel-${program.id}`
  const meta = [program.time, program.locationName].filter(Boolean).join(' · ')

  return (
    <li className={`ordo-row${open ? ' is-open' : ''}`}>
      <div className={`ordo-head${open ? ' mass-time-dark' : ''}`}>
        <h3 style={{ margin: 0, flex: 1, minWidth: 0, font: 'inherit' }}>
          <button type="button" className="ordo-toggle" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
            <span className="ordo-date">
              <span className="ordo-meta">{capitalize(date.format('dddd'))}</span>
              <span className="ordo-day">{date.format('DD')}</span>
              <span className="ordo-meta">Tháng {date.format('M')}</span>
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="ordo-name">{program.eventName}</span>
              <span className="ordo-meta" style={{ display: 'block' }}>
                {hour && <strong className="ordo-hour">{massTimeLabels[hour]} </strong>}
                {meta}
              </span>
            </span>
            <span className="ordo-status">
              {program.songListStatus ? <SongListStatusTag status={program.songListStatus} /> : <span className="ordo-meta">Chưa có danh sách bài hát</span>}
            </span>
            <span className="ordo-meta ordo-days">{days > 0 ? `Còn ${days} ngày` : 'Hôm nay'}</span>
            <DownOutlined aria-hidden className="ordo-chevron" />
          </button>
        </h3>
        {open && hour && <MassTimeMark time={hour} color={gold.soft} style={{ flexShrink: 0, alignSelf: 'flex-end' }} />}
        {open && (
          <Button ghost aria-label={`Xem chi tiết: ${program.eventName}`} onClick={() => navigate(detailPath(program))} style={{ flexShrink: 0, marginRight: spacing.lg }}>
            Xem chi tiết
          </Button>
        )}
      </div>
      <div id={panelId}>{open && <Preparation program={program} />}</div>
    </li>
  )
}

/**
 * The upcoming programs as one ruled list, like an Ordo. The nearest stands open with what it still lacks; opening
 * another closes it, so only the open program's preparation is read.
 */
export function ProgramOrdo({ programs }: Readonly<{ programs: LiturgicalProgram[] }>) {
  const [chosen, setChosen] = useState<string | null | undefined>(undefined)
  const openId = chosen === undefined ? programs[0]?.id : chosen

  return (
    <ol className="ordo">
      {programs.map((program) => (
        <OrdoRow key={program.id} program={program} open={program.id === openId} onToggle={() => setChosen(program.id === openId ? null : program.id)} />
      ))}
    </ol>
  )
}
