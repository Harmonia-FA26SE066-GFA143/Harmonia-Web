import { fireEvent, screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import { ProgramCalendarPage } from './ProgramCalendarPage'

const empty = { items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 }

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
})
