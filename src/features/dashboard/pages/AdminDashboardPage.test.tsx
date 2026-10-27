import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as activityLogApi from '@/features/activity-log/api/activityLogApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { AdminDashboardPage } from './AdminDashboardPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminDashboardPage', () => {
  it('shows a recoverable error when the activity section fails', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<AdminDashboardPage />, '/admin')

    expect(await screen.findByRole('heading', { name: 'Không thể tải hoạt động gần đây' })).toBeInTheDocument()
  })

  it('asks the server for the latest ten activities', async () => {
    const list = vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue({
      items: [
        { id: 'l1', createdAt: '2026-10-11T02:00:00Z', user: { id: 'u1', fullName: 'Lm. Gioan' }, action: 'Updated', entityType: 'SongList' },
      ],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 9,
      totalPages: 2,
    })
    renderPage(<AdminDashboardPage />, '/admin')

    expect(await screen.findByText('Lm. Gioan')).toBeInTheDocument()
    expect(screen.getByText('Danh sách bài hát')).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith({}, { pageNumber: 1, pageSize: 10 })
  })
})
