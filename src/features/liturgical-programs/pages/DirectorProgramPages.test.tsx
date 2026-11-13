import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songListStatus: 'approved' })
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue(null)
    const status = vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue({
      songListStatus: 'approved',
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
    vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([{ id: 'm9', fullName: 'Anna Đặng Thị Mai', skills: [], roleName: 'ChoirMember' }])
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
    vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([{ id: 'm2', fullName: 'Simon Phan Văn Đức', skills: [] }])
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
    vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([
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
