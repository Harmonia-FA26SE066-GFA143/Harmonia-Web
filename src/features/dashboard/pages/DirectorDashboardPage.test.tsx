import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import * as eventsApi from '@/features/liturgical-programs/api/eventsApi'
import * as liturgicalDaysApi from '@/features/liturgical-programs/api/liturgicalDaysApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as practiceApi from '@/features/practice/api/practiceApi'
import * as rehearsalsApi from '@/features/rehearsals/api/rehearsalsApi'
import * as memberSkillsApi from '@/features/skill-approval/api/memberSkillsApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import { ApiError } from '@/lib/api/errors'
import { vietnamToday } from '@/lib/api/dates'
import { PRACTICE_ROOM_ACTION } from '@/shared/ui'
import { programPage } from '@/test/programs'
import { renderPage } from '@/test/renderPage'
import { DirectorDashboardPage } from './DirectorDashboardPage'

const emptyPage = { items: [], pageNumber: 1, pageSize: 5, totalCount: 0, totalPages: 0 }
type Status = Awaited<ReturnType<typeof eventsApi.getPreparationStatus>>

/** Counts of `EventPreparationStatusDto` (Harmonia-BE EventPreparationStatusDto.cs) for the next Mass. */
const status = (fields: Partial<Status> = {}): Status => ({
  songListDueDate: '2099-10-25',
  isSongListOverdue: true,
  participation: { invited: 2, confirmed: 5, declined: 1, unsure: 1 },
  rosterFinalized: false,
  rosterActiveAssignments: 6,
  rosterShortages: [{ skillName: 'Bè Tenor', requiredCount: 2, assignedCount: 1, songTitle: 'Kinh Hòa Bình' }],
  rehearsalsTotal: 3,
  rehearsalsHeld: 1,
  attendanceExpected: 24,
  attendancePresent: 20,
  practiceExpected: 30,
  practicePassed: 12,
  practiceOverdue: 4,
  ...fields,
})

const counts = (skills = 4, submissions = 7) => {
  vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue({ ...emptyPage, totalCount: skills })
  vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue({ ...emptyPage, totalCount: submissions })
}

/** One next Mass (p1) and one after it (p2). */
const nextMass = (songListStatus: 'needsRevision' | 'approved' = 'needsRevision') => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(
    programPage(
      { id: 'p1', eventName: 'Lễ Chúa Nhật XXXIII', date: '2099-11-01', songListStatus, songListDueDate: '2099-10-25', isSongListOverdue: songListStatus !== 'approved' },
      { id: 'p2', eventName: 'Lễ Thánh Giuse', date: '2099-11-09', songListStatus: 'approved' },
    ),
  )
  vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({ id: 'l1', eventId: 'p1', version: 1, status: songListStatus, items: [], reviews: [] })
}

