import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import type { LiturgicalEvent } from '../types'
import { PriestProgramListPage } from './PriestProgramListPage'

const event = (id: string, title: string, status: LiturgicalEvent['status']): LiturgicalEvent => ({
  id,
  date: '2026-10-04',
  time: '07:00',
  title,
  locationId: 'loc-1',
  locationName: 'Nhà thờ chính',
  status,
})

const page = (items: LiturgicalEvent[]): PagedList<LiturgicalEvent> => ({
  items,
  pageNumber: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: items.length ? 1 : 0,
})

const events = [event('e1', 'Lễ Chúa Nhật', 'published'), event('e2', 'Lễ Bổn mạng', 'draft')]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestProgramListPage', () => {
  it('shows a recoverable error when the events cannot be loaded', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách chương trình' })).toBeInTheDocument()
  })

  it('shows the empty state with a create action', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(page([]))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByRole('heading', { name: 'Chưa có chương trình phụng vụ nào' })).toBeInTheDocument()
  })

  it('lists one page of events with place, time and status, and opens one', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(page(events))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByText('Lễ Chúa Nhật')).toBeInTheDocument()
    expect(screen.getByText('Bản nháp')).toBeInTheDocument()
    expect(screen.getAllByText('04/10/2026 · 07:00')).toHaveLength(2)
    expect(screen.getByText('2 sự kiện')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết Lễ Bổn mạng ngày 04/10/2026' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/e2')
  })

  it('filters by status on the server and distinguishes no results', async () => {
    const list = vi
      .spyOn(eventsApi, 'listEvents')
      .mockImplementation(async (filters) => page(filters.status ? [] : events))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Lọc theo trạng thái' }))
    fireEvent.click(await screen.findByTitle('Đã hủy'))

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'cancelled' }),
        expect.objectContaining({ pageNumber: 1, pageSize: 20 }),
      ),
    )
  })
})
