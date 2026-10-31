import { ArrowLeftOutlined, AudioOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Segmented, Skeleton, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { env } from '@/config/env'
import { isPlayableAudio, useSongMaterials } from '@/features/music-library'
import { colors, spacing } from '@/styles/tokens'
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
  // Opened from the schedule, the rehearsal travels in the router state; opened by its link, it is fetched.
  const fetched = useRehearsal(demoFixture || rehearsal ? undefined : rehearsalId)
  const fallbackRehearsal = demoFixture ? undefined : (rehearsal ?? fetched.data)
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
  const selectedSongId = demoFixture ? '' : (room?.songs[selectedIndex]?.id ?? '')
  const materials = useSongMaterials(selectedSongId)
  const audios = (materials.data ?? []).filter((material) => material.url && isPlayableAudio(material))
  const parts = ['Tất cả', ...new Set(audios.flatMap((material) => (material.targetSkillName ? [material.targetSkillName] : [])))]
  const shownPart = parts.includes(part) ? part : 'Tất cả'
  const partAudio =
    shownPart === 'Tất cả'
      ? (audios.find((material) => !material.targetSkillName) ?? audios[0])
      : audios.find((material) => material.targetSkillName === shownPart)
  const typedLyrics = materials.data?.find((material) => material.kind === 'lyrics' && material.lyricsText !== null)?.lyricsText

  if (fetched.isLoading) return <Skeleton active paragraph={{ rows: 12 }} />
  if (demoFixture && fixture === undefined && import.meta.env.DEV && env.useDevFixtures) return <Skeleton active paragraph={{ rows: 12 }} />
  if (!room) return (
    <div>
      <Typography.Title level={1}>Chi tiết buổi tập</Typography.Title>
      <Card title="Không tìm thấy buổi tập"><Button onClick={() => navigate(paths.director.rehearsals)}>Quay lại lịch tập</Button></Card>
    </div>
  )

  const song = room.songs[selectedIndex]
  const audioUrl = partAudio?.url ?? song.audioUrl
  const previous = () => setSelectedIndex((index) => Math.max(0, index - 1))
  const next = () => setSelectedIndex((index) => Math.min(room.songs.length - 1, index + 1))

  return (
    <div className="rehearsal-practice-room">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.director.rehearsals)} style={{ paddingInline: 0, marginBottom: spacing.sm }}>
        Lịch tập
      </Button>
      <header style={{ marginBottom: spacing.lg }}>
        <Typography.Title level={1} style={{ marginTop: 0, marginBottom: spacing.xs }}>Chi tiết buổi tập</Typography.Title>
        <Typography.Title level={3} style={{ marginBottom: spacing.xs }}>{room.title}</Typography.Title>
        <Typography.Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {dayjs(room.startAt).format('DD/MM')} · {dayjs(room.startAt).format('HH:mm')}–{dayjs(room.endAt).format('HH:mm')}
          {room.locationName ? ` · ${room.locationName}` : ''}
        </Typography.Text>
        <Flex wrap gap={spacing.md} align="center" style={{ marginTop: spacing.sm }}>
          {room.programName && <Typography.Text>Phục vụ: {room.programName}</Typography.Text>}
          <Typography.Text type="secondary">{room.songs.length} bài hát</Typography.Text>
          <Button type="primary" onClick={() => navigate(`${paths.director.attendance}?rehearsalId=${room.rehearsalId}`)}>Điểm danh</Button>
        </Flex>
      </header>

      {room.songs.length === 0 ? (
        <Card><Typography.Title level={4}>Buổi tập chưa có bài hát</Typography.Title></Card>
      ) : (
        <div className="practice-room-layout">
          <Card title="Bài hát" className="practice-song-list" styles={{ body: { padding: 0 } }}>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {room.songs.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={index === selectedIndex ? 'true' : undefined}
                    onClick={() => setSelectedIndex(index)}
                    className="practice-song-item"
                    style={{ width: '100%', border: 0, borderBottom: `1px solid ${colors.border}`, background: index === selectedIndex ? colors.primarySoft : colors.surface, textAlign: 'left', padding: spacing.md }}
                  >
                    <Flex gap={spacing.md} align="start">
                      <Typography.Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(index + 1).padStart(2, '0')}</Typography.Text>
                      <div style={{ minWidth: 0 }}>
                        <Typography.Text strong>{item.title}</Typography.Text>
                        {item.section && <Typography.Text type="secondary" style={{ display: 'block' }}>{item.section}</Typography.Text>}
                        <Typography.Text type="secondary" style={{ display: 'block' }}>{stateLabels[item.localState]}</Typography.Text>
                      </div>
                    </Flex>
                  </button>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="practice-room-player" styles={{ body: { padding: spacing.lg } }}>
            <Typography.Title level={2} style={{ marginTop: 0 }}>{song.title}</Typography.Title>
            {song.note && <Typography.Paragraph type="secondary">Cần tập: {song.note}</Typography.Paragraph>}
            <Flex wrap justify="space-between" align="center" gap={spacing.sm}>
              <Segmented value={shownPart} onChange={(value) => setPart(String(value))} options={parts} aria-label="Audio mẫu theo bè" />
              <Flex gap={4}><Button icon={<LeftOutlined />} aria-label="Bài trước" disabled={selectedIndex === 0} onClick={previous} /><Button icon={<RightOutlined />} aria-label="Bài sau" disabled={selectedIndex === room.songs.length - 1} onClick={next} /></Flex>
            </Flex>

            <div className="karaoke-lyrics" aria-live="off">
              {song.lyrics.length ? <><Typography.Title level={2}>{song.lyrics[0].text}</Typography.Title><Typography.Text type="secondary">{song.lyrics[1]?.text}</Typography.Text></> : typedLyrics ? <Typography.Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>{typedLyrics}</Typography.Paragraph> : <Typography.Text type="secondary">Bài hát chưa có lời dạng văn bản</Typography.Text>}
            </div>

            {!audioUrl ? (
              <Card size="small" style={{ background: colors.softSurface }}><Flex gap={spacing.sm} align="center"><AudioOutlined /><Typography.Text type="secondary">Chưa có audio mẫu cho bài hát này</Typography.Text></Flex></Card>
            ) : <audio key={audioUrl} controls src={audioUrl} aria-label={`Nghe ${song.title}${shownPart === 'Tất cả' ? '' : `, bè ${shownPart}`}`} style={{ width: '100%' }} />}

            <Flex wrap gap={spacing.sm} style={{ marginTop: spacing.md }}>
              <Button disabled icon={<AudioOutlined />}>Thu âm</Button>
              <Button disabled>Lặp đoạn</Button>
              <Tag>1x</Tag>
              <Typography.Text type="secondary">Thu âm tạm thời chưa có hỗ trợ API</Typography.Text>
            </Flex>
          </Card>
        </div>
      )}

      {room.note && <Card title="Ghi chú buổi tập" style={{ marginTop: spacing.md }}><Typography.Paragraph style={{ marginBottom: 0 }}>{room.note}</Typography.Paragraph></Card>}
    </div>
  )
}