const timeline = async () => {
  const next = await screen.findByRole('region', { name: 'Lễ Chúa Nhật XXXIII' })
  return { next: within(next), steps: within(within(next).getByRole('list', { name: 'Các mục chuẩn bị' })) }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DirectorDashboardPage', () => {
  it('lists at most five tasks, each with its verb, deadline and button, and folds the rest', async () => {
    counts()
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(
      programPage(
        { id: 'p1', eventName: 'Lễ Chúa Nhật XX', date: '2026-10-18', songListStatus: 'needsRevision' },
        { id: 'p2', eventName: 'Lễ Bổn mạng', date: '2026-10-25', specialRequirements: 'Rước kiệu', songListDueDate: '2026-10-20' },
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
    expect(tasks.getByText('Hạn gửi 20/10/2026')).toBeInTheDocument()
    expect(tasks.getByText(/Lễ cử hành 25\/10\/2026/)).toBeInTheDocument()
    expect(await tasks.findByText('Duyệt 4 kỹ năng ca viên đã khai')).toBeInTheDocument()
    expect(tasks.getByRole('link', { name: 'Duyệt kỹ năng' })).toHaveAttribute('href', '/director/skill-approval')
    expect(tasks.getByText('Chấm 7 bản thu bài tập')).toBeInTheDocument()
    expect(tasks.getByRole('link', { name: 'Chấm bài' })).toHaveAttribute('href', '/director/practice')
    // Skills and recordings come first, then three of the four song lists; the fourth folds into the last line.
    expect(tasks.queryByRole('link', { name: 'Chúa Nhật I Mùa Vọng' })).toBeNull()
    expect(tasks.getByRole('link', { name: /và 1 việc khác/ })).toHaveAttribute('href', '/director/programs')

    fireEvent.click(tasks.getByRole('button', { name: 'Đề xuất danh sách bài hát: Lễ Bổn mạng' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p2/song-list')
  })

  it('shows the five preparation steps of the next Mass, each with its counts and the page where it is done', async () => {
    counts(0, 7)
    nextMass()
    vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue(status())
    renderPage(<DirectorDashboardPage />, '/director')

    const { next, steps } = await timeline()
    expect(next.getByRole('heading', { name: /đã sẵn sàng chưa\?/ })).toBeInTheDocument()
    expect(await steps.findByText('5/9 đã nhận lời')).toBeInTheDocument()

    // 1. Song list sent back by the Priest, past its due date.
    expect(steps.getByRole('link', { name: 'Danh sách bài hát & Cha xứ duyệt' })).toHaveAttribute('href', '/director/programs/p1/song-list')
    expect(steps.getByText('Yêu cầu chỉnh sửa')).toBeInTheDocument()
    expect(steps.getByText('Quá hạn gửi 25/10/2099')).toBeInTheDocument()
    // 2. Participation, with who has not said yes.
    expect(steps.getByRole('link', { name: 'Xác nhận tham gia' })).toHaveAttribute('href', '/director/participation?programId=p1')
    expect(steps.getByText('1 từ chối · 1 chưa chắc chắn · 2 chưa trả lời')).toBeInTheDocument()
    // 3. Roster, with each place still open.
    expect(steps.getByRole('link', { name: 'Phân công phục vụ' })).toHaveAttribute('href', '/director/roster?programId=p1')
    expect(steps.getByText('Thiếu 1 vị trí')).toBeInTheDocument()
    expect(steps.getByText('6 lượt đã phân công')).toBeInTheDocument()
    expect(steps.getByRole('list', { name: 'Vị trí còn thiếu' })).toHaveTextContent('Thiếu 1 Nam cao · Kinh Hòa Bình')
    // 4. Rehearsals and attendance.
    expect(steps.getByRole('link', { name: 'Buổi tập & Điểm danh' })).toHaveAttribute('href', '/director/rehearsals?programId=p1')
    expect(steps.getByText('1/3 buổi đã tập')).toBeInTheDocument()
    expect(steps.getByText('Điểm danh: 20/24 lượt có mặt')).toBeInTheDocument()
    expect(steps.getByRole('link', { name: 'Điểm danh' })).toHaveAttribute('href', '/director/attendance?programId=p1')
    // 5. Practice progress for this Mass, and the review queue of every program.
    expect(steps.getByRole('link', { name: 'Bài tập luyện tập' })).toHaveAttribute('href', '/director/practice?programId=p1')
    expect(steps.getByText('12/30 lượt đạt')).toBeInTheDocument()
    expect(steps.getByText('4 lượt quá hạn nộp')).toBeInTheDocument()
    expect(await steps.findByRole('link', { name: '7 bản thu chờ chấm' })).toHaveAttribute('href', '/director/practice')

    expect(next.getByRole('link', { name: /Xem chương trình/ })).toHaveAttribute('href', '/director/programs/p1')
    expect(screen.getByRole('link', { name: /Lễ Thánh Giuse/ })).toHaveAttribute('href', '/director/programs/p2')

    // The one primary is the step waiting on the Director: the list the Priest sent back.
    fireEvent.click(next.getByRole('link', { name: 'Sửa danh sách bài hát' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p1/song-list')
  })

  it('leads the primary to the roster when an approved list leaves a place open', async () => {
    counts(0, 0)
    nextMass('approved')
    vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue(status({ isSongListOverdue: false }))
    renderPage(<DirectorDashboardPage />, '/director')

    const { next, steps } = await timeline()
    expect(await steps.findByText('Đã duyệt')).toBeInTheDocument()
    expect(await next.findByRole('link', { name: 'Mở phân công' })).toHaveAttribute('href', '/director/roster?programId=p1')
    // An approved list has no due date to chase.
    expect(steps.queryByText(/Hạn gửi|Quá hạn gửi/)).toBeNull()
  })

  it('says the Mass is ready when every step is done', async () => {
    counts(0, 0)
    nextMass('approved')
    vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue(
      status({
        isSongListOverdue: false,
        participation: { invited: 0, confirmed: 5, declined: 1, unsure: 0 },
        rosterFinalized: true,
        rosterShortages: [],
        rehearsalsHeld: 3,
        practicePassed: 30,
        practiceOverdue: 0,
      }),
    )
    renderPage(<DirectorDashboardPage />, '/director')

    const { next, steps } = await timeline()
    expect(await next.findByText('Đã đủ mọi mục cho Thánh lễ này.')).toBeInTheDocument()
    expect(steps.getByText('Đã chốt')).toBeInTheDocument()
    expect(steps.getByText('30/30 lượt đạt')).toBeInTheDocument()
    expect(next.queryByRole('list', { name: 'Vị trí còn thiếu' })).toBeNull()
  })

  it('keeps the program and its song list while the preparation status loads, without inventing counts', async () => {
    counts(0, 0)
    nextMass()
    vi.spyOn(eventsApi, 'getPreparationStatus').mockReturnValue(new Promise<Status>(() => {}))
    renderPage(<DirectorDashboardPage />, '/director')

    const { next, steps } = await timeline()
    expect(next.getByRole('list', { name: 'Các mục chuẩn bị' })).toHaveAttribute('aria-busy', 'true')
    expect(steps.getByText('Yêu cầu chỉnh sửa')).toBeInTheDocument()
    expect(steps.getAllByText('Đang tải…')).toHaveLength(4)
    expect(steps.queryByText(/\b0\/\d|^0 /)).toBeNull()
    // Only the known step may become the primary.
    expect(next.getByRole('link', { name: 'Sửa danh sách bài hát' })).toBeInTheDocument()
    expect(next.queryByRole('link', { name: 'Mở xác nhận tham gia' })).toBeNull()
    expect(next.queryByText('Đã đủ mọi mục cho Thánh lễ này.')).toBeNull()
  })

  it('offers a retry when the preparation status fails, and marks the unknown counts with a dash', async () => {
    counts(0, 0)
    nextMass('approved')
    const prep = vi.spyOn(eventsApi, 'getPreparationStatus').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<DirectorDashboardPage />, '/director')

    const { next, steps } = await timeline()
    expect(await next.findByRole('heading', { name: 'Không thể tải tình hình chuẩn bị' })).toBeInTheDocument()
    expect(steps.getAllByText('—')).toHaveLength(4)
    expect(steps.getByText('Đã duyệt')).toBeInTheDocument()
    // Nothing known is open, yet nothing claims the Mass is ready.
    expect(next.queryByText('Đã đủ mọi mục cho Thánh lễ này.')).toBeNull()

    const calls = prep.mock.calls.length
    fireEvent.click(next.getByRole('button', { name: /Thử lại/ }))
    await waitFor(() => expect(prep.mock.calls.length).toBeGreaterThan(calls))
  })

  it('shows this week’s rehearsals with the way into today’s practice room', async () => {
    counts(0, 0)
    nextMass()
    vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue(status())
    const today = vietnamToday()
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue({
      items: [
        {
          id: 'r1',
          eventId: 'p1',
          locationName: 'Phòng Thánh nhạc',
          startAt: `${today}T05:00:00Z`,
          endAt: `${today}T07:00:00Z`,
          songs: [{ songId: 's1', songTitle: 'Kinh Hòa Bình' }],
        },
      ],
      pageNumber: 1,
      pageSize: 100,
      totalCount: 1,
      totalPages: 1,
    })
    renderPage(<DirectorDashboardPage />, '/director')

    const week = within(await screen.findByRole('region', { name: 'Buổi tập tuần này' }))
    expect(await week.findByRole('link', { name: /Hôm nay/ })).toHaveAttribute('href', '/director/rehearsals/r1')
    expect(week.getByText('Phòng Thánh nhạc · Kinh Hòa Bình')).toBeInTheDocument()
    expect(week.getByRole('link', { name: 'Lịch tập' })).toHaveAttribute('href', '/director/rehearsals')

    fireEvent.click(week.getByRole('link', { name: PRACTICE_ROOM_ACTION }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/rehearsals/r1')
  })

  it('confirms when nothing waits, and shows the season of today', async () => {
    counts(0, 0)
    const today = dayjs().format('YYYY-MM-DD')
    vi.spyOn(liturgicalDaysApi, 'listLiturgicalDays').mockResolvedValue([
      { date: today, celebrationName: 'Chúa Nhật Thứ Ba Mùa Vọng', seasonKey: 'Advent', seasonName: 'Mùa Vọng' },
    ])
    nextMass('approved')
    vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue(status({ isSongListOverdue: false }))
    renderPage(<DirectorDashboardPage />, '/director')

    expect(await screen.findByText('Bạn đã xử lý hết. Không còn việc nào đang chờ.')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Mùa phụng vụ hôm nay' })).toHaveTextContent('Mùa Vọng')
    expect(screen.getByText('Không có bản thu nào chờ chấm.')).toBeInTheDocument()
  })

  it('shows skeletons, not empty copy, while the programs load', () => {
    counts(0, 0)
    vi.spyOn(programsApi, 'listPrograms').mockReturnValue(new Promise<ReturnType<typeof programPage>>(() => {}))
    renderPage(<DirectorDashboardPage />, '/director')

    expect(screen.getByLabelText('Đang tải Thánh lễ kế tiếp')).toBeInTheDocument()
    expect(screen.getByLabelText('Đang tải việc cần xử lý')).toBeInTheDocument()
    expect(screen.queryByText('Chưa có Thánh lễ nào được công bố sắp tới')).toBeNull()
    expect(screen.queryByText('Bạn đã xử lý hết. Không còn việc nào đang chờ.')).toBeNull()
  })

  it('offers only what the Director can do when no Mass is published, never creating a program', async () => {
    counts(0, 0)
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage())
    renderPage(<DirectorDashboardPage />, '/director')

    expect(await screen.findByRole('heading', { name: 'Chưa có Thánh lễ nào được công bố sắp tới' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem chương trình phụng vụ' })).toHaveAttribute('href', '/director/programs')
    expect(screen.getByRole('link', { name: 'Mở kho bài hát' })).toHaveAttribute('href', '/director/library')
    // POST /api/liturgical-events is ParishPriest only (LiturgicalEventsController.cs:38-39).
    expect(screen.queryByText(/Tạo chương trình/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Tạo/ })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Các mục chuẩn bị' })).toBeNull()
  })

  it('shows a recoverable error when the programs cannot be loaded', async () => {
    counts()
    vi.spyOn(programsApi, 'listPrograms').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<DirectorDashboardPage />, '/director')

    expect(await screen.findByRole('heading', { name: 'Không thể tải chương trình sắp tới' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Không thể tải Thánh lễ kế tiếp' })).toBeInTheDocument()
    // The skill and recording counts do not depend on the programs.
    expect(await screen.findByText('Duyệt 4 kỹ năng ca viên đã khai')).toBeInTheDocument()
  })
})
