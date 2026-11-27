import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import { AdminChoirsPage, DirectorChoirsPage } from '@/features/choirs'
import * as membersApi from '@/features/members/api/membersApi'
import * as practiceApi from '@/features/practice/api/practiceApi'
import * as rehearsalsApi from '@/features/rehearsals/api/rehearsalsApi'
import * as rosterApi from '@/features/roster/api/rosterApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import * as accountsApi from '@/features/users/api/accountsApi'
import * as client from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { clearSession, setSession } from '@/lib/auth/session'
import { renderPage } from '@/test/renderPage'
import { programPage } from '@/test/programs'
import * as eventsApi from '../api/eventsApi'
import * as liturgicalDaysApi from '../api/liturgicalDaysApi'
import * as programsApi from '../api/programsApi'
import type { LiturgicalProgramDetail } from '../types'
import { DirectorProgramDetailPage } from './DirectorProgramDetailPage'
import { DirectorProgramListPage } from './DirectorProgramListPage'

const program: LiturgicalProgramDetail = {
  id: 'p1',
  eventName: 'Lễ Chúa Nhật XXVI',
  date: '2026-09-27',
  time: '08:00',
  locationName: 'Nhà thờ',
  status: 'published',
  songListStatus: 'needsRevision',
  songs: [{ id: 'a', liturgicalPart: 'Ca nhập lễ', title: 'Con Bước Lên Bàn Thờ' }],
}

const renderDetail = () =>
  renderPage(<DirectorProgramDetailPage />, '/director/programs/:programId', '/director/programs/p1')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DirectorProgramListPage', () => {
  it('lists programs without a create action and opens the director detail', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage(program))
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songs: [{ id: 'i1', title: 'Con bước lên bàn thờ', liturgicalPart: 'Ca nhập lễ' }] })
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findAllByText('Lễ Chúa Nhật XXVI')).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Tạo chương trình/ })).toBeNull()
    // The first program is previewed beside the list, with the songs chosen so far by liturgical part.
    const preview = await screen.findByRole('complementary', { name: 'Xem trước: Lễ Chúa Nhật XXVI' })
    expect(await within(preview).findByText('Con bước lên bàn thờ')).toBeInTheDocument()
    fireEvent.click(within(preview).getByRole('button', { name: 'Mở chương trình' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p1')
  })

  it('tells a Choir Director without a choir why no program appears', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage())
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([])
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findByText('Bạn chưa phụ trách ca đoàn nào')).toBeInTheDocument()
    expect(screen.getByText(/Quản trị viên chọn ca trưởng cho ca đoàn ở trang Ca đoàn/)).toBeInTheDocument()
  })

  it('offers the library, never a create action, when no program is published yet', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage())
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([{ id: 'c1', name: 'Ca đoàn Cecilia', isActive: true, directorId: 'u1' }])
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findByRole('heading', { name: 'Chưa có chương trình phụng vụ nào' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tạo chương trình/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mở kho bài hát' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/library')
  })

  it('filters through the shared bar and reads missing cells as "Chưa cập nhật"', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage(program))
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(program)
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findByText('1 chương trình')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xoá bộ lọc' })).toBeDisabled()
    expect(screen.getByRole('columnheader', { name: 'Thao tác' })).toBeInTheDocument()
    // No season, no due date in the fixture: the table says so instead of a bare dash.
    expect(screen.getAllByText('Chưa cập nhật').length).toBeGreaterThan(0)
    expect(screen.queryByText('—')).toBeNull()
  })

  it('pages on the server and marks cancelled programs', async () => {
    const list = vi
      .spyOn(programsApi, 'listPrograms')
      .mockResolvedValue(programPage(program, { id: 'p2', eventName: 'Lễ Bổn mạng', date: '2026-10-04', status: 'cancelled' }))
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(null)
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findByText('Lễ Bổn mạng')).toBeInTheDocument()
    expect(screen.getByText('Đã hủy')).toBeInTheDocument()
    // Its detail cannot be read by the Choir Director, so nothing leads to a "not found" page.
    expect(screen.queryByRole('button', { name: /Lễ Bổn mạng$/ })).toBeNull()
    expect(list).toHaveBeenCalledWith({}, { pageNumber: 1, pageSize: 20 })
  })
})

