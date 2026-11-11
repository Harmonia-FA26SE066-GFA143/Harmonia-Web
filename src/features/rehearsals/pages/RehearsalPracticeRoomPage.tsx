import { AudioOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Segmented, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { env } from '@/config/env'
import { isMidiFile, isPlayableAudio, useSongMaterials } from '@/features/music-library'
import { ApiError } from '@/lib/api/errors'
import { ErrorState, PageHeader } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { RecordingPanel } from '../components/RecordingPanel'
import { MidiPracticePlayer } from '../components/MidiPracticePlayer'
import { PracticeScoreViewer } from '../components/PracticeScoreViewer'
import { ScorePracticeSection } from '../components/ScorePracticeSection'
import type { PracticeRoomView } from '../practiceRoomTypes'
import { usePracticeRoom } from '../hooks/usePracticeRoom'
import { useRehearsal } from '../hooks/useRehearsals'
import type { Rehearsal } from '../types'

const stateLabels = { notStarted: 'Chưa bắt đầu', inProgress: 'Đang luyện', listened: 'Đã nghe' } as const

export function RehearsalPracticeRoomPage() {
  const { rehearsalId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const rehearsal = (location.state as { rehearsal?: Rehearsal } | null)?.rehearsal
  const demoFixture = rehearsalId === 'rehearsal-demo-1' || rehearsalId === 'demo'
  // Always read again by id: the router state survives a reload, so it only shows the session until the answer
  // arrives, and stays when the detail endpoint hides it (a rehearsal of a draft or cancelled event answers 404).
  const fetched = useRehearsal(demoFixture ? undefined : rehearsalId)
  const fallbackRehearsal = demoFixture ? undefined : (fetched.data ?? rehearsal)
  const [fixture, setFixture] = useState<PracticeRoomView>()

  useEffect(() => {
    if (import.meta.env.DEV && env.useDevFixtures && demoFixture) void import('../api/fixtures.dev').then((module) => setFixture(module.rehearsalPracticeFixture))
  }, [demoFixture])

  const roomSource = useMemo(() => fallbackRehearsal ?? (demoFixture && fixture ? {
    id: fixture.rehearsalId,
    startAt: fixture.startAt,
    endAt: fixture.endAt,
    locationName: fixture.locationName,
    eventId: undefined,
    note: fixture.note,
    songs: fixture.songs.map((song) => ({ songId: song.id, songTitle: song.title })),
  } satisfies Rehearsal : undefined), [demoFixture, fallbackRehearsal, fixture])
  const room = usePracticeRoom(roomSource, fixture)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [part, setPart] = useState('Tất cả')
  // Sample audio per voice part and typed lyrics come from the song's materials (GET /api/music-materials).
  // A list read again may be shorter than the one the selection was made in.
  const current = Math.min(selectedIndex, Math.max(0, (room?.songs.length ?? 0) - 1))
  const selectedSongId = demoFixture ? '' : (room?.songs[current]?.id ?? '')
  const materials = useSongMaterials(selectedSongId)
  const audios = (materials.data ?? []).filter((material) => material.url && isPlayableAudio(material))
  const midis = (materials.data ?? []).filter((material) => isMidiFile(material.fileName))
  const scores = (materials.data ?? []).filter((material) => material.kind === 'sheetMusic' && material.url && material.fileName)
  const practiceMaterials = [...midis, ...audios, ...scores]
  const parts = ['Tất cả', ...new Set(practiceMaterials.flatMap((material) => (material.targetSkillName ? [material.targetSkillName] : [])))]
  const shownPart = parts.includes(part) ? part : 'Tất cả'
  const partAudio =
    shownPart === 'Tất cả'
      ? (audios.find((material) => !material.targetSkillName) ?? audios[0])
      : audios.find((material) => material.targetSkillName === shownPart)
  const partMidi =
    shownPart === 'Tất cả'
      ? (midis.find((material) => !material.targetSkillName) ?? midis[0])
      : (midis.find((material) => material.targetSkillName === shownPart) ??
        midis.find((material) => !material.targetSkillName))
  const partScore =
    shownPart === 'Tất cả'
      ? (scores.find((material) => !material.targetSkillName) ?? scores[0])
      : (scores.find((material) => material.targetSkillName === shownPart) ??
        scores.find((material) => !material.targetSkillName))
  const typedLyrics = materials.data?.find((material) => material.kind === 'lyrics' && material.lyricsText !== null)?.lyricsText

  if (fetched.isLoading && !rehearsal) return <Skeleton active paragraph={{ rows: 12 }} />
  if (demoFixture && fixture === undefined && import.meta.env.DEV && env.useDevFixtures) return <Skeleton active paragraph={{ rows: 12 }} />
  if (!room) {
    // 404 REHEARSAL_NOT_FOUND: deleted, or not of the director's choirs. Anything else (network, 500) can be retried.
    const failed = fetched.isError && !(fetched.error instanceof ApiError && fetched.error.status === 404)
    return (
      <div>
        <Typography.Title level={1}>Chi tiết buổi tập</Typography.Title>
        {failed ? (
          <ErrorState title="Không thể tải buổi tập" error={fetched.error} hasData={false} onRetry={() => fetched.refetch()} retrying={fetched.isFetching} />
        ) : (
          <Card title="Không tìm thấy buổi tập"><Button onClick={() => navigate(paths.director.rehearsals)}>Quay lại lịch tập</Button></Card>
        )}
      </div>
    )
  }

  // Undefined while the rehearsal has no songs; the page then shows "Buổi tập chưa có bài hát" instead of the player.
  const song = room.songs[current]
  const audioUrl = partAudio?.url ?? song?.audioUrl
  const previous = () => setSelectedIndex(Math.max(0, current - 1))
  const next = () => setSelectedIndex(Math.min(room.songs.length - 1, current + 1))
  let materialContent: ReactNode = null
  if (song) {
    const audioLabel = shownPart === 'Tất cả' ? `Nghe ${song.title}` : `Nghe ${song.title}, bè ${shownPart}`
    let lyricsContent: ReactNode
    if (song.lyrics.length) {
      lyricsContent = (
        <>
          <Typography.Title level={2}>{song.lyrics[0].text}</Typography.Title>
          <Typography.Text type="secondary">{song.lyrics[1]?.text}</Typography.Text>
        </>
      )
    } else if (typedLyrics) {
      lyricsContent = <Typography.Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>{typedLyrics}</Typography.Paragraph>
    } else {
      lyricsContent = <Typography.Text type="secondary">Bài hát chưa có lời dạng văn bản</Typography.Text>
    }

    const legacyContent = (
      <>
        <div className="karaoke-lyrics" aria-live="off">{lyricsContent}</div>
        {audioUrl ? (
          <audio key={audioUrl} controls src={audioUrl} aria-label={audioLabel} style={{ width: '100%' }} />
        ) : (
          <Card size="small" style={{ background: colors.softSurface }}>
            <Flex gap={spacing.sm} align="center">
              <AudioOutlined />
              <Typography.Text type="secondary">Chưa có audio mẫu hoặc MIDI cho bài hát này</Typography.Text>
            </Flex>
          </Card>
        )}
      </>
    )

    if (selectedSongId && materials.isPending) {
      materialContent = <Skeleton active paragraph={{ rows: 8 }} style={{ marginTop: spacing.lg }} />
    } else if (selectedSongId && materials.isError) {
      materialContent = (
        <div style={{ marginTop: spacing.lg }}>
          <ErrorState
            headingLevel={3}
            title="Không thể tải tài liệu tập"
            error={materials.error}
            onRetry={() => materials.refetch()}
            retrying={materials.isFetching}
          />
        </div>
      )
    } else if (partMidi) {
      materialContent = (
        <div style={{ marginTop: spacing.lg }}>
          <MidiPracticePlayer materialId={partMidi.id} title={song.title} />
        </div>
      )
    } else {
      materialContent = legacyContent
    }
  }

  return (
    <div className="rehearsal-practice-room">
      <PageHeader
        title={room.title}
        breadcrumb={[{ title: 'Ca trưởng' }, { title: <Link to={paths.director.rehearsals}>Lịch tập</Link> }, { title: 'Phòng tập' }]}
        description={[
          `${dayjs(room.startAt).format('DD/MM')} · ${dayjs(room.startAt).format('HH:mm')}–${dayjs(room.endAt).format('HH:mm')}`,
          room.locationName,
          room.programName && `Phục vụ: ${room.programName}`,
          `${room.songs.length} bài hát`,
        ]
          .filter(Boolean)
          .join(' · ')}
        extra={<Button type="primary" onClick={() => navigate(`${paths.director.attendance}?rehearsalId=${room.rehearsalId}`)}>Điểm danh</Button>}
      />

      {room.songs.length === 0 ? (
        <Card><Typography.Title level={4}>Buổi tập chưa có bài hát</Typography.Title></Card>
      ) : (
        <div className="practice-room-layout">
          <Card title="Bài hát" className="practice-song-list" styles={{ body: { padding: 0 } }}>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {room.songs.map((item, index) => (
                <li key={item.id}>
                  <button type="button" aria-current={index === current ? 'true' : undefined} onClick={() => setSelectedIndex(index)} className="practice-song-item">
                    <span aria-hidden className="practice-song-item__number">{index + 1}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="practice-song-item__title">{item.title}</span>
                      {item.section && <span className="practice-song-item__meta">{item.section}</span>}
                      <span className="practice-song-item__meta">{stateLabels[item.localState]}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="practice-room-player" styles={{ body: { padding: spacing.lg } }}>
            <Typography.Title level={2} style={{ margin: 0, fontFamily: typography.displayFontFamily, fontSize: 32, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'lining-nums' }}>{song.title}</Typography.Title>
            {song.note && <Typography.Paragraph type="secondary" style={{ margin: `${spacing.xs}px 0 0` }}>Cần tập: {song.note}</Typography.Paragraph>}
            <Flex wrap justify="space-between" align="center" gap={spacing.sm} style={{ marginTop: spacing.md }}>
              <Segmented value={shownPart} onChange={(value) => setPart(String(value))} options={parts} aria-label="Bản tập theo bè" />
              <Flex gap={4}><Button icon={<LeftOutlined />} aria-label="Bài trước" disabled={current === 0} onClick={previous} /><Button icon={<RightOutlined />} aria-label="Bài sau" disabled={current === room.songs.length - 1} onClick={next} /></Flex>
            </Flex>

            <ScorePracticeSection key={song.id} title={song.title} fallback={materialContent} />

            {partScore && (
              <PracticeScoreViewer
                key={partScore.id}
                material={partScore}
                songTitle={song.title}
                refreshing={materials.isFetching}
                onRefresh={async () => { await materials.refetch() }}
              />
            )}

            {/* The demo room has no rehearsal on the server, so nothing can be recorded there. */}
            <RecordingPanel rehearsalId={demoFixture ? undefined : room.rehearsalId} songId={song.id} songTitle={song.title} />
          </Card>
        </div>
      )}

      {room.note && <Card title="Ghi chú buổi tập" style={{ marginTop: spacing.md }}><Typography.Paragraph style={{ marginBottom: 0 }}>{room.note}</Typography.Paragraph></Card>}
    </div>
  )
}
