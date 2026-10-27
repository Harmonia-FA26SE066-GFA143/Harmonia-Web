import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as songsApi from '@/features/music-library/api/songsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { programPage } from '@/test/programs'
import * as rehearsalsApi from '../api/rehearsalsApi'
import type { Rehearsal } from '../types'
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

const renderRehearsals = (initialEntry = '/director/rehearsals') =>
  renderPage(<RehearsalsPage />, '/director/rehearsals', initialEntry)

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
    expect(screen.getAllByRole('button', { name: /Tạo buổi tập/ }).length).toBeGreaterThan(0)
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

    fireEvent.click(await screen.findByRole('button', { name: /Tạo buổi tập/ }))
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

    fireEvent.click(await screen.findByRole('button', { name: /Tạo buổi tập/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo buổi tập' }))

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
