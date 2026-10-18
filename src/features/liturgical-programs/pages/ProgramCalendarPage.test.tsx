import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import * as daysApi from '../api/liturgicalDaysApi'
import { celebrationNameVi } from '../celebrationNames'
import { ProgramCalendarPage } from './ProgramCalendarPage'

const empty = { items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 }

beforeEach(() => {
  vi.spyOn(daysApi, 'listLiturgicalDays').mockResolvedValue([])
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

  it('loads the liturgical days of the month once and describes the selected date in Vietnamese', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(empty)
    vi.mocked(daysApi.listLiturgicalDays).mockRestore()
    const today = dayjs()
    // The backend keeps the English names of the Liturgical Calendar API.
    const request = vi.spyOn(client, 'apiRequest').mockImplementation(async (path: string) =>
      path.startsWith('/api/liturgical-days')
        ? [{ date: today.format('YYYY-MM-DD'), celebrationName: '29th Sunday of Ordinary Time', rank: 'Solemnity', seasonName: 'OrdinaryTime' }]
        : [],
    )
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    // Named in its calendar cell on wide screens and in the day panel.
    expect((await screen.findAllByText('Chúa nhật XXIX Thường niên')).length).toBeGreaterThan(0)
    const dayRequests = request.mock.calls.filter(([path]) => path.startsWith('/api/liturgical-days'))
    expect(dayRequests).toEqual([
      [`/api/liturgical-days?fromDate=${today.startOf('month').format('YYYY-MM-DD')}&toDate=${today.endOf('month').format('YYYY-MM-DD')}`],
    ])
    expect(screen.getByText('Lễ trọng')).toBeInTheDocument()
    expect(screen.getByText('Mùa Thường Niên')).toBeInTheDocument()
    // Saints come from the table, weekdays from a pattern; a name in neither stays in English.
    expect(celebrationNameVi('Saint Luke, Evangelist')).toBe('Thánh Luca, Thánh sử')
    expect(celebrationNameVi('Tuesday of the 34th Week of Ordinary Time')).toBe('Thứ Ba tuần XXXIV Thường niên')
    expect(celebrationNameVi('Saint Newly Canonized')).toBe('Saint Newly Canonized')
  })

  it('syncs the year on view after asking, since the backend overwrites it', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(empty)
    const sync = vi.spyOn(daysApi, 'syncLiturgicalDays').mockResolvedValue(365)
    renderPage(<ProgramCalendarPage />, '/priest/calendar', '/priest/calendar?date=2027-03-10')

    expect(await screen.findByText(/Đồng bộ lịch phụng vụ của năm để hiển thị/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Đồng bộ lịch phụng vụ 2027/ }))
    // Ant Design renders a confirm title twice; the first one sits in the visible dialog.
    const dialog = (await screen.findAllByText('Đồng bộ lịch phụng vụ năm 2027?'))[0].closest('.ant-modal') as HTMLElement
    expect(within(dialog).getByText(/ghi đè các ngày phụng vụ đã có của năm này/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đồng bộ' }))

    await waitFor(() => expect(sync).toHaveBeenCalledWith(2027))
    expect(await screen.findByText('Đã đồng bộ 365 ngày phụng vụ năm 2027.')).toBeInTheDocument()
  })

  it('explains when the external calendar cannot be reached', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(empty)
    vi.spyOn(daysApi, 'syncLiturgicalDays').mockRejectedValue(new ApiError(502, { code: 'EXTERNAL_CALENDAR_FAILED' }))
    renderPage(<ProgramCalendarPage />, '/priest/calendar')

    fireEvent.click(await screen.findByRole('button', { name: /Đồng bộ lịch phụng vụ/ }))
    const dialog = (await screen.findAllByText(/Đồng bộ lịch phụng vụ năm \d{4}\?/))[0].closest('.ant-modal') as HTMLElement
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đồng bộ' }))

    expect(await screen.findByText('Không lấy được lịch từ Liturgical Calendar API. Vui lòng thử lại sau.')).toBeInTheDocument()
  })
})
