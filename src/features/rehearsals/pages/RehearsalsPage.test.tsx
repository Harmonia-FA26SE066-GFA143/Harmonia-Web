import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import type { MaterialPlaybackBundle, SongMaterial } from '@/features/music-library'
import * as songsApi from '@/features/music-library/api/songsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { programPage } from '@/test/programs'
import * as rehearsalsApi from '../api/rehearsalsApi'
import type { Rehearsal } from '../types'
import { RehearsalPracticeRoomPage } from './RehearsalPracticeRoomPage'
import { RehearsalsPage } from './RehearsalsPage'

const at = (days: number, hour: number) => dayjs().add(days, 'day').hour(hour).minute(0).second(0).millisecond(0).toISOString()

// Newest first, as the backend lists them.
const rehearsals: Rehearsal[] = [
  { id: 'r3', eventId: 'p1', startAt: at(5, 18), endAt: at(5, 20), locationName: 'Nhà thờ', note: 'Chuẩn bị phục vụ', songs: [] },
  {
    id: 'r2',
    eventId: 'p2',
    locationId: 'loc-2',
    locationName: 'Phòng tập nhà xứ',
    startAt: at(2, 19),
    endAt: at(2, 21),
    songs: [{ songId: 's1', songTitle: 'Con Bước Lên Bàn Thờ' }],
  },
  { id: 'r1', eventId: 'old', startAt: at(-3, 19), endAt: at(-3, 21), note: 'Tập toàn ca đoàn', songs: [] },
]

const page = (items: Rehearsal[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })

const renderRehearsals = (initialEntry = '/director/rehearsals?view=list') =>
  renderPage(<RehearsalsPage />, '/director/rehearsals', initialEntry.includes('?view=') ? initialEntry : `${initialEntry}${initialEntry.includes('?') ? '&' : '?'}view=list`)

