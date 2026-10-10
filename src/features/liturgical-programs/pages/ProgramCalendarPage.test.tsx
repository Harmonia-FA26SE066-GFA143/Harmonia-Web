import { fireEvent, screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import * as daysApi from '../api/liturgicalDaysApi'
import { ProgramCalendarPage } from './ProgramCalendarPage'

const empty = { items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 }

beforeEach(() => {
  vi.spyOn(daysApi, 'getLiturgicalDay').mockResolvedValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProgramCalendarPage', () => {
  it('shows a recoverable error when the events cannot be loaded', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByRole('heading', { name: 'Không thể tải lịch phụng vụ' })).toBeInTheDocument()
  })

  it("loads the current month and lists the selected day's events, today by default", async () => {
    const list = vi.spyOn(eventsApi, 'listEvents').mockResolvedValue({
      ...empty,
      totalCount: 1,
      totalPages: 1,
      items: [
        {
          id: 'e1',
          date: dayjs().format('YYYY-MM-DD'),
          time: '18:00',
          title: 'Thánh lễ hôm nay',
          locationId: 'loc-1',
          locationName: 'Nhà thờ chính',
          status: 'published',
        },
      ],
    })
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByRole('button', { name: 'Xem chi tiết Thánh lễ hôm nay lúc 18:00' })).toBeInTheDocument()
    expect(screen.getByText('Đã công bố')).toBeInTheDocument()
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        { fromDate: dayjs().startOf('month').format('YYYY-MM-DD'), toDate: dayjs().endOf('month').format('YYYY-MM-DD') },
        { pageNumber: 1, pageSize: 100 },
      ),
    )
  })

  it('creates an event for the selected day', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(empty)
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByText('Chưa có sự kiện nào trong tháng này.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tạo chương trình cho ngày này/ }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/new')
  })

  it('shows the liturgical day of the selected date', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(empty)
    const get = vi.spyOn(daysApi, 'getLiturgicalDay').mockResolvedValue({
      date: dayjs().format('YYYY-MM-DD'),
      celebrationName: 'Chúa Nhật XXIX Mùa Quanh Năm',
      rank: 'Solemnity',
      seasonName: 'OrdinaryTime',
    })
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByText('Chúa Nhật XXIX Mùa Quanh Năm')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(dayjs().format('YYYY-MM-DD'))
    expect(screen.getByText('Lễ trọng')).toBeInTheDocument()
    expect(screen.getByText('Mùa Thường Niên')).toBeInTheDocument()
  })

  it('imports an .ics calendar and refuses other files', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(empty)
    const importCalendar = vi.spyOn(daysApi, 'importLiturgicalCalendar').mockResolvedValue(365)
    const { container } = renderPage(<ProgramCalendarPage />, '/priest/calendar')

    expect(await screen.findByText(/Chưa có ngày phụng vụ cho ngày này/)).toBeInTheDocument()
    // rc-upload mounts a fresh input after each pick, so it is looked up each time.
    const fileInput = () => container.querySelector('input[type=file]') as HTMLInputElement
    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'lich.pdf')] } })
    expect(await screen.findByText('Chỉ nhận file lịch .ics.')).toBeInTheDocument()
    expect(importCalendar).not.toHaveBeenCalled()

    const ics = new File(['BEGIN:VCALENDAR'], 'lich-2026.ics')
    fireEvent.change(fileInput(), { target: { files: [ics] } })
    await waitFor(() => expect(importCalendar).toHaveBeenCalledWith(ics))
    expect(await screen.findByText('Đã nhập 365 ngày phụng vụ mới.')).toBeInTheDocument()
  })
})
