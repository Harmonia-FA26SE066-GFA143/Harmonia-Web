import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as membersApi from '@/features/members/api/membersApi'
import { ApiError } from '@/lib/api/errors'
import { clearSession, setSession, type ApiRoleName } from '@/lib/auth/session'
import { renderPage } from '@/test/renderPage'
import * as api from './api/nominationsApi'
import { NominationsPage } from './pages/NominationsPage'
import { nominationActions, type NominationDetail, type NominationStatus } from './types'

const asRole = (roleName: ApiRoleName, id = 'u1') =>
  setSession({ accessToken: 't', accessTokenExpiresAt: '2099-01-01T00:00:00Z', refreshToken: 'r', user: { id, email: 'a@b.c', roleName } })

const detail = (status: NominationStatus, overrides: Partial<NominationDetail> = {}): NominationDetail => ({
  id: 'n1',
  memberId: 'm1',
  memberFullName: 'An Nguyễn',
  nominatedById: 'u9',
  nominatedByFullName: 'Bình Trần',
  reason: 'Bắt nhịp tốt',
  proposedChoirId: null,
  proposedChoirName: null,
  status,
  reviewedAt: null,
  reviewNote: null,
  trainingWaiverReason: null,
  appointedChoirName: null,
  appointedAt: null,
  createdAt: '2026-11-08T08:00:00Z',
  stats: {
    firstJoinedDate: '2023-05-01', tenureMonths: 42, minTenureMonths: 24, meetsTenure: true,
    attendanceRecorded: 40, attendancePresent: 20, attendancePercent: 50, minAttendancePercent: 80, meetsAttendance: false,
    servedEventCount: 31, minServedEvents: 20, meetsServedEvents: true,
    hasConductingSkill: true, isConductingSkillRequired: true, meetsConductingSkill: true, meetsAll: false,
  },
  ...overrides,
})

function withNomination(item: NominationDetail) {
  vi.spyOn(api, 'listNominations').mockResolvedValue({ items: [item], pageNumber: 1, pageSize: 20, totalCount: 1, totalPages: 1 })
  vi.spyOn(api, 'getNomination').mockResolvedValue(item)
  vi.spyOn(api, 'listTrainings').mockResolvedValue([])
}

const open = async () => {
  renderPage(<NominationsPage area="Khu" />, '/x')
  fireEvent.click(await screen.findByRole('button', { name: 'Xem đề cử An Nguyễn' }))
  await screen.findByText('Lịch sử quyết định')
}

beforeEach(() => asRole('ParishPriest'))
afterEach(() => {
  vi.restoreAllMocks()
  clearSession()
})

describe('nominationActions', () => {
  it.each<[NominationStatus, ApiRoleName, boolean, string[]]>([
    ['Pending', 'ChoirDirector', true, ['withdraw']],
    ['Pending', 'ChoirDirector', false, []],
    ['Pending', 'ParishPriest', false, ['approve', 'reject']],
    ['Pending', 'ParishPriest', true, ['withdraw', 'approve', 'reject']],
    ['Approved', 'ParishPriest', false, ['waive', 'cancel', 'startTraining']],
    ['Approved', 'Admin', false, []],
    ['InTraining', 'ParishPriest', false, []],
    ['Trained', 'ParishPriest', false, ['startTraining']],
    ['Trained', 'Admin', false, ['appoint']],
    ['Appointed', 'Admin', false, []],
    ['Rejected', 'ParishPriest', true, []],
    ['Cancelled', 'ChoirDirector', true, []],
  ])('%s for %s (creator %s)', (status, role, creator, expected) => {
    expect(nominationActions(status, role, creator)).toEqual(expected)
  })
})

