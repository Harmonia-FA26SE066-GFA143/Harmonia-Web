import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as eventsApi from '@/features/liturgical-programs/api/eventsApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { PriestDashboardPage } from './PriestDashboardPage'

const emptyPage = { items: [], pageNumber: 1, pageSize: 5, totalCount: 0, totalPages: 0 }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestDashboardPage', () => {
  it('loads each section on its own: song lists still have no API', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(emptyPage)
    renderPage(<PriestDashboardPage />, '/priest')

    expect(await screen.findByRole('heading', { name: 'Chưa có sự kiện sắp tới' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách bài hát chờ xem xét' })).toBeInTheDocument()
  })

  it('shows a recoverable error when the events cannot be loaded', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockRejectedValue(new ApiError(403, undefined))
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([])
    renderPage(<PriestDashboardPage />, '/priest')

    expect(await screen.findByRole('heading', { name: 'Không thể tải sự kiện sắp tới' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Không có danh sách bài hát nào chờ xem xét' })).toBeInTheDocument()
  })

  it('counts upcoming events and song lists waiting for review', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue({
      ...emptyPage,
      totalCount: 7,
      totalPages: 2,
      items: [
        {
          id: 'e1',
          date: '2099-10-04',
          time: '07:00',
          title: 'Lễ Chúa Nhật tới',
          locationId: 'loc-1',
          locationName: 'Nhà thờ chính',
          status: 'published',
        },
      ],
    })
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([
      { id: 'p1', eventName: 'Lễ Bổn mạng', date: '2099-10-11', songListStatus: 'submitted' },
      { id: 'p2', eventName: 'Lễ Chúa Nhật', date: '2099-10-04' },
    ])
    renderPage(<PriestDashboardPage />, '/priest')

    expect(await screen.findByText('Lễ Chúa Nhật tới')).toBeInTheDocument()
    expect(screen.getByText('Sự kiện sắp tới', { selector: 'span' }).closest('.ant-card')).toHaveTextContent('7')
    expect(screen.getByText('Danh sách bài hát chờ xem xét').closest('.ant-card')).toHaveTextContent('1')

    fireEvent.click(screen.getByRole('button', { name: 'Xem danh sách bài hát' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/p1/song-review')
  })
})
