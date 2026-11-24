import { Button, Flex, Segmented, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { generatePath, Link, useLocation, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { isMidiFile, isPlayableAudio, supportsTimedLyrics, useSongMaterials } from '@/features/music-library'
import { ApiError } from '@/lib/api/errors'
import {
  EmptySongbook,
  EmptyState,
  ErrorState,
  Icon,
  LostLeaf,
  PageHeader,
  PageSkeleton,
  PRACTICE_ROOM_TITLE,
  SectionSkeleton,
  SELECT_POPUP_PROPS,
  ViewDrawer,
  VoicePartIcon,
  voicePartName,
} from '@/shared/ui'
import { component, spacing } from '@/styles/tokens'
import { JointChip, PlannerOnly } from '../components/JointRehearsal'
import { RecordingPanel } from '../components/RecordingPanel'
import { MidiPracticePlayer } from '../components/MidiPracticePlayer'
import { ScorePracticeSection, type PracticePlayer } from '../components/ScorePracticeSection'
import { TimedAudioPlayer } from '../components/TimedAudioPlayer'
import { usePracticeRoom } from '../hooks/usePracticeRoom'
import { useCachedRehearsal, useRehearsal } from '../hooks/useRehearsals'
import { createPracticeScoreCache } from '../score/cache/practiceScoreCache'
import type { Rehearsal } from '../types'

// The PDF library is large and only a song with a PDF score needs it; the rehearsal schedule shares this chunk.
const PracticeScoreViewer = lazy(async () => ({ default: (await import('../components/PracticeScoreViewer')).PracticeScoreViewer }))

const ALL_PARTS = 'Tất cả'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: <Link to={paths.director.rehearsals}>Lịch tập</Link> }, { title: PRACTICE_ROOM_TITLE }]