beforeEach(() => {
  vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([])
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(
    programPage(
      { id: 'p1', eventName: 'Lễ Chúa Nhật', date: '2026-10-04' },
      { id: 'p2', eventName: 'Lễ Bổn mạng', date: '2026-10-11' },
    ),
  )
  vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([
    { id: 'loc-1', name: 'Nhà thờ' },
    { id: 'loc-2', name: 'Phòng tập nhà xứ' },
  ])
  vi.spyOn(songsApi, 'listSongs').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 50, totalCount: 0, totalPages: 0 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RehearsalsPage', () => {
  it('shows a recoverable error when the schedule cannot be loaded', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockRejectedValue(new ApiError(403, undefined))
    renderRehearsals()

    expect(await screen.findByRole('heading', { name: 'Không thể tải lịch tập' })).toBeInTheDocument()
  })

  it('shows the empty state with a create action', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(page([]))
    renderRehearsals()

    expect(await screen.findByRole('heading', { name: 'Chưa có buổi tập nào' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Lên lịch buổi tập/ }).length).toBeGreaterThan(0)
  })

  it('keeps the empty week visible and creates no repeated day empty states', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(page([]))
    renderRehearsals('/director/rehearsals?view=week')

    expect(await screen.findByText('Tuần này chưa có buổi tập nào.')).toBeInTheDocument()
    const week = screen.getByRole('list', { name: 'Lịch tập theo tuần' })
    expect(within(week).getAllByRole('listitem')).toHaveLength(7)
    expect(screen.getAllByLabelText('Không có buổi tập')).toHaveLength(7)
    // One action under the sentence besides the header's.
    expect(screen.getAllByRole('button', { name: /Lên lịch buổi tập/ })).toHaveLength(2)
    expect(screen.queryByText('Không tìm thấy buổi tập phù hợp.')).toBeNull()
  })

  it('lays the week out as a timeline: sessions of one day by start time, each with its state, program and actions', async () => {
    const monday = dayjs().subtract((dayjs().day() + 6) % 7, 'day').startOf('day')
    const inWeek = (day: number, hour: number) => monday.add(day, 'day').hour(hour).toISOString()
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(
      page([
        { id: 'w1', eventId: 'p2', locationName: 'Phòng tập nhà xứ', startAt: inWeek(2, 18), endAt: inWeek(2, 20), songs: [{ songId: 's1', songTitle: 'Con Bước Lên Bàn Thờ' }] },
        { id: 'w2', startAt: inWeek(2, 8), endAt: inWeek(2, 9), songs: [] },
      ]),
    )
    renderRehearsals('/director/rehearsals?view=week')

    const week = await screen.findByRole('list', { name: 'Lịch tập theo tuần' })
    expect(within(week).getAllByRole('listitem')).toHaveLength(7)
    const early = within(week).getByText('08:00–09:00')
    const late = within(week).getByText('18:00–20:00')
    expect(early.compareDocumentPosition(late) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(await within(week).findByRole('link', { name: 'Lễ Bổn mạng' })).toBeInTheDocument()
    expect(within(week).getByText('Phòng tập nhà xứ · 1 bài cần tập: Con Bước Lên Bàn Thờ')).toBeInTheDocument()
    expect(within(week).getByText('Không gắn chương trình')).toBeInTheDocument()
    expect(within(week).getByText('Chưa chọn bài tập')).toBeInTheDocument()
    // States are words read from the times; the BE has none.
    expect(within(week).getAllByText(/^(Sắp tới|Hôm nay|Đã qua)$/)).toHaveLength(2)
    expect(within(week).getAllByRole('button', { name: /^Xoá buổi tập/ })).toHaveLength(2)
    expect(screen.queryByText('Tuần này chưa có buổi tập nào.')).toBeNull()
  })

  it('filters by the program of the link on the server and names known programs', async () => {
    const list = vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(page(rehearsals))
    renderRehearsals('/director/rehearsals?programId=p1')

    expect(await screen.findByText('Chuẩn bị phục vụ')).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith({ eventId: 'p1' }, { pageNumber: 1, pageSize: 20 })
    expect(await screen.findByRole('link', { name: 'Lễ Bổn mạng' })).toBeInTheDocument()
    // An older program is not in the upcoming list: a plain link instead of its name.
    expect(screen.getByRole('link', { name: 'Xem chương trình' })).toBeInTheDocument()
  })

  it('edits an upcoming session only, and saves it with its time and location', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(page(rehearsals))
    const save = vi.spyOn(rehearsalsApi, 'saveRehearsal').mockResolvedValue()
    renderRehearsals()

    await screen.findByText('Chuẩn bị phục vụ')
    expect(screen.queryAllByRole('button', { name: /^Sửa buổi tập/ })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: /^Sửa buổi tập/ })[1])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        id: 'r2',
        values: {
          eventId: 'p2',
          locationId: 'loc-2',
          startAt: rehearsals[1].startAt,
          endAt: rehearsals[1].endAt,
          songs: [{ songId: 's1', songTitle: 'Con Bước Lên Bàn Thờ' }],
          note: undefined,
        },
      }),
    )
  })

  it('fills the songs from the approved list of the chosen program', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(page(rehearsals))
    const defaults = vi
      .spyOn(rehearsalsApi, 'getDefaultSongs')
      .mockResolvedValue([{ songId: 's9', songTitle: 'Hiệp Lễ Tạ Ơn' }])
    renderRehearsals('/director/rehearsals?programId=p1')

    fireEvent.click(await screen.findByRole('button', { name: /Lên lịch buổi tập/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /Lấy bài hát từ danh sách đã duyệt/ }))

    expect(await within(dialog).findByText('Hiệp Lễ Tạ Ơn')).toBeInTheDocument()
    expect(defaults).toHaveBeenCalledWith('p1')
  })

  it('requires the choir, date and time only', async () => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([
      { id: 'c1', name: 'Ca đoàn Cecilia', isActive: true },
      { id: 'c2', name: 'Ca đoàn Giuse', isActive: true },
    ])
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(page(rehearsals))
    const save = vi.spyOn(rehearsalsApi, 'saveRehearsal')
    renderRehearsals()

    fireEvent.click(await screen.findByRole('button', { name: /Lên lịch buổi tập/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lên lịch buổi tập' }))

    // D8: a new session belongs to one of the director's choirs; with two choirs none is preselected.
    expect(await within(dialog).findByText('Vui lòng chọn ca đoàn.')).toBeInTheDocument()
    expect(await within(dialog).findByText('Vui lòng chọn ngày tập.')).toBeInTheDocument()
    expect(await within(dialog).findByText('Vui lòng chọn giờ bắt đầu và kết thúc.')).toBeInTheDocument()
    expect(within(dialog).queryByText(/Vui lòng (nhập|chọn) (địa điểm|chương trình)/)).toBeNull()
    expect(save).not.toHaveBeenCalled()
  })

  it('explains why a session with attendance cannot be deleted', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(page(rehearsals))
    vi.spyOn(rehearsalsApi, 'deleteRehearsal').mockRejectedValue(new ApiError(409, { code: 'REHEARSAL_HAS_ATTENDANCE' }))
    renderRehearsals()

    await screen.findByText('Tập toàn ca đoàn')
    const buttons = screen.getAllByRole('button', { name: /^Xoá buổi tập/ })
    fireEvent.click(buttons[buttons.length - 1])
    // Ant Design renders a confirm title twice; the first one sits in the visible dialog.
    const confirm = (await screen.findAllByText(/^Xoá buổi tập .+?$/))[0].closest('.ant-modal') as HTMLElement
    fireEvent.click(within(confirm).getByRole('button', { name: 'Xoá buổi tập' }))

    expect(await screen.findByText('Buổi tập đã có điểm danh nên không thể xoá.')).toBeInTheDocument()
  })
})

