import { fireEvent, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as programsApi from '../api/programsApi'
import { ProgramCalendarPage } from './ProgramCalendarPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProgramCalendarPage', () => {
  it('shows a recoverable error while the programs API contract is missing', async () => {
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByRole('heading', { name: 'Không thể tải lịch phụng vụ' })).toBeInTheDocument()
  })

  it("lists the selected day's programs, today by default", async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([
      { id: 'p1', eventName: 'Thánh lễ hôm nay', date: dayjs().format('YYYY-MM-DD'), songListStatus: 'approved' },
    ])
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByRole('button', { name: 'Xem chi tiết Thánh lễ hôm nay' })).toBeInTheDocument()
    expect(screen.getByText('Đã phê duyệt')).toBeInTheDocument()
  })

  it('creates a program for the selected day', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([])
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByText('Chưa có chương trình phụng vụ nào.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tạo chương trình cho ngày này/ }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/new')
  })
})