export function RehearsalPracticeRoomPage() {
  const { rehearsalId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const cached = useCachedRehearsal(rehearsalId)
  const known = (location.state as { rehearsal?: Rehearsal } | null)?.rehearsal ?? cached
  // Always read again by id: the router state survives a reload, so it only shows the session until the answer
  // arrives, and stays when the detail endpoint hides it (a rehearsal of a draft or cancelled event answers 404).
  const fetched = useRehearsal(rehearsalId)
  // GET /api/schedule/rehearsals/{id} (MemberRehearsalDetailDto) has no program or choir; the list the director came
  // from (RehearsalDto) has them, so they are kept from it.
  const knownEventId = known?.eventId
  const knownChoirId = known?.choirId
  const merged = useMemo<Rehearsal | undefined>(
    () =>
      fetched.data
        ? { ...fetched.data, eventId: fetched.data.eventId ?? knownEventId, choirId: fetched.data.choirId ?? knownChoirId }
        : undefined,
    [fetched.data, knownEventId, knownChoirId],
  )
  const room = usePracticeRoom(merged ?? known)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [part, setPart] = useState(ALL_PARTS)
  const [showLyrics, setShowLyrics] = useState(false)
  const [documentsOpen, setDocumentsOpen] = useState(false)
  const [recordingOpen, setRecordingOpen] = useState(false)
  const [player, setPlayer] = useState<PracticePlayer>('loading')
  const [scoreCache] = useState(createPracticeScoreCache)
  useEffect(() => {
    // React StrictMode replays effects without recreating state: reopen after its simulated cleanup, close on real leave.
    scoreCache.open()
    return () => scoreCache.close()
  }, [scoreCache])
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
  const parts = [ALL_PARTS, ...new Set(practiceMaterials.flatMap((material) => (material.targetSkillName ? [material.targetSkillName] : [])))]
  const shownPart = parts.includes(part) ? part : ALL_PARTS
  const partAudio =
    shownPart === ALL_PARTS
      ? (audios.find((material) => !material.targetSkillName) ?? audios[0])
      : (audios.find((material) => material.targetSkillName === shownPart) ??
        audios.find((material) => !material.targetSkillName))
  const partMidi =
    shownPart === ALL_PARTS
      ? (midis.find((material) => !material.targetSkillName) ?? midis[0])
      : (midis.find((material) => material.targetSkillName === shownPart) ??
        midis.find((material) => !material.targetSkillName))
  const partScore =
    shownPart === ALL_PARTS
      ? (scores.find((material) => !material.targetSkillName) ?? scores[0])
      : (scores.find((material) => material.targetSkillName === shownPart) ??
        scores.find((material) => !material.targetSkillName))
  const partInteractiveScore =
    shownPart === ALL_PARTS
      ? (interactiveScores.find((material) => !material.targetSkillName) ?? interactiveScores[0])
      : (interactiveScores.find((material) => material.targetSkillName === shownPart) ??
        interactiveScores.find((material) => !material.targetSkillName))
  const typedLyrics = materials.data?.find((material) => material.kind === 'lyrics' && material.lyricsText !== null)?.lyricsText

  if (fetched.isLoading && !known) return <PageSkeleton sections={2} rows={6} />
  if (!room) {
    // 404 REHEARSAL_NOT_FOUND: deleted, or not of the director's choirs. Anything else (network, 500) can be retried.
    const failed = fetched.isError && !(fetched.error instanceof ApiError && fetched.error.status === 404)
    return (
      <div className="rehearsal-practice-room">
        <PageHeader title={PRACTICE_ROOM_TITLE} breadcrumb={breadcrumb} />
        {failed ? (
          <ErrorState title="Không thể tải buổi tập" error={fetched.error} hasData={false} onRetry={() => fetched.refetch()} retrying={fetched.isFetching} />
        ) : (
          <EmptyState
            icon={<LostLeaf />}
            title="Không tìm thấy buổi tập"
            description="Buổi tập có thể đã bị xoá, hoặc không thuộc ca đoàn bạn phụ trách."
            action={<Button type="primary" onClick={() => navigate(paths.director.rehearsals)}>Quay lại lịch tập</Button>}
          />
        )}
      </div>
    )
  }

  // Undefined while the rehearsal has no songs; the page then shows "Buổi tập chưa có bài hát" instead of the player.
  const song = room.songs[current]
  const chooseIndex = (index: number) => {
    if (index < 0 || index >= room.songs.length) return
    setSelectedIndex(index)
    setPart(ALL_PARTS)
    setShowLyrics(false)
    setDocumentsOpen(false)
    setRecordingOpen(false)
  }
  const chooseSong = (songId: string) => chooseIndex(room.songs.findIndex((item) => item.id === songId))
  // Stable across renders, so a player can ask for it from an effect.
  const refreshMaterials = materials.refetch
  let materialContent: ReactNode = null
  let modeLabel = ''
  if (song) {
    // A part without its own audio plays the general one, named as the song only.
    const audioLabel = shownPart !== ALL_PARTS && partAudio?.targetSkillName === shownPart ? `${song.title}, bè ${shownPart}` : song.title
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
          <div style={{ marginTop: spacing.lg }}>
            <EmptyState
              headingLevel={3}
              icon={<Icon name="audio" size={32} />}
              title="Chưa có audio mẫu hoặc MIDI"
              description="Tải audio mẫu hoặc tệp MIDI cho bài hát này ở trang chi tiết bài hát để ca đoàn có bản nghe khi tập."
              action={
                <Button onClick={() => navigate(generatePath(paths.director.songDetail, { songId: song.id }))}>Mở chi tiết bài hát</Button>
              }
            />
          </div>
        )}
      </>
    )

    if (selectedSongId && materials.isPending) {
      materialContent = (
        <div style={{ marginTop: spacing.lg }}>
          <SectionSkeleton rows={6} label="Đang tải tài liệu tập" />
        </div>
      )
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
    // What the room plays now, as ScorePracticeSection reports it: the score, or the fallback when there is none or it failed.
    if (player === 'loading') modeLabel = 'Đang mở bản nhạc'
    else if (player === 'score') modeLabel = 'Bản nhạc tương tác'
    else if (partMidi) modeLabel = 'Bản nốt MIDI'
    else if (partAudio) modeLabel = 'Audio mẫu'
    else if (!materials.isPending && !materials.isError) modeLabel = 'Chưa có audio mẫu'
  }

  const attendanceParams = new URLSearchParams({ rehearsalId: room.rehearsalId })
  if (room.eventId) attendanceParams.set('programId', room.eventId)
  const attendanceQuery = `?${attendanceParams.toString()}`
  const description = (
    <span className="practice-room-meta">
      {room.isJoint ? <JointChip rehearsal={room} /> : <span>Buổi tập</span>}
      {[
        `${dayjs(room.startAt).format('DD/MM')} · ${dayjs(room.startAt).format('HH:mm')}–${dayjs(room.endAt).format('HH:mm')}`,
        room.locationName,
        `${room.songs.length} bài hát`,
      ]
        .filter(Boolean)
        .map((item) => (
          <span key={item}>{item}</span>
        ))}
      {room.note && <span className="practice-room-meta-note">Ghi chú: {room.note}</span>}
    </span>
  )

  return (
    <div className="rehearsal-practice-room">
      <PageHeader
        title={song?.title ?? room.title}
        breadcrumb={breadcrumb}
        description={description}
        extra={
          <Flex wrap align="center" gap={spacing.md}>
            {room.eventId && (
              <Link to={generatePath(paths.director.programDetail, { programId: room.eventId })} className="practice-room-song-link">
                <Icon name="program" /> Xem chương trình
              </Link>
            )}
            {/* A joint rehearsal's attendance belongs to the lead choir's director (CheckCanManageRehearsalAsync). */}
            <PlannerOnly rehearsal={room}>
              <Button type="primary" icon={<Icon name="attendance" />} onClick={() => navigate(`${paths.director.attendance}${attendanceQuery}`)}>
                Điểm danh
              </Button>
            </PlannerOnly>
          </Flex>
        }
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
            <Flex wrap justify="space-between" align="end" gap={spacing.md} className="practice-room-controls">
              <Flex wrap align="end" gap={spacing.md} style={{ flex: 1, minWidth: 0 }}>
                <div className="practice-room-field">
                  <Typography.Text type="secondary">Bài hát</Typography.Text>
                  <Flex align="center" gap={spacing.xs} style={{ minWidth: 0 }}>
                    <Button icon={<Icon name="chevron-left" />} aria-label="Bài hát trước" disabled={current <= 0} onClick={() => chooseIndex(current - 1)} />
                    <Select
                      {...SELECT_POPUP_PROPS}
                      aria-label="Bài hát đang tập"
                      className="practice-room-song-select"
                      value={song.id}
                      onChange={chooseSong}
                      options={room.songs.map((item, index) => ({ value: item.id, label: `${index + 1}. ${item.title}` }))}
                    />
                    <Button
                      icon={<Icon name="chevron-right" />}
                      aria-label="Bài hát sau"
                      disabled={current >= room.songs.length - 1}
                      onClick={() => chooseIndex(current + 1)}
                    />
                    <Link to={generatePath(paths.director.songDetail, { songId: song.id })} className="practice-room-song-link">
                      <Icon name="song" /> Chi tiết bài hát
                    </Link>
                  </Flex>
                </div>
                <div className="practice-room-field">
                  <Typography.Text type="secondary">Bè</Typography.Text>
                  <Segmented
                    className="practice-room-parts"
                    value={shownPart}
                    onChange={(value) => setPart(String(value))}
                    options={parts.map((name) => ({ value: name, label: voicePartName(name), icon: <VoicePartIcon name={name} /> }))}
                    aria-label="Bản tập theo bè"
                  />
                </div>
              </Flex>
              <Flex wrap gap={spacing.sm}>
                <Button icon={<Icon name="lyrics" />} onClick={() => setShowLyrics((value) => !value)} aria-pressed={showLyrics}>
                  {showLyrics ? 'Ẩn lời' : 'Hiện lời'}
                </Button>
                <Button icon={<Icon name="sheet-music" />} onClick={() => setDocumentsOpen(true)} disabled={!partScore}>
                  Tài liệu
                </Button>
                {/* Every serving choir's director listens to the takes; RecordingPanel keeps recording and deleting
                    to the lead choir's director on a joint rehearsal (RehearsalRecordingService.cs:42, :89, :104-109). */}
                <Button icon={<Icon name="audio" />} onClick={() => setRecordingOpen(true)}>
                  Ghi âm
                </Button>
              </Flex>
            </Flex>

            <div className="practice-room-status-bar">
              {modeLabel && <span className="practice-room-status-item">{modeLabel}</span>}
              <span className="practice-room-status-item">
                <VoicePartIcon name={shownPart} /> Bè: {voicePartName(shownPart)}
              </span>
              {song.note && <span className="practice-room-status-item">Cần tập: {song.note}</span>}
            </div>

            <ScorePracticeSection
              key={song.id}
              title={song.title}
              fallback={materialContent}
              material={partInteractiveScore}
              cache={scoreCache}
              cacheScope={song.id}
              showLyrics={showLyrics}
              onStale={refreshMaterials}
              onPlayerChange={setPlayer}
            />
          </section>

          <ViewDrawer title="Tài liệu" open={documentsOpen} onClose={() => setDocumentsOpen(false)} size={component.drawer.lg} destroyOnHidden>
            <Typography.Text type="secondary" className="practice-room-drawer-context">{song.title}</Typography.Text>
            {partScore && (
              <Suspense fallback={<SectionSkeleton rows={6} label="Đang mở bản nhạc" />}>
                <PracticeScoreViewer
                  key={partScore.id}
                  material={partScore}
                  songTitle={song.title}
                  refreshing={materials.isFetching}
                  onRefresh={async () => { await materials.refetch() }}
                />
              </Suspense>
            )}
          </ViewDrawer>

          <ViewDrawer title="Ghi âm" open={recordingOpen} onClose={() => setRecordingOpen(false)} size={component.drawer.md} destroyOnHidden>
            <Typography.Text type="secondary" className="practice-room-drawer-context">{song.title}</Typography.Text>
            <RecordingPanel rehearsalId={room.rehearsalId} songId={song.id} songTitle={song.title} rehearsal={room} />
          </ViewDrawer>
        </div>
      )}
    </div>
  )
}
