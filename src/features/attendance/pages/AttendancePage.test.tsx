import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as rehearsalsApi from '@/features/rehearsals/api/rehearsalsApi'
import { renderPage } from '@/test/renderPage'
import * as attendanceApi from '../api/attendanceApi'
import { AttendancePage } from './AttendancePage'

const today = { startAt: dayjs().startOf('day').toISOString(), endAt: dayjs().endOf('day').toISOString() }

const at = (days: number, hour: number) => dayjs().add(days, 'day').hour(hour).minute(0).second(0).millisecond(0).toISOString()

const renderAttendance = (initialEntry = '/director/attendance') =>
  renderPage(<AttendancePage />, '/director/attendance', initialEntry)

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([{ id: 'p1', eventName: 'Lễ Chúa Nhật', date: '2026-10-04' }])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AttendancePage', () => {
  it('shows a recoverable error while the rehearsal list has no API', async () => {
    renderAttendance()

    expect(await screen.findByRole('heading', { name: 'Không thể tải buổi tập' })).toBeInTheDocument()
  })

  it('points to the schedule when there is no session', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue([])
    renderAttendance()

    expect(await screen.findByRole('heading', { name: 'Chưa có buổi tập để điểm danh' })).toBeInTheDocument()
  })

  it('marks members and saves only the changes', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue([
      { id: 'r0', programId: 'p1', name: 'Tập hôm qua', startAt: at(-1, 19), endAt: at(-1, 21), location: 'Nhà thờ', songs: [] },
      { id: 'r1', programId: 'p1', name: 'Tập toàn ca đoàn', ...today, location: 'Nhà thờ', songs: [] },
      { id: 'r2', programId: 'p1', name: 'Tập riêng bè Nam', startAt: at(3, 19), endAt: at(3, 21), location: 'Nhà thờ', songs: [] },
    ])
    const get = vi.spyOn(attendanceApi, 'getAttendance').mockResolvedValue([
      { memberId: 'm1', fullName: 'Maria Nguyễn Thu Hướng', value: 'present' },
      { memberId: 'm2', fullName: 'Simon Phan Văn Đức' },
      { memberId: 'm3', fullName: 'Anna Đặng Thị Mai' },
    ])
    const save = vi.spyOn(attendanceApi, 'saveAttendance').mockResolvedValue()
    renderAttendance()

    // Today's session is chosen by default.
    const simon = await screen.findByRole('radiogroup', { name: 'Điểm danh Simon Phan Văn Đức' })
    expect(get).toHaveBeenCalledWith('r1')
    expect(screen.getByRole('button', { name: /Lưu điểm danh/ })).toBeDisabled()

    fireEvent.click(within(simon).getByText('Vắng'))
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Điểm danh Anna Đặng Thị Mai' })).getByText('Có mặt'))
    fireEvent.click(screen.getByRole('button', { name: /Lưu điểm danh \(2 thay đổi\)/ }))

    await waitFor(() => expect(save).toHaveBeenCalledWith('r1', { m2: 'absent', m3: 'present' }))
  })

  it('marks everyone present at once', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue([
      { id: 'r1', programId: 'p1', name: 'Tập toàn ca đoàn', ...today, location: 'Nhà thờ', songs: [] },
    ])
    vi.spyOn(attendanceApi, 'getAttendance').mockResolvedValue([
      { memberId: 'm1', fullName: 'Maria Nguyễn Thu Hướng', value: 'absent' },
      { memberId: 'm2', fullName: 'Simon Phan Văn Đức' },
    ])
    renderAttendance('/director/attendance?rehearsalId=r1')

    fireEvent.click(await screen.findByRole('button', { name: /Đánh dấu tất cả có mặt/ }))
    expect(screen.getByRole('button', { name: /Lưu điểm danh \(2 thay đổi\)/ })).toBeEnabled()
  })

  it('corrects a past session, as the backend allows any time after the start', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue([
      { id: 'r0', programId: 'p1', name: 'Tập hôm qua', startAt: at(-1, 19), endAt: at(-1, 21), location: 'Nhà thờ', songs: [] },
    ])
    vi.spyOn(attendanceApi, 'getAttendance').mockResolvedValue([{ memberId: 'm1', fullName: 'Maria Nguyễn Thu Hướng', value: 'present' }])
    const save = vi.spyOn(attendanceApi, 'saveAttendance').mockResolvedValue()
    renderAttendance('/director/attendance?rehearsalId=r0')

    const maria = await screen.findByRole('radiogroup', { name: 'Điểm danh Maria Nguyễn Thu Hướng' })
    fireEvent.click(within(maria).getByText('Muộn'))
    fireEvent.click(screen.getByRole('button', { name: /Lưu điểm danh \(1 thay đổi\)/ }))

    await waitFor(() => expect(save).toHaveBeenCalledWith('r0', { m1: 'late' }))
  })

  it('shows a session read-only until it starts', async () => {
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue([
      { id: 'r0', programId: 'p1', name: 'Tập tuần sau', startAt: at(7, 19), endAt: at(7, 21), location: 'Nhà thờ', songs: [] },
    ])
    vi.spyOn(attendanceApi, 'getAttendance').mockResolvedValue([
      { memberId: 'm1', fullName: 'Maria Nguyễn Thu Hướng', value: 'present' },
    ])
    renderAttendance('/director/attendance?rehearsalId=r0')

    expect(await screen.findByText(/Điểm danh được từ khi buổi tập bắt đầu/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lưu điểm danh/ })).toBeNull()
    const radios = within(screen.getByRole('radiogroup', { name: 'Điểm danh Maria Nguyễn Thu Hướng' })).getAllByRole('radio')
    radios.forEach((radio) => expect(radio).toBeDisabled())
  })
})
