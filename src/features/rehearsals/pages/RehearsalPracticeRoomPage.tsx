import { AudioOutlined, FileTextOutlined, SoundOutlined } from '@ant-design/icons'
import { Button, Card, Drawer, Flex, Segmented, Select, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { isMidiFile, isPlayableAudio, supportsTimedLyrics, useSongMaterials } from '@/features/music-library'
import { ApiError } from '@/lib/api/errors'
import { EmptySongbook, EmptyState, ErrorState, PageHeader } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { RecordingPanel } from '../components/RecordingPanel'
import { MidiPracticePlayer } from '../components/MidiPracticePlayer'
import { ScorePracticeSection } from '../components/ScorePracticeSection'
import { TimedAudioPlayer } from '../components/TimedAudioPlayer'
import { usePracticeRoom } from '../hooks/usePracticeRoom'

// The PDF library is large and only a song with a PDF score needs it; the rehearsal schedule shares this chunk.
const PracticeScoreViewer = lazy(async () => ({ default: (await import('../components/PracticeScoreViewer')).PracticeScoreViewer }))
import { useRehearsal } from '../hooks/useRehearsals'
import type { Rehearsal } from '../types'

export function RehearsalPracticeRoomPage() {
  const { rehearsalId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const rehearsal = (location.state as { rehearsal?: Rehearsal } | null)?.rehearsal
  // Always read again by id: the router state survives a reload, so it only shows the session until the answer
  // arrives, and stays when the detail endpoint hides it (a rehearsal of a draft or cancelled event answers 404).
  const fetched = useRehearsal(rehearsalId)
  const room = usePracticeRoom(fetched.data ?? rehearsal)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [part, setPart] = useState('Tất cả')
  const [showLyrics, setShowLyrics] = useState(false)
  const [documentsOpen, setDocumentsOpen] = useState(false)
  const [recordingOpen, setRecordingOpen] = useState(false)
  // Sample audio per voice part and typed lyrics come from the song's materials (GET /api/music-materials).
  // A list read again may be shorter than the one the selection was made in.
  const current = Math.min(selectedIndex, Math.max(0, (room?.songs.length ?? 0) - 1))
  const selectedSongId = room?.songs[current]?.id ?? ''
  const materials = useSongMaterials(selectedSongId)
  const audios = (materials.data ?? []).filter((material) => material.url && isPlayableAudio(material))
  const midis = (materials.data ?? []).filter((material) => isMidiFile(material.fileName))
  const scores = (materials.data ?? []).filter((material) => material.kind === 'sheetMusic' && material.url && material.fileName)
  const interactiveScores = (materials.data ?? []).filter((material) => material.kind === 'interactiveScore' && material.url)
  const practiceMaterials = [...midis, ...audios, ...scores, ...interactiveScores]
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
  const partInteractiveScore =
    shownPart === 'Tất cả'
      ? (interactiveScores.find((material) => !material.targetSkillName) ?? interactiveScores[0])
      : (interactiveScores.find((material) => material.targetSkillName === shownPart) ??
        interactiveScores.find((material) => !material.targetSkillName))
  const typedLyrics = materials.data?.find((material) => material.kind === 'lyrics' && material.lyricsText !== null)?.lyricsText

  if (fetched.isLoading && !rehearsal) return <Skeleton active paragraph={{ rows: 12 }} />
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
  const chooseSong = (songId: string) => {
    const index = room.songs.findIndex((item) => item.id === songId)
    if (index < 0) return
    setSelectedIndex(index)
    setPart('Tất cả')
    setShowLyrics(false)
    setDocumentsOpen(false)
    setRecordingOpen(false)
  }
  // Stable across renders, so a player can ask for it from an effect.
  const refreshMaterials = materials.refetch
  let materialContent: ReactNode = null
  if (song) {
    const audioLabel = shownPart === 'Tất cả' ? song.title : `${song.title}, bè ${shownPart}`
    const lyricsContent = typedLyrics ? (
      <Typography.Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>{typedLyrics}</Typography.Paragraph>
    ) : (
      <Typography.Text type="secondary">Bài hát chưa có lời dạng văn bản</Typography.Text>
    )

    const legacyContent = (
      <>
        {showLyrics && !partAudio && <div className="karaoke-lyrics" aria-live="off">{lyricsContent}</div>}
        {partAudio ? (
          <TimedAudioPlayer
            key={`${partAudio.id}:${partAudio.fileRevision}`}
            material={partAudio}
            title={audioLabel}
            untimedLyrics={lyricsContent}
            showLyrics={showLyrics}
            onStale={refreshMaterials}
          />
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
          <MidiPracticePlayer
            materialId={partMidi.id}
            title={song.title}
            timedMaterial={supportsTimedLyrics(partMidi) ? partMidi : undefined}
            showLyrics={showLyrics}
            onStale={refreshMaterials}
          />
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
          `${room.songs.length} bài hát`,
        ]
          .filter(Boolean)
          .join(' · ')}
        extra={<Button type="primary" onClick={() => navigate(`${paths.director.attendance}?rehearsalId=${room.rehearsalId}`)}>Điểm danh</Button>}
      />

      {room.songs.length === 0 ? (
        <EmptyState
          icon={<EmptySongbook />}
          title="Buổi tập chưa có bài hát"
          description={room.note ? `Ghi chú buổi tập: ${room.note}` : 'Thêm bài hát cho buổi tập ở trang Lịch tập.'}
          action={<Button onClick={() => navigate(paths.director.rehearsals)}>Quay lại lịch tập</Button>}
        />
      ) : (
        <div className="practice-room-layout">
          <section className="hm-sheet-section practice-room-player" aria-label={`Đang tập: ${song.title}`}>
            <Typography.Title level={2} style={{ margin: 0, fontFamily: typography.displayFontFamily, fontSize: 32, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'lining-nums' }}>{song.title}</Typography.Title>
            {song.note && <Typography.Paragraph type="secondary" style={{ margin: `${spacing.xs}px 0 0` }}>Cần tập: {song.note}</Typography.Paragraph>}
            <Flex wrap justify="space-between" align="end" gap={spacing.md} className="practice-room-controls">
              <Flex wrap align="end" gap={spacing.md} style={{ flex: 1, minWidth: 0 }}>
                <label className="practice-room-field">
                  <Typography.Text type="secondary">Bài hát</Typography.Text>
                  <Select
                    aria-label="Bài hát đang tập"
                    value={song.id}
                    onChange={chooseSong}
                    options={room.songs.map((item, index) => ({ value: item.id, label: `${index + 1}. ${item.title}` }))}
                  />
                </label>
                <label className="practice-room-field">
                  <Typography.Text type="secondary">Bè</Typography.Text>
                  <Segmented value={shownPart} onChange={(value) => setPart(String(value))} options={parts} aria-label="Bản tập theo bè" />
                </label>
              </Flex>
              <Flex wrap gap={spacing.sm}>
                <Button onClick={() => setShowLyrics((value) => !value)} aria-pressed={showLyrics}>
                  {showLyrics ? 'Ẩn lời' : 'Hiện lời'}
                </Button>
                <Button icon={<FileTextOutlined aria-hidden />} onClick={() => setDocumentsOpen(true)} disabled={!partScore}>Tài liệu</Button>
                <Button icon={<SoundOutlined aria-hidden />} onClick={() => setRecordingOpen(true)}>Ghi âm</Button>
              </Flex>
            </Flex>

            <ScorePracticeSection key={song.id} title={song.title} fallback={materialContent} material={partInteractiveScore} showLyrics={showLyrics} onStale={refreshMaterials} />
          </section>

          <Drawer title={`Tài liệu · ${song.title}`} open={documentsOpen} onClose={() => setDocumentsOpen(false)} size="large" destroyOnHidden>
            {partScore && (
              <Suspense fallback={<Skeleton active title={false} paragraph={{ rows: 6 }} />}>
                <PracticeScoreViewer
                  key={partScore.id}
                  material={partScore}
                  songTitle={song.title}
                  refreshing={materials.isFetching}
                  onRefresh={async () => { await materials.refetch() }}
                />
              </Suspense>
            )}
          </Drawer>

          <Drawer title={`Ghi âm · ${song.title}`} open={recordingOpen} onClose={() => setRecordingOpen(false)} size="large" destroyOnHidden>
            <RecordingPanel rehearsalId={room.rehearsalId} songId={song.id} songTitle={song.title} />
          </Drawer>
        </div>
      )}
    </div>
  )
}
