import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as eventsApi from '@/features/liturgical-programs/api/eventsApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as practiceApi from '@/features/practice/api/practiceApi'
import * as memberSkillsApi from '@/features/skill-approval/api/memberSkillsApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import * as reviewApi from '@/features/song-list-review/api/songListReviewApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { programPage } from '@/test/programs'
import { renderPage } from '@/test/renderPage'
import { DirectorDashboardPage } from './DirectorDashboardPage'
import { PriestDashboardPage } from './PriestDashboardPage'

const emptyPage = { items: [], pageNumber: 1, pageSize: 5, totalCount: 0, totalPages: 0 }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestDashboardPage', () => {
  it('loads each section on its own', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(emptyPage)
    vi.spyOn(reviewApi, 'listPendingSongLists').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<PriestDashboardPage />, '/priest')

    expect(await screen.findByRole('heading', { name: 'Chưa có sự kiện sắp tới' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách bài hát chờ xem xét' })).toBeInTheDocument()
  })

  it('shows a recoverable error when the events cannot be loaded', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockRejectedValue(new ApiError(403, undefined))
    vi.spyOn(reviewApi, 'listPendingSongLists').mockResolvedValue([])
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
    vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([])
    vi.spyOn(reviewApi, 'listPendingSongLists').mockResolvedValue([
      { id: 'sl-1', eventId: 'p1', version: 1, status: 'submitted', submittedAt: '2026-10-09T02:00:00Z', items: [], reviews: [] },
    ])
    vi.spyOn(eventsApi, 'getEvent').mockResolvedValue({
      id: 'p1',
      date: '2099-10-11',
      time: '08:00',
      title: 'Lễ Bổn mạng',
      locationId: 'loc-1',
      locationName: 'Nhà thờ chính',
      status: 'published',
    })
    renderPage(<PriestDashboardPage />, '/priest')

    expect(await screen.findByText('Lễ Chúa Nhật tới')).toBeInTheDocument()
    expect(screen.getByText('Sự kiện sắp tới', { selector: 'dt' }).closest('.ant-card')).toHaveTextContent('7')
    expect(screen.getByText('Danh sách bài hát chờ xem xét').closest('.ant-card')).toHaveTextContent('1')

    expect(await screen.findByText('Lễ Bổn mạng · 11/10/2099')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem danh sách bài hát: Lễ Bổn mạng · 11/10/2099' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/p1/song-review')
  })
})

describe('DirectorDashboardPage', () => {
  const counts = () => {
    vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue({ ...emptyPage, totalCount: 4 })
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue({ ...emptyPage, totalCount: 7 })
  }

  it('lists the programs whose song list waits on the Director, with the Priest note', async () => {
    counts()
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(
      programPage(
        { id: 'p1', eventName: 'Lễ Chúa Nhật XX', date: '2026-10-18', songListStatus: 'needsRevision' },
        { id: 'p2', eventName: 'Lễ Bổn mạng', date: '2026-10-25', specialRequirements: 'Rước kiệu' },
        { id: 'p3', eventName: 'Lễ Các Đẳng', date: '2026-11-02', songListStatus: 'approved' },
      ),
    )
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({
      id: 'l1',
      eventId: 'p1',
      version: 1,
      status: 'needsRevision',
      items: [],
      reviews: [{ decision: 'requestRevision', notes: 'Đổi bài Hiệp lễ.', reviewedAt: '2026-10-15T02:00:00Z' }],
    })
    renderPage(<DirectorDashboardPage />, '/director')

    expect(await screen.findByText('Cần chỉnh sửa danh sách bài hát')).toBeInTheDocument()
    expect(await screen.findByText('“Đổi bài Hiệp lễ.”')).toBeInTheDocument()
    expect(screen.getByText('Chưa đề xuất bài hát')).toBeInTheDocument()
    expect(screen.getByText('Rước kiệu')).toBeInTheDocument()
    // Counts from the backend totals.
    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    // The pending counts lead to the pages where they are handled.
    expect(screen.getByRole('link', { name: /^Kỹ năng chờ duyệt: \d+\. Xem$/ })).toHaveAttribute('href', '/director/skill-approval')
    expect(screen.getByRole('link', { name: /^Bản thu chờ chấm: \d+\. Xem$/ })).toHaveAttribute('href', '/director/practice')

    fireEvent.click(screen.getByRole('button', { name: 'Đề xuất danh sách bài hát: Lễ Bổn mạng' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p2/song-list')
  })

  it('says when nothing waits, and shows a recoverable error per section', async () => {
    counts()
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValueOnce(
      programPage({ id: 'p3', eventName: 'Lễ Các Đẳng', date: '2026-11-02', songListStatus: 'submitted' }),
    )
    renderPage(<DirectorDashboardPage />, '/director')
    expect(await screen.findByRole('heading', { name: 'Không có danh sách bài hát cần chuẩn bị' })).toBeInTheDocument()
    // The next program leads the page, and is the first row of the upcoming table too.
    expect(screen.getByRole('heading', { name: 'Lễ Các Đẳng' })).toBeInTheDocument()
    expect(screen.getAllByText('Lễ Các Đẳng')).toHaveLength(2)
  })

  it('shows a recoverable error when the programs cannot be loaded', async () => {
    counts()
    vi.spyOn(programsApi, 'listPrograms').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<DirectorDashboardPage />, '/director')

    expect(await screen.findAllByRole('heading', { name: 'Không thể tải chương trình sắp tới' })).toHaveLength(2)
  })
})
