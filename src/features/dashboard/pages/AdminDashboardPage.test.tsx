import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as activityLogApi from '@/features/activity-log/api/activityLogApi'
import { renderPage } from '@/test/renderPage'
import { AdminDashboardPage } from './AdminDashboardPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminDashboardPage', () => {
  it('keeps shortcuts usable while the data sections report missing APIs', async () => {
    renderPage(<AdminDashboardPage />, '/admin')

    expect(screen.getByRole('link', { name: /Danh mục phụng vụ/ })).toHaveAttribute('href', '/admin/liturgical-categories')
    expect(await screen.findByRole('heading', { name: 'Không thể tải hoạt động gần đây' })).toBeInTheDocument()
  })

  it('shows the latest five activities', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => ({
        id: `l${index}`,
        occurredAt: new Date(2026, 8, 20 - index).toISOString(),
        actorName: `Người ${index}`,
        type: 'roleChange' as const,
        target: `Đối tượng ${index}`,
      })),
    )
    renderPage(<AdminDashboardPage />, '/admin')

    expect(await screen.findByText('Đối tượng 0')).toBeInTheDocument()
    expect(screen.getByText('Đối tượng 4')).toBeInTheDocument()
    expect(screen.queryByText('Đối tượng 5')).toBeNull()
  })
})