describe('DirectorProgramDetailPage', () => {
  // Before the fixture Masses: the song list closes once the Mass begins (BE 61b3aa6).
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-20T08:00:00+07:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('only offers to read the song list once the Mass has begun (BE 61b3aa6)', async () => {
    vi.setSystemTime(new Date('2026-09-27T09:00:00+07:00'))
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(program)
    renderDetail()

    expect(await screen.findByRole('button', { name: 'Xem danh sách đề xuất' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chỉnh sửa danh sách bài hát' })).toBeNull()
  })

  it('reads the published event and its newest song list, which may not exist yet', async () => {
    vi.spyOn(client, 'apiRequest').mockImplementation(async (path: string) => {
      if (path === '/api/schedule/events/p1') {
        return {
          id: 'p1',
          eventDate: '2026-10-04',
          time: '07:30:00',
          title: null,
          locationName: 'Nhà thờ chính',
          liturgicalSeasonName: 'Mùa Thường Niên',
          massTypeName: 'Lễ Chúa Nhật',
          ceremonyTypeName: null,
          specialRequirements: null,
        }
      }
      if (path === '/api/song-lists/event/p1/latest') throw new ApiError(404, { code: 'SONG_LIST_NOT_FOUND' })
      throw new Error(`unexpected ${path}`)
    })
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Lễ Chúa Nhật' })).toBeInTheDocument()
    expect(screen.getByText(/Nhà thờ chính/)).toBeInTheDocument()
    expect(screen.getByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đề xuất danh sách bài hát' })).toBeInTheDocument()
  })


  it('shows the song list and opens the proposal for editing after a revision request', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(program)
    renderDetail()

    expect(await screen.findByText('Con Bước Lên Bàn Thờ')).toBeInTheDocument()
    expect(screen.getByText('Yêu cầu chỉnh sửa', { selector: '.ant-tag' })).toBeInTheDocument()
    expect(screen.getByText(/Lịch tập/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa danh sách bài hát' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p1/song-list')
  })

  it('shows the preparation status the Choir Director now reads from the backend (BE 90af733, B41)', async () => {
    // After the Mass, which counts as one completed item.
    vi.setSystemTime(new Date('2026-10-01T08:00:00+07:00'))
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songListStatus: 'approved' })
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue(null)
    const status = vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue({
      songListStatus: 'approved',
      songListDueDate: '2026-09-20',
      isSongListOverdue: false,
      participation: { invited: 1, confirmed: 2, declined: 0, unsure: 0 },
      rosterActiveAssignments: 0,
      rosterShortages: [{ skillName: 'Đàn organ', requiredCount: 1, assignedCount: 0 }],
      rehearsalsTotal: 3,
      rehearsalsHeld: 2,
      attendanceExpected: 6,
      attendancePresent: 3,
      practiceExpected: 6,
      practicePassed: 3,
      practiceOverdue: 0,
    })
    vi.spyOn(practiceApi, 'listPreparationProgress').mockResolvedValue([])
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 1, totalCount: 3, totalPages: 3 })
    vi.spyOn(rosterApi, 'getRoster').mockResolvedValue(null)
    vi.spyOn(rosterApi, 'getShortages').mockResolvedValue([])
    renderDetail()

    expect(await screen.findByText('2 đã xác nhận')).toBeInTheDocument()
    // Once in the independent overview, once in the preparation hub.
    expect(screen.getAllByText('2/3 buổi đã tập')).toHaveLength(2)
    expect(screen.getByText(/Đã hoàn tất/)).toHaveTextContent('3/6')
    // 3 of 6 attendances (2 held × 3 members), 3 of 6 practice submissions passed.
    expect(screen.getByText(/Tỷ lệ có mặt/)).toHaveTextContent('Tỷ lệ có mặt: 50% (3/6 lượt)')
    expect(screen.getByText(/lượt nộp/)).toHaveTextContent('Đạt 3 / 6 lượt nộp')
    expect(screen.getByText(/Còn thiếu nhân sự cho/)).toHaveTextContent('Còn thiếu nhân sự cho 1 vị trí')
    expect(status).toHaveBeenCalledWith('p1')
  })

  it('reads each part of the Mass with its files and staffing, in the colour of the synced day (Signature #3)', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({
      ...program,
      songListStatus: 'approved',
      songs: [
        { id: 'i1', songId: 's1', liturgicalPart: 'Ca nhập lễ', title: 'Con Bước Lên Bàn Thờ' },
        { id: 'i2', songId: 's2', liturgicalPart: 'Đáp ca', title: 'Chúa Là Mục Tử' },
      ],
    })
    vi.spyOn(programsApi, 'getSongCredits').mockImplementation(async (songId) =>
      songId === 's1'
        ? { composer: 'Kim Long', materials: 2, materialCounts: { sheetMusic: 1, lyrics: 0, sampleAudio: 1, rehearsalMaterial: 0, interactiveScore: 0 } }
        : { materials: 0, materialCounts: { sheetMusic: 0, lyrics: 0, sampleAudio: 0, rehearsalMaterial: 0, interactiveScore: 0 } },
    )
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue(null)
    vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue({
      songListStatus: 'approved',
      songListDueDate: '2026-09-20',
      isSongListOverdue: false,
      participation: { invited: 0, confirmed: 0, declined: 0, unsure: 0 },
      rosterFinalized: false,
      rosterActiveAssignments: 1,
      rosterShortages: [{ songListItemId: 'i2', songTitle: 'Chúa Là Mục Tử', skillName: 'Xướng đáp ca', requiredCount: 1, assignedCount: 0 }],
      rehearsalsTotal: 0,
      rehearsalsHeld: 0,
      attendanceExpected: 0,
      attendancePresent: 0,
      practiceExpected: 0,
      practicePassed: 0,
      practiceOverdue: 0,
    })
    const days = vi.spyOn(liturgicalDaysApi, 'listLiturgicalDays').mockResolvedValue([
      { date: '2026-09-27', celebrationName: 'Chúa nhật XXVI Thường niên', seasonKey: 'OrdinaryTime', color: 'green' },
    ])
    const { container } = renderDetail()

    const order = await screen.findByRole('list', { name: 'Các bài hát theo thứ tự trong lễ' })
    expect(within(order).getByText('Ca nhập lễ')).toBeInTheDocument()
    expect(await within(order).findByRole('group', { name: 'Tài liệu của Con Bước Lên Bàn Thờ' })).toHaveTextContent('Bản nhạcAudio mẫu')
    expect(await within(order).findByText('Chưa có tài liệu đính kèm')).toBeInTheDocument()
    expect(await within(order).findByText('Thiếu Xướng đáp ca (0/1)')).toBeInTheDocument()
    // The backend lists shortages only: a part it does not list is "not short", never claimed as fully staffed.
    expect(within(order).getByText('Không thiếu nhân sự')).toBeInTheDocument()
    expect(within(order).queryByText('Đủ nhân sự')).toBeNull()
    expect(within(order).getByRole('link', { name: 'Phân công' })).toHaveAttribute('href', '/director/roster?programId=p1')
    expect(days).toHaveBeenCalledWith('2026-09-27', '2026-09-27')
    await waitFor(() => expect(container.querySelector('.ct-season-ribbon')).not.toBeNull())
  })

  it('keeps staffing marks back until the list is approved, and stays neutral when the calendar is not synced', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songListStatus: 'submitted' })
    vi.spyOn(liturgicalDaysApi, 'listLiturgicalDays').mockResolvedValue([])
    const { container } = renderDetail()

    // Said once for the list, not repeated under every part.
    expect(await screen.findAllByText('Phân công phục vụ cho từng phần mở sau khi danh sách được duyệt.')).toHaveLength(1)
    expect(screen.queryByText('Chờ duyệt bài hát để phân công')).toBeNull()
    expect(screen.queryByText('Không thiếu nhân sự')).toBeNull()
    expect(container.querySelector('.ct-season-ribbon')).toBeNull()
  })

  const approvedProgram = { ...program, songListStatus: 'approved' as const, songs: [{ id: 'i1', liturgicalPart: 'Ca nhập lễ', title: 'Con Bước Lên Bàn Thờ' }] }
  const prepStatus = (patch: Partial<Awaited<ReturnType<typeof eventsApi.getPreparationStatus>>>) => ({
    songListStatus: 'approved' as const,
    songListDueDate: '2026-09-20',
    isSongListOverdue: false,
    participation: { invited: 0, confirmed: 0, declined: 0, unsure: 0 },
    rosterActiveAssignments: 0,
    rosterShortages: [],
    rehearsalsTotal: 0,
    rehearsalsHeld: 0,
    attendanceExpected: 0,
    attendancePresent: 0,
    practiceExpected: 0,
    practicePassed: 0,
    practiceOverdue: 0,
    ...patch,
  })

  it('shows no staffing mark on an approved list while the preparation status loads (R2.6)', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(approvedProgram)
    vi.spyOn(eventsApi, 'getPreparationStatus').mockReturnValue(new Promise(() => {}))
    renderDetail()

    const order = await screen.findByRole('list', { name: 'Các bài hát theo thứ tự trong lễ' })
    expect(within(order).queryByText(/nhân sự|Thiếu /)).toBeNull()
  })

  it('shows no staffing mark on an approved list when the preparation status fails', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(approvedProgram)
    vi.spyOn(eventsApi, 'getPreparationStatus').mockRejectedValue(new ApiError(403, undefined))
    renderDetail()

    expect(await screen.findByText('Không thể tải tình hình chuẩn bị.')).toBeInTheDocument()
    const order = screen.getByRole('list', { name: 'Các bài hát theo thứ tự trong lễ' })
    expect(within(order).queryByText(/nhân sự|Thiếu /)).toBeNull()
  })

  it('says "Không thiếu nhân sự" for an unlisted part only once a roster exists', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(approvedProgram)
    const status = vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue(prepStatus({}))
    const { unmount } = renderDetail()

    await waitFor(() => expect(status).toHaveBeenCalled())
    expect(await screen.findByText('Chưa có lịch')).toBeInTheDocument()
    expect(screen.queryByText('Không thiếu nhân sự')).toBeNull()
    unmount()

    status.mockResolvedValue(prepStatus({ rosterFinalized: false }))
    renderDetail()
    expect(await screen.findByText('Không thiếu nhân sự')).toBeInTheDocument()
  })

  it('explains an empty song list once, under the single song-list action', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songListStatus: undefined, songs: [] })
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Chưa có danh sách bài hát' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Đề xuất danh sách bài hát' })).toHaveLength(1)
  })

  it('shows a designed empty state when the program is not found', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(null)
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy chương trình phụng vụ' })).toBeInTheDocument()
  })

  it.each([
    [undefined, 'Đề xuất danh sách bài hát'],
    ['submitted', 'Xem danh sách đề xuất'],
    ['approved', 'Xem danh sách đề xuất'],
  ] as const)('labels the song-list action for status %s', async (status, label) => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songListStatus: status })
    renderDetail()

    expect(await screen.findByRole('button', { name: label })).toBeInTheDocument()
  })
})

