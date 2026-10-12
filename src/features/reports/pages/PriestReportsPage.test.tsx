import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as reportsApi from '../api/reportsApi'
import { PriestReportsPage } from './PriestReportsPage'

afterEach(() => {
  vi.restoreAllMocks()
})

const empty = { items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 }

describe('PriestReportsPage', () => {
  it('offers the two reports the backend has for the Priest', async () => {
    vi.spyOn(reportsApi, 'getReport').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<PriestReportsPage />, '/priest/reports')

    expect(screen.getByRole('tab', { name: 'Lịch sử phục vụ' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Sử dụng bài hát' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Tình trạng chuẩn bị' })).toBeNull()
    expect(await screen.findByRole('heading', { name: 'Không thể tải báo cáo' })).toBeInTheDocument()
  })

  it('shows the empty state when there is no data and no filter', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    renderPage(<PriestReportsPage />, '/priest/reports')

    expect(await screen.findByRole('heading', { name: 'Chưa có lịch sử phục vụ' })).toBeInTheDocument()
  })

  it('reads the service history of the backend and opens an event from it', async () => {
    const history = {
      ...empty,
      totalCount: 1,
      totalPages: 1,
      items: [
        {
          eventId: 'e1',
          eventDate: '2026-09-20',
          time: '08:00:00',
          title: 'Lễ Chúa Nhật XXV',
          liturgicalSeasonName: 'Mùa Thường Niên',
          locationName: 'Nhà thờ chính',
          songCount: 6,
          membersServed: 18,
          participationConfirmed: 20,
          participationDeclined: 2,
          rehearsalsHeld: 3,
          attendancePresent: 51,
        },
      ],
    }
    // The season lookup goes through apiRequest too.
    const request = vi
      .spyOn(client, 'apiRequest')
      .mockImplementation(async (path: string) => (path.startsWith('/api/reports/') ? history : []))
    renderPage(<PriestReportsPage />, '/priest/reports', '/priest/reports?month=2026-09&seasonId=s5')

    expect(await screen.findByText('Lễ Chúa Nhật XXV')).toBeInTheDocument()
    expect(screen.getByText('20/09/2026 08:00')).toBeInTheDocument()
    expect(screen.getByText('51')).toBeInTheDocument()
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        '/api/reports/service-history?liturgicalSeasonId=s5&fromDate=2026-09-01&toDate=2026-09-30&pageNumber=1&pageSize=20',
      ),
    )

    // The event is part of the button name, as every row has one.
    fireEvent.click(screen.getByRole('button', { name: 'Xem chương trình Lễ Chúa Nhật XXV' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/e1')
  })

  it('restores the report and filters from the address and tells no results from no data', async () => {
    const getReport = vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    renderPage(<PriestReportsPage />, '/priest/reports', '/priest/reports?kind=songUsage&seasonId=s5')

    expect(await screen.findByRole('tab', { name: 'Sử dụng bài hát', selected: true })).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledWith('songUsage', { seasonId: 's5' }, { pageNumber: 1, pageSize: 20 })
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
  })
})