describe('RehearsalPracticeRoomPage', () => {
  const renderRoom = (initialEntry: Parameters<typeof renderPage>[2] = '/director/rehearsals/r2') =>
    renderPage(<RehearsalPracticeRoomPage />, '/director/rehearsals/:rehearsalId', initialEntry)
  const emmanuelMidiMaterial = {
    id: 'emmanuel-midi',
    kind: 'rehearsalMaterial',
    title: 'Emmanuel – organ',
    fileName: 'emmanuel.mid',
    fileSizeBytes: 12000,
    targetSkillId: null,
    targetSkillName: null,
    url: 'https://files.example/emmanuel.mid',
    lyricsText: null,
    createdAt: '2026-11-05T12:00:00Z',
  } satisfies SongMaterial
  const emmanuelPlayback = {
    playback: {
      id: 'emmanuel-midi',
      songId: 'emmanuel',
      title: 'Emmanuel – organ',
      status: 'ready',
      schemaVersion: 1,
      durationSeconds: 8,
      instrument: 'organ',
      audioUrl: 'https://files.example/emmanuel.wav',
      notesUrl: 'https://files.example/emmanuel-notes.json',
      createdAt: '2026-11-05T12:00:00Z',
    },
    notes: {
      schemaVersion: 1,
      timeUnit: 'seconds',
      durationSeconds: 8,
      notesEndSeconds: 7,
      minPitch: 60,
      maxPitch: 67,
      tracks: [{ id: 0, name: 'Organ' }],
      notes: [
        { pitch: 60, start: 0, duration: 1, velocity: 90, track: 0 },
        { pitch: 64, start: 1, duration: 1, velocity: 90, track: 0 },
        { pitch: 67, start: 2, duration: 2, velocity: 100, track: 0 },
      ],
    },
  } satisfies MaterialPlaybackBundle

  const prepareEmmanuelPlayback = (materials: SongMaterial[] = [emmanuelMidiMaterial]) => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.spyOn(rehearsalsApi, 'getRehearsal').mockResolvedValue({
      ...rehearsals[1],
      songs: [{ songId: 'emmanuel', songTitle: 'Emmanuel' }],
    })
    vi.spyOn(rehearsalsApi, 'listRecordings').mockResolvedValue([])
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue(materials)
    return vi.spyOn(songsApi, 'getMaterialPlayback').mockResolvedValue(emmanuelPlayback)
  }

  it('says a session has no songs yet instead of failing (the backend allows a rehearsal without songs)', async () => {
    vi.spyOn(rehearsalsApi, 'getRehearsal').mockResolvedValue({ ...rehearsals[1], songs: [] })
    renderRoom()

    expect(await screen.findByRole('heading', { name: 'Buổi tập chưa có bài hát' })).toBeInTheDocument()
  })

  it('offers a retry when the session cannot be loaded, and says "not found" only for 404', async () => {
    // Not 404 (403 is not retried by the query client, so the error shows at once; 500 behaves the same after retries).
    const get = vi.spyOn(rehearsalsApi, 'getRehearsal').mockRejectedValue(new ApiError(403, undefined))
    const { unmount } = renderRoom()

    expect(await screen.findByRole('heading', { name: 'Không thể tải buổi tập' })).toBeInTheDocument()
    expect(screen.queryByText('Không tìm thấy buổi tập')).toBeNull()
    unmount()

    get.mockRejectedValue(new ApiError(404, { code: 'REHEARSAL_NOT_FOUND' }))
    renderRoom('/director/rehearsals/r404')
    expect(await screen.findByText('Không tìm thấy buổi tập')).toBeInTheDocument()
  })

  it('reads a session opened from the schedule again, so its router state (kept across reloads) is not shown stale', async () => {
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([])
    vi.spyOn(rehearsalsApi, 'listRecordings').mockResolvedValue([])
    const get = vi.spyOn(rehearsalsApi, 'getRehearsal').mockResolvedValue({
      ...rehearsals[1],
      songs: [{ songId: 's2', songTitle: 'Lễ Vật Tâm Tình' }],
    })
    renderRoom({
      pathname: '/director/rehearsals/r2',
      state: { rehearsal: { ...rehearsals[1], songs: [{ songId: 's1', songTitle: 'Con Bước Lên Bàn Thờ' }] } },
    })

    expect(await screen.findByRole('heading', { name: 'Lễ Vật Tâm Tình', level: 2 })).toBeInTheDocument()
    expect(screen.queryByText('Con Bước Lên Bàn Thờ')).toBeNull()
    expect(get).toHaveBeenCalledWith('r2')
  })

  it('loads a rehearsal opened by its link and lists, plays and deletes the takes of the chosen song (B43)', async () => {
    vi.spyOn(rehearsalsApi, 'getRehearsal').mockResolvedValue({ ...rehearsals[1], songs: [{ songId: 's1', songTitle: 'Con Bước Lên Bàn Thờ', note: 'Điệp khúc 2' }] })
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([])
    vi.spyOn(rehearsalsApi, 'listRecordings').mockResolvedValue([
      { id: 'rec-1', songId: 's1', fileSizeBytes: 1000, durationSeconds: 75, audioUrl: 'https://files.example/rec-1.webm', createdAt: '2026-10-31T12:00:00Z' },
      { id: 'rec-2', songId: 'other', fileSizeBytes: 1000, audioUrl: 'https://files.example/rec-2.webm', createdAt: '2026-10-31T12:05:00Z' },
    ])
    const remove = vi.spyOn(rehearsalsApi, 'deleteRecording').mockResolvedValue()
    renderPage(<RehearsalPracticeRoomPage />, '/director/rehearsals/:rehearsalId', '/director/rehearsals/r2')

    expect(await screen.findByText('Cần tập: Điệp khúc 2')).toBeInTheDocument()
    // Only the takes of the selected song; jsdom has no microphone, so recording says why it is off.
    expect(await screen.findByLabelText('Nghe bản thu 1 của Con Bước Lên Bàn Thờ')).toBeInTheDocument()
    expect(screen.queryByLabelText(/bản thu 2/)).toBeNull()
    expect(screen.getByRole('button', { name: /Thu âm$/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Xoá bản thu 1 của Con Bước Lên Bàn Thờ' }))
    const confirm = (await screen.findAllByText('Xoá bản thu 1 của “Con Bước Lên Bàn Thờ”?'))[0].closest('.ant-modal') as HTMLElement
    fireEvent.click(within(confirm).getByRole('button', { name: 'Xoá bản thu' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith('r2', 'rec-1'))
  })

  it('shows the synchronized MIDI score for Emmanuel instead of the lyrics and plain audio player', async () => {
    const getPlayback = prepareEmmanuelPlayback()

    renderRoom()

    expect(await screen.findByRole('heading', { name: 'Emmanuel', level: 2 })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Bản nốt đồng bộ' })).toBeInTheDocument()
    expect(screen.getByText('3 nốt · 1 track')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phát Emmanuel' })).toBeInTheDocument()
    expect(screen.queryByText('Bài hát chưa có lời dạng văn bản')).toBeNull()
    expect(getPlayback).toHaveBeenCalledWith('emmanuel-midi')
  })

  it('uses the choir-wide MIDI when the selected voice part has no dedicated MIDI', async () => {
    const getPlayback = prepareEmmanuelPlayback([
      emmanuelMidiMaterial,
      {
        id: 'emmanuel-soprano-audio',
        kind: 'sampleAudio',
        title: 'Emmanuel – Soprano',
        fileName: 'emmanuel-soprano.mp3',
        fileSizeBytes: 9000,
        targetSkillId: 'soprano',
        targetSkillName: 'Soprano',
        url: 'https://files.example/emmanuel-soprano.mp3',
        lyricsText: null,
        createdAt: '2026-11-05T12:00:00Z',
      },
    ])

    renderRoom()

    expect(await screen.findByRole('heading', { name: 'Bản nốt đồng bộ' })).toBeInTheDocument()
    fireEvent.click(screen.getByText('Soprano'))
    expect(await screen.findByRole('heading', { name: 'Bản nốt đồng bộ' })).toBeInTheDocument()
    expect(getPlayback).toHaveBeenLastCalledWith('emmanuel-midi')
    expect(screen.queryByLabelText('Nghe Emmanuel, bè Soprano')).toBeNull()
  })
})
