import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import * as eventsApi from '@/features/liturgical-programs/api/eventsApi'
import * as liturgicalDaysApi from '@/features/liturgical-programs/api/liturgicalDaysApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as practiceApi from '@/features/practice/api/practiceApi'
import * as rehearsalsApi from '@/features/rehearsals/api/rehearsalsApi'
import * as rosterApi from '@/features/roster/api/rosterApi'
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
  const counts = (skills = 4, submissions = 7) => {
    vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue({ ...emptyPage, totalCount: skills })
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue({ ...emptyPage, totalCount: submissions })
  }

  it('lists at most five tasks, each with its verb, deadline and button, and folds the rest', async () => {
    counts()
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(
      programPage(
        { id: 'p1', eventName: 'Lễ Chúa Nhật XX', date: '2026-10-18', songListStatus: 'needsRevision' },
        { id: 'p2', eventName: 'Lễ Bổn mạng', date: '2026-10-25', specialRequirements: 'Rước kiệu' },
        { id: 'p3', eventName: 'Lễ Các Đẳng', date: '2026-11-02', songListStatus: 'approved' },
        { id: 'p4', eventName: 'Lễ Chúa Kitô Vua', date: '2026-11-22' },
        { id: 'p5', eventName: 'Chúa Nhật I Mùa Vọng', date: '2026-11-29', songListStatus: 'draft' },
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

    const tasks = within(await screen.findByRole('region', { name: 'Cần bạn xử lý' }))
    expect(await tasks.findByText('Cha xứ: “Đổi bài Hiệp lễ.”')).toBeInTheDocument()
    expect(tasks.getByText('Yêu cầu: Rước kiệu')).toBeInTheDocument()
    expect(tasks.getByText('Lễ cử hành 25/10/2026')).toBeInTheDocument()
    expect(await tasks.findByText('Duyệt 4 kỹ năng ca viên đã khai')).toBeInTheDocument()
    expect(tasks.getByRole('link', { name: 'Duyệt kỹ năng' })).toHaveAttribute('href', '/director/skill-approval')
    expect(tasks.getByText('Chấm 7 bản thu bài tập')).toBeInTheDocument()
    expect(tasks.getByRole('link', { name: 'Chấm bài' })).toHaveAttribute('href', '/director/practice')
    // Skills and recordings come first, then three of the four song lists; the fourth folds into the last line.
    expect(tasks.queryByRole('link', { name: 'Chúa Nhật I Mùa Vọng' })).toBeNull()
    expect(tasks.getByRole('link', { name: /và 1 việc khác/ })).toBeInTheDocument()

    fireEvent.click(tasks.getByRole('button', { name: 'Đề xuất danh sách bài hát: Lễ Bổn mạng' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p2/song-list')
  })

  it('confirms when nothing waits, and shows the season, the next program and its missing parts', async () => {
    counts(0, 0)
    const today = dayjs().format('YYYY-MM-DD')
    vi.spyOn(liturgicalDaysApi, 'listLiturgicalDays').mockResolvedValue([
      { date: today, celebrationName: 'Chúa Nhật Thứ Ba Mùa Vọng', seasonKey: 'Advent', seasonName: 'Mùa Vọng' },
    ])
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValueOnce(
      programPage(
        { id: 'p3', eventName: 'Lễ Các Đẳng', date: '2099-11-02', songListStatus: 'submitted' },
        { id: 'p4', eventName: 'Lễ Thánh Giuse', date: '2099-11-09', songListStatus: 'approved' },
      ),
    )
    const member = { rehearsalsHeld: 1, rehearsalsAttended: 1, assignmentsTotal: 0, assignmentsPassed: 0, assignmentsOverdue: 0 }
    vi.spyOn(practiceApi, 'listPreparationProgress').mockResolvedValue([
      { ...member, memberId: 'm1', fullName: 'An', participationStatus: 'confirmed' },
      { ...member, memberId: 'm2', fullName: 'Bình', participationStatus: 'invited' },
    ])
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue({ ...emptyPage, totalCount: 2 })
    vi.spyOn(rosterApi, 'getRoster').mockResolvedValue(null)
    vi.spyOn(rosterApi, 'getShortages').mockResolvedValue([
      { songListItemId: null, songTitle: null, skillId: 's1', skillName: 'Bè Alto', requiredCount: 3, assignedCount: 1 },
    ])
    renderPage(<DirectorDashboardPage />, '/director')

    expect(await screen.findByText('Mọi việc đã xong. Không có việc nào đang chờ bạn.')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Mùa phụng vụ hôm nay' })).toHaveTextContent('Mùa Vọng')
    expect(screen.getByRole('heading', { name: 'Lễ Các Đẳng' })).toBeInTheDocument()
    // Numbered steps, the current one in words; each step states its value.
    expect(await screen.findByText('1/2 đã nhận lời')).toBeInTheDocument()
    expect(screen.getByText(/Bước 2\/6/)).toBeInTheDocument()
    expect(screen.getByText('1/2 buổi đã tập')).toBeInTheDocument()
    expect(screen.getByText('Chưa lập')).toBeInTheDocument()
    // A missing part is a dashed "Thiếu N" box.
    expect(screen.getByText('Thiếu 2')).toBeInTheDocument()
    expect(screen.getByText('Bè Alto')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mở phân công' })).toHaveAttribute('href', '/director/roster?programId=p3')
    expect(screen.getByText('Không có bản thu nào chờ chấm.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lễ Thánh Giuse' })).toHaveAttribute('href', '/director/programs/p4')
    // The season banner carries the view's one ribbon.
    expect(screen.queryByTestId('step-bookmark')).toBeNull()
  })

  it('shows a recoverable error when the programs cannot be loaded', async () => {
    counts()
    vi.spyOn(programsApi, 'listPrograms').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<DirectorDashboardPage />, '/director')

    expect(await screen.findByRole('heading', { name: 'Không thể tải chương trình sắp tới' })).toBeInTheDocument()
  })
})