describe('ChoirsPage', () => {
  const cecilia = { id: 'c1', name: 'Ca đoàn Cecilia', description: 'Lễ Chúa Nhật', isActive: true, directorId: 'u1', directorName: 'Phêrô Lê' }
  const giuse = { id: 'c2', name: 'Ca đoàn Giuse', isActive: false }

  it('lets the Admin add a choir with its director and shows a taken name under the name field', async () => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([cecilia, giuse])
    // The Admin page also reads who is in no choir: one active member, in neither choir.
    vi.spyOn(choirsApi, 'listMembersOfChoir').mockResolvedValue([])
    vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([{ id: 'm9', fullName: 'Anna Đặng Thị Mai', skills: [], roleName: 'ChoirMember' }])
    vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue({
      items: [{ id: 'u2', fullName: 'Giuse Trần', email: 'giuse@giaoxu.org', phone: null, saintName: null, role: 'director', isActive: true, isPasswordChangeRequired: false }],
      pageNumber: 1,
      pageSize: 100,
      totalCount: 1,
      totalPages: 1,
    })
    const save = vi
      .spyOn(choirsApi, 'saveChoir')
      .mockRejectedValue(new ApiError(409, { code: 'CHOIR_NAME_ALREADY_EXISTS' }))
    renderPage(<AdminChoirsPage />, '/admin/choirs')

    expect(await screen.findByText('Ca đoàn Cecilia')).toBeInTheDocument()
    expect(screen.getByText('Phêrô Lê')).toBeInTheDocument()
    expect(screen.getByText('Ngừng hoạt động')).toBeInTheDocument()
    expect(await screen.findByText('1 ca viên chưa thuộc ca đoàn nào')).toBeInTheDocument()
    expect(screen.getByText(/Anna Đặng Thị Mai/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Thêm ca đoàn/ }))
    const dialog = await screen.findByRole('dialog')
    // A new choir is always active: no switch when adding.
    expect(within(dialog).queryByRole('switch')).toBeNull()
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên ca đoàn' }), { target: { value: ' Ca đoàn Cecilia ' } })
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Ca trưởng phụ trách' }))
    fireEvent.click(await screen.findByTitle('Giuse Trần'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    expect(await within(dialog).findByText('Đã có ca đoàn trùng tên.')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith({
      id: undefined,
      values: expect.objectContaining({ name: 'Ca đoàn Cecilia', isActive: true, directorId: 'u2' }),
    })
  })

  it('lets the Admin add members to a choir', async () => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([cecilia])
    vi.spyOn(choirsApi, 'listMembersOfChoir').mockResolvedValue([])
    vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([{ id: 'm2', fullName: 'Simon Phan Văn Đức', skills: [] }])
    const add = vi.spyOn(choirsApi, 'addChoirMembers').mockResolvedValue()
    renderPage(<AdminChoirsPage />, '/admin/choirs')

    fireEvent.click(await screen.findByRole('button', { name: 'Ca viên của Ca đoàn Cecilia' }))
    expect(await screen.findByText('Thêm ca viên đang sinh hoạt vào ca đoàn này.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Thêm ca viên/ }))
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Ca viên cần thêm' }))
    fireEvent.click(await screen.findByTitle('Simon Phan Văn Đức'))
    fireEvent.click(screen.getByRole('button', { name: 'Thêm 1 ca viên' }))

    await waitFor(() => expect(add).toHaveBeenCalledWith('c1', ['m2']))
  })

  it('shows the Choir Director their choirs without add or edit, and lets them add and take out members', async () => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([cecilia])
    vi.spyOn(choirsApi, 'listMembersOfChoir').mockResolvedValue([
      { memberId: 'm1', fullName: 'Maria Nguyễn Thu Hướng', email: 'maria@giaoxu.org', joinedDate: '2026-10-17' },
    ])
    vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([
      { id: 'm1', fullName: 'Maria Nguyễn Thu Hướng', skills: [] },
      { id: 'm2', fullName: 'Simon Phan Văn Đức', skills: [] },
    ])
    const add = vi.spyOn(choirsApi, 'addChoirMembers').mockResolvedValue()
    const remove = vi.spyOn(choirsApi, 'removeChoirMember').mockResolvedValue()
    renderPage(<DirectorChoirsPage />, '/director/choirs')

    fireEvent.click(await screen.findByRole('button', { name: 'Ca viên của Ca đoàn Cecilia' }))
    expect(screen.queryByRole('button', { name: /Thêm ca đoàn/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chỉnh sửa Ca đoàn Cecilia' })).toBeNull()
    expect(await screen.findByText('maria@giaoxu.org')).toBeInTheDocument()
    expect(screen.getByText('17/10/2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Thêm ca viên/ }))
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Ca viên cần thêm' }))
    expect(screen.queryByRole('option', { name: 'Maria Nguyễn Thu Hướng' })).toBeNull()
    fireEvent.click(await screen.findByTitle('Simon Phan Văn Đức'))
    fireEvent.click(screen.getByRole('button', { name: 'Thêm 1 ca viên' }))
    await waitFor(() => expect(add).toHaveBeenCalledWith('c1', ['m2']))

    fireEvent.click(screen.getByRole('button', { name: 'Rút Maria Nguyễn Thu Hướng khỏi ca đoàn' }))
    const confirm = (await screen.findAllByText('Rút Maria Nguyễn Thu Hướng khỏi Ca đoàn Cecilia?'))[0].closest('.ant-modal') as HTMLElement
    fireEvent.click(within(confirm).getByRole('button', { name: 'Rút khỏi ca đoàn' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith('c1', 'm1'))
  })

  it('shows the Choir Director the serving choirs read-only and says when another choir leads', async () => {
    setSession({ accessToken: 't', accessTokenExpiresAt: '2099-01-01T00:00:00Z', refreshToken: 'r', user: { id: 'u1', email: 'a@b.c', roleName: 'ChoirDirector' } })
    vi.spyOn(choirsApi, 'listEventChoirs').mockResolvedValue([
      { choirId: 'c2', name: 'Ca đoàn Giuse', isActive: true, isLead: true, directorId: 'u9', directorName: 'Giuse Trần' },
      { choirId: 'c1', name: 'Ca đoàn Cecilia', isActive: true, isLead: false, directorId: 'u1', directorName: 'Phêrô Lê' },
    ])
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, date: '2099-01-01' })
    renderDetail()

    expect(await screen.findByText('Ca đoàn Giuse phụ trách chương trình này')).toBeInTheDocument()
    expect(screen.getByText(/Ca đoàn Giuse · Phụ trách/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Chọn ca đoàn/ })).toBeNull()
    clearSession()
  })
})