describe('NominationsPage', () => {
  it('offers the Parish Priest the decision, and warns about the record without blocking', async () => {
    withNomination(detail('Pending'))
    await open()

    expect(screen.getByRole('button', { name: 'Duyệt' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rút đề cử' })).toBeNull()
    expect(screen.getByText(/50% \(20\/40 buổi\), cần 80%/)).toHaveTextContent('Chưa đạt')
  })

  it('requires a reason to reject and shows it in the call', async () => {
    withNomination(detail('Pending'))
    const reject = vi.spyOn(api, 'rejectNomination').mockResolvedValue(detail('Rejected'))
    await open()

    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    const note = await screen.findByLabelText('Lý do từ chối')
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối đề cử' }))
    expect(await screen.findByText('Vui lòng nhập lý do.')).toBeInTheDocument()
    expect(reject).not.toHaveBeenCalled()

    fireEvent.change(note, { target: { value: ' Chưa đủ thâm niên ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối đề cử' }))
    await waitFor(() => expect(reject).toHaveBeenCalledWith('n1', 'Chưa đủ thâm niên'))
  })

  it('explains a status that changed meanwhile', async () => {
    withNomination(detail('Pending'))
    vi.spyOn(api, 'approveNomination').mockRejectedValue(new ApiError(409, { code: 'DIRECTOR_NOMINATION_INVALID_STATUS' }))
    await open()

    fireEvent.click(screen.getByRole('button', { name: 'Duyệt' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Duyệt đề cử' }))
    expect(await screen.findByText(/vừa đổi trạng thái/)).toBeInTheDocument()
  })

  it('shows a Choir Director only the withdrawal of their own pending nomination', async () => {
    asRole('ChoirDirector', 'u9')
    withNomination(detail('Pending'))
    await open()

    expect(screen.getByRole('button', { name: 'Rút đề cử' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duyệt' })).toBeNull()
  })

  it('keeps the decisions in the history', async () => {
    withNomination(detail('Rejected', { reviewedAt: '2026-11-09T08:00:00Z', reviewNote: 'Chưa đủ thâm niên' }))
    await open()

    expect(screen.getByText(/Cha xứ từ chối. Lý do: Chưa đủ thâm niên/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duyệt' })).toBeNull()
  })

  it('lets a Choir Director nominate after seeing the record, and explains an open nomination', async () => {
    asRole('ChoirDirector', 'u9')
    vi.spyOn(api, 'listNominations').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 })
    vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([{ id: 'm1', fullName: 'An Nguyễn', skills: [] }])
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([])
    vi.spyOn(api, 'getEligibility').mockResolvedValue(detail('Pending').stats)
    const create = vi.spyOn(api, 'createNomination').mockRejectedValue(new ApiError(409, { code: 'DIRECTOR_NOMINATION_ALREADY_OPEN' }))
    renderPage(<NominationsPage area="Khu" />, '/x')

    fireEvent.click((await screen.findAllByRole('button', { name: /Đề cử Ca trưởng/ }))[0])
    const drawer = within(await screen.findByRole('dialog'))
    fireEvent.click(drawer.getByRole('button', { name: 'Gửi đề cử' }))
    expect(await drawer.findByText('Vui lòng chọn ca viên.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()

    await waitFor(() => expect(membersApi.listChoirMembers).toHaveBeenCalled())
    fireEvent.mouseDown(drawer.getByLabelText(/Ca viên/))
    fireEvent.click(await screen.findByTitle('An Nguyễn'))
    expect(await drawer.findByText(/Ca viên chưa đạt đủ ngưỡng/)).toBeInTheDocument()

    fireEvent.change(drawer.getByLabelText(/Lý do đề cử/), { target: { value: 'Bắt nhịp tốt' } })
    fireEvent.click(drawer.getByRole('button', { name: 'Gửi đề cử' }))
    await waitFor(() => expect(create.mock.calls[0][0]).toMatchObject({ memberId: 'm1', reason: 'Bắt nhịp tốt' }))
    expect(await drawer.findByText(/đang có một đề cử chưa kết thúc/)).toBeInTheDocument()
  }, 30_000)
  it('tells the Parish Priest why there is no way to nominate yet', async () => {
    vi.spyOn(api, 'listNominations').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 })
    renderPage(<NominationsPage area="Khu" />, '/x')

    expect(await screen.findByText(/chưa cấp danh sách ca viên/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Đề cử Ca trưởng/ })).toBeNull()
  })
})
