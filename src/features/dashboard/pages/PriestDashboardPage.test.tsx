import { fireEvent, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import { renderPage } from '@/test/renderPage'
import { PriestDashboardPage } from './PriestDashboardPage'

const inDays = (days: number) => dayjs().add(days, 'day').format('YYYY-MM-DD')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestDashboardPage', () => {
  it('shows a recoverable error while the programs API contract is missing', async () => {
    renderPage(<PriestDashboardPage />, '/priest')

    expect(await screen.findByRole('heading', { name: 'Không thể tải tổng quan' })).toBeInTheDocument()
  })

  it('shows empty sections when there are no programs', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([])
    renderPage(<PriestDashboardPage />, '/priest')

    expect(await screen.findByRole('heading', { name: 'Chưa có chương trình sắp tới' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Không có danh sách bài hát nào chờ xem xét' })).toBeInTheDocument()
  })

  it('counts upcoming programs and song lists waiting for review', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([
      { id: 'past', eventName: 'Lễ tuần trước', date: inDays(-7), songListStatus: 'submitted' },
      { id: 'next', eventName: 'Lễ Chúa Nhật tới', date: inDays(3), songListStatus: 'submitted' },
      { id: 'later', eventName: 'Lễ Bổn mạng', date: inDays(10) },
    ])
    renderPage(<PriestDashboardPage />, '/priest')

    const upcoming = await screen.findByText('Chương trình sắp tới', { selector: 'span' })
    expect(upcoming.closest('.ant-card')).toHaveTextContent('2')
    expect(screen.getByText('Danh sách bài hát chờ xem xét').closest('.ant-card')).toHaveTextContent('2')
    expect(screen.queryByRole('button', { name: 'Xem chi tiết Lễ tuần trước' })).toBeNull()

    fireEvent.click(screen.getAllByRole('button', { name: 'Xem danh sách bài hát' })[0])
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/past/song-review')
  })
})
