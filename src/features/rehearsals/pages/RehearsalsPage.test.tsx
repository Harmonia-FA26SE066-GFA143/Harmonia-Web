import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import { ApiContractMissingError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { programPage } from '@/test/programs'
import * as rehearsalsApi from '../api/rehearsalsApi'
import type { Rehearsal } from '../types'
import { RehearsalsPage } from './RehearsalsPage'

const at = (days: number, hour: number) => dayjs().add(days, 'day').hour(hour).minute(0).second(0).millisecond(0).toISOString()

const rehearsals: Rehearsal[] = [
  {
    id: 'r1',
    programId: 'p1',
    name: 'Tập toàn ca đoàn',
    startAt: at(-3, 19),
    endAt: at(-3, 21),
    location: 'Nhà thờ',
    songs: [],
    hasAttendance: true,
  },
  {
    id: 'r2',
    programId: 'p2',
    name: 'Tập chính ráp 4 bè',
    startAt: at(2, 19),
    endAt: at(2, 21),
    location: 'Phòng tập nhà xứ',
    songs: [{ songId: 's1', title: 'Con Bước Lên Bàn Thờ' }],
  },
  { id: 'r3', programId: 'p1', name: 'Chuẩn bị phục vụ', startAt: at(5, 18), endAt: at(5, 20), location: 'Nhà thờ', songs: [] },
]

const renderRehearsals = (initialEntry = '/director/rehearsals') =>
  renderPage(<RehearsalsPage />, '/director/rehearsals', initialEntry)

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage(
    { id: 'p1', eventName: 'Lễ Chúa Nhật', date: '2026-10-04', songListStatus: 'approved' },
    { id: 'p2', eventName: 'Lễ Bổn mạng', date: '2026-10-11', songListStatus: 'approved' },
    { id: 'p3', eventName: 'Lễ Mân Côi', date: '2026-10-18', songListStatus: 'submitted' },
  ))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RehearsalsPage', () => {
  it('shows a recoverable error while the API contract is missing', async () => {
    renderRehearsals()

    expect(await screen.findByRole('heading', { name: 'Không thể tải lịch tập' })).toBeInTheDocument()
  })

  it('shows the empty state with a create action', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue([])
    renderRehearsals()

    expect(await screen.findByRole('heading', { name: 'Chưa có buổi tập nào' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Tạo buổi tập/ }).length).toBeGreaterThan(0)
  })

  it('separates upcoming and past sessions and filters by the program in the link', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(rehearsals)
    renderRehearsals('/director/rehearsals?programId=p1')

    expect(await screen.findByText('Chuẩn bị phục vụ')).toBeInTheDocument()
    expect(screen.queryByText('Tập chính ráp 4 bè')).toBeNull()
    expect(screen.queryByText('Tập toàn ca đoàn')).toBeNull()

    fireEvent.click(screen.getByText('Đã qua (1)'))
    expect(await screen.findByText('Tập toàn ca đoàn')).toBeInTheDocument()
  })

  it('edits a rehearsal and keeps its time', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(rehearsals)
    const save = vi.spyOn(rehearsalsApi, 'saveRehearsal').mockResolvedValue(rehearsals[1])
    renderRehearsals()

    fireEvent.click(await screen.findByRole('button', { name: 'Sửa Tập chính ráp 4 bè' }))
    const dialog = await screen.findByRole('dialog')
    const name = within(dialog).getByRole('textbox', { name: 'Tên buổi tập' })
    fireEvent.change(name, { target: { value: 'Tập ráp 4 bè lần 2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        id: 'r2',
        values: {
          programId: 'p2',
          name: 'Tập ráp 4 bè lần 2',
          startAt: rehearsals[1].startAt,
          endAt: rehearsals[1].endAt,
          location: 'Phòng tập nhà xứ',
          songs: [{ songId: 's1', title: 'Con Bước Lên Bàn Thờ' }],
          note: undefined,
        },
      }),
    )
  })

  it('asks before deleting a rehearsal', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(rehearsals)
    const remove = vi.spyOn(rehearsalsApi, 'deleteRehearsal').mockResolvedValue()
    renderRehearsals()

    fireEvent.click(await screen.findByRole('button', { name: 'Xoá Tập chính ráp 4 bè' }))
    const confirm = await screen.findByRole('dialog')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Xoá buổi tập' }))

    await waitFor(() => expect(remove).toHaveBeenCalledWith('r2'))
  })

  it('counts the tabs within the program filter', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(rehearsals)
    renderRehearsals('/director/rehearsals?programId=p2')

    expect(await screen.findByText('Sắp tới (1)')).toBeInTheDocument()
    expect(screen.getByText('Đã qua (0)')).toBeInTheDocument()
  })

  it('says so when the programs cannot be loaded instead of showing "no program"', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(rehearsals)
    vi.spyOn(programsApi, 'listPrograms').mockRejectedValue(new ApiContractMissingError('liturgical programs'))
    renderRehearsals()

    expect(await screen.findByText('Không thể tải danh sách chương trình phụng vụ')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa tải được').length).toBeGreaterThan(0)
  })

  it('cannot delete a rehearsal that already has attendance', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(rehearsals)
    renderRehearsals()

    fireEvent.click(await screen.findByText('Đã qua (1)'))
    const button = await screen.findByRole('button', { name: /Xoá Tập toàn ca đoàn/ })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAccessibleName(/không thể xoá/)
    fireEvent.click(button)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('requires location and songs, and rejects a program without an approved song list', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue(rehearsals)
    const save = vi.spyOn(rehearsalsApi, 'saveRehearsal')
    renderRehearsals('/director/rehearsals?programId=p3')

    fireEvent.click(await screen.findByRole('button', { name: /Tạo buổi tập/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo buổi tập' }))

    expect(await within(dialog).findByText('Chương trình chưa có danh sách bài hát đã duyệt.')).toBeInTheDocument()
    expect(within(dialog).getByText('Vui lòng nhập địa điểm.')).toBeInTheDocument()
    expect(within(dialog).getByText('Vui lòng chọn ít nhất một bài hát tập.')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })
})
