import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as membersApi from '@/features/members/api/membersApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { programPage, testProgram } from '@/test/programs'
import * as participationApi from '../api/participationApi'
import type { ParticipationRequest } from '../types'
import { ParticipationPage } from './ParticipationPage'

const requestedAt = '2026-09-27T02:30:00Z'

const asked = (memberId: string, fullName: string, fields: Partial<ParticipationRequest> = {}): ParticipationRequest => ({
  id: `ep-${memberId}`,
  memberId,
  fullName,
  requestedAt,
  ...fields,
})

const member = (memberId: string, fullName: string) => ({ memberId, fullName, email: `${memberId}@example.test`, joinedDate: '2025-01-01' })

const renderParticipation =(initialEntry = '/director/participation') =>
  renderPage(<ParticipationPage />, '/director/participation', initialEntry)

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(
    programPage(
      { id: 'p2', eventName: 'Lễ Bổn mạng', date: dayjs().add(5, 'day').format('YYYY-MM-DD') },
      { id: 'p1', eventName: 'Lễ Chúa Nhật', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD') },
    ),
  )
  vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([
    { id: 'm1', fullName: 'Maria Nguyễn Thu Hướng', skills: ['Organ'] },
    { id: 'm2', fullName: 'Simon Phan Văn Đức', skills: ['Bass'] },
    { id: 'm3', fullName: 'Anna Đặng Thị Mai', skills: ['Soprano'] },
  ])
  // One choir serves the program and the director leads it, so its members are the ones who can be asked.
  vi.spyOn(choirsApi, 'listEventChoirs').mockResolvedValue([{ choirId: 'c1', name: 'Ca đoàn Cécilia', isActive: true, isLead: true }])
  vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([{ id: 'c1', name: 'Ca đoàn Cécilia', isActive: true }])
  vi.spyOn(choirsApi, 'listMembersOfChoir').mockResolvedValue([
    member('m1', 'Maria Nguyễn Thu Hướng'),
    member('m2', 'Simon Phan Văn Đức'),
    member('m3', 'Anna Đặng Thị Mai'),
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ParticipationPage', () => {
  it('shows a recoverable error when the requests cannot be loaded', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockRejectedValue(new ApiError(403, undefined))
    renderParticipation()

    expect(await screen.findByRole('heading', { name: 'Không thể tải phản hồi xác nhận' })).toBeInTheDocument()
  })

  it('sends the first request to the selected members of the next program', async () => {
    const get = vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([])
    const send = vi.spyOn(participationApi, 'sendParticipationRequests').mockResolvedValue()
    renderParticipation()

    expect(await screen.findByRole('heading', { name: 'Chưa gửi yêu cầu xác nhận' })).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('p2')

    fireEvent.click(screen.getAllByRole('button', { name: /Gửi yêu cầu xác nhận/ })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(await within(dialog).findByRole('checkbox', { name: /Simon Phan Văn Đức/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi cho 2 thành viên' }))

    await waitFor(() => expect(send).toHaveBeenCalledWith('p2', ['m1', 'm3']))
  })

  it('offers only members of the serving choirs, and asks another director’s choir as a whole', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([])
    const send = vi.spyOn(participationApi, 'sendParticipationRequests').mockResolvedValue()
    vi.mocked(choirsApi.listEventChoirs).mockResolvedValue([
      { choirId: 'c1', name: 'Ca đoàn Cécilia', isActive: true, isLead: true },
      { choirId: 'c2', name: 'Ca đoàn Têrêsa', isActive: true, isLead: false },
    ])
    // The parish list also holds a member of no serving choir; the backend would refuse the whole request for it.
    vi.mocked(membersApi.listChoirMembers).mockResolvedValue([
      { id: 'm1', fullName: 'Maria Nguyễn Thu Hướng', skills: ['Organ'] },
      { id: 'm9', fullName: 'Phêrô Trần Văn Ngoài', skills: [] },
    ])
    renderParticipation()

    fireEvent.click((await screen.findAllByRole('button', { name: /Gửi yêu cầu xác nhận/ }))[0])
    const dialog = await screen.findByRole('dialog')
    const everyone = await within(dialog).findByRole('checkbox', { name: /Mời mọi ca viên của các ca đoàn phục vụ/ })
    expect(everyone).toBeChecked()
    expect(within(dialog).getByText(/Gồm cả Ca đoàn Têrêsa/)).toBeInTheDocument()

    // By name: the director's own choir only, never the member outside the serving choirs.
    fireEvent.click(everyone)
    expect(await within(dialog).findByRole('checkbox', { name: /Maria Nguyễn Thu Hướng/ })).toBeInTheDocument()
    expect(within(dialog).queryByRole('checkbox', { name: /Phêrô Trần Văn Ngoài/ })).toBeNull()
    expect(choirsApi.listMembersOfChoir).not.toHaveBeenCalledWith('c2')

    fireEvent.click(everyone)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi cho mọi ca viên chưa được mời' }))
    await waitFor(() => expect(send).toHaveBeenCalledWith('p2', undefined))
  })

  it('never shows another program in place of the one in the link', async () => {
    const get = vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([])
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(null)
    renderParticipation('/director/participation?programId=gone')

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy chương trình phụng vụ' })).toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
  })

  it('reads a past program that is no longer in the upcoming list, without sending', async () => {
    const get = vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([asked('m3', 'Anna Đặng Thị Mai')])
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({
      ...testProgram({ id: 'old', eventName: 'Lễ Các Thánh', date: dayjs().subtract(20, 'day').format('YYYY-MM-DD') }),
      songs: [],
    })
    renderParticipation('/director/participation?programId=old')

    expect(await screen.findByRole('heading', { name: 'Lễ Các Thánh' })).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('old')
    expect(await screen.findByText('Chương trình đã qua: không gửi thêm yêu cầu xác nhận được.')).toBeInTheDocument()
  })

  it('counts the answers per voice part from approved skills and names the part with the fewest confirmations', async () => {
    vi.mocked(membersApi.listChoirMembers).mockResolvedValue([
      { id: 'm1', fullName: 'Maria Nguyễn Thu Hướng', skills: ['Organ'] },
      { id: 'm2', fullName: 'Simon Phan Văn Đức', skills: ['Bass'] },
      { id: 'm3', fullName: 'Anna Đặng Thị Mai', skills: ['Soprano'] },
      { id: 'm4', fullName: 'Têrêsa Lê Thu', skills: ['Giọng nữ cao'] },
    ])
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      asked('m1', 'Maria Nguyễn Thu Hướng', { response: 'confirmed', respondedAt: requestedAt }),
      asked('m2', 'Simon Phan Văn Đức', { response: 'declined', respondedAt: requestedAt }),
      asked('m3', 'Anna Đặng Thị Mai', { response: 'confirmed', respondedAt: requestedAt }),
      asked('m4', 'Têrêsa Lê Thu'),
    ])
    renderParticipation('/director/participation?programId=p2')

    const parts = await screen.findByRole('complementary', { name: 'Phản hồi theo bè' })
    // Soprano and "Giọng nữ cao" are one part; the organist is in none.
    expect(await within(parts).findByText('1 xác nhận · 0 từ chối · 1 chưa')).toBeInTheDocument()
    expect(within(parts).getByText('0 xác nhận · 1 từ chối · 0 chưa')).toBeInTheDocument()
    expect(within(parts).getAllByText('Chưa mời ai')).toHaveLength(2)
    expect(within(parts).getByText(/ít xác nhận nhất: 0 trên 1 người được mời/)).toHaveTextContent('Bè Bass')
    expect(within(parts).getByRole('link', { name: /Mở phân công/ })).toHaveAttribute('href', '/director/roster?programId=p2')
  })

  it('counts and filters the answers, shows notes, and sends more only to members not asked yet', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      asked('m1', 'Maria Nguyễn Thu Hướng', { response: 'confirmed', respondedAt: requestedAt }),
      asked('m2', 'Simon Phan Văn Đức', { response: 'unsure', respondedAt: requestedAt, note: 'Có thể về muộn' }),
    ])
    const send = vi.spyOn(participationApi, 'sendParticipationRequests').mockResolvedValue()
    renderParticipation('/director/participation?programId=p2')

    expect(await screen.findByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    expect(screen.getByText('Có thể về muộn')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Chưa chắc chắn (1)'))
    expect(screen.queryByText('Maria Nguyễn Thu Hướng')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Gửi thêm cho thành viên chưa được mời/ }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByRole('checkbox', { name: /Anna Đặng Thị Mai/ })).toBeInTheDocument()
    expect(within(dialog).queryByRole('checkbox', { name: /Maria Nguyễn Thu Hướng/ })).toBeNull()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi cho 1 thành viên' }))

    await waitFor(() => expect(send).toHaveBeenCalledWith('p2', ['m3']))
  })

  it('counts the filter tabs within the search, by name or skill, and says when the list was loaded', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      asked('m1', 'Maria Nguyễn Thu Hướng', { response: 'confirmed', respondedAt: requestedAt }),
      asked('m2', 'Simon Phan Văn Đức', { response: 'unsure', respondedAt: requestedAt }),
      asked('m3', 'Anna Đặng Thị Mai'),
    ])
    renderParticipation('/director/participation?programId=p2')

    expect(await screen.findByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    expect(screen.getByText(/Cập nhật lúc \d{2}:\d{2}/)).toBeInTheDocument()
    expect(screen.getByText('Tất cả (3)')).toBeInTheDocument()
    // Tag text is darker than the Ant Design preset, which is below 4.5:1 for green and gold.
    expect(screen.getByText('Xác nhận', { selector: '.ant-tag' })).toHaveStyle({ color: '#237804' })
    expect(screen.getByText('Chưa chắc chắn', { selector: '.ant-tag' })).toHaveStyle({ color: '#874d00' })

    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm thành viên' }), { target: { value: 'Soprano' } })
    expect(await screen.findByText('Tất cả (1)')).toBeInTheDocument()
    expect(screen.getByText('Chưa phản hồi (1)')).toBeInTheDocument()
    expect(screen.getByText('Xác nhận (0)')).toBeInTheDocument()
  })

  it('explains a refusal of the backend', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([])
    vi.spyOn(participationApi, 'sendParticipationRequests').mockRejectedValue(
      new ApiError(409, { code: 'EVENT_PARTICIPATION_ALREADY_REQUESTED' }),
    )
    renderParticipation('/director/participation?programId=p2')

    fireEvent.click((await screen.findAllByRole('button', { name: /Gửi yêu cầu xác nhận/ }))[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Gửi cho 3 thành viên' }))

    expect(await screen.findByText(/đã được gửi yêu cầu cho chương trình này/)).toBeInTheDocument()
  })

  it('offers to confirm on the members’ behalf only while someone has not answered', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      asked('m1', 'Maria Nguyễn Thu Hướng', { response: 'confirmed', respondedAt: requestedAt }),
      asked('m2', 'Simon Phan Văn Đức', { response: 'declined', respondedAt: requestedAt }),
    ])
    renderParticipation('/director/participation?programId=p2')

    expect(await screen.findByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Xác nhận hộ/ })).toBeNull()
  })

  it('confirms the unanswered requests only after asking, then reloads the list', async () => {
    const get = vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      asked('m1', 'Maria Nguyễn Thu Hướng', { response: 'unsure', respondedAt: requestedAt }),
      asked('m3', 'Anna Đặng Thị Mai'),
    ])
    const confirmAll = vi.spyOn(participationApi, 'confirmAllParticipation').mockResolvedValue()
    renderParticipation('/director/participation?programId=p2')

    fireEvent.click(await screen.findByRole('button', { name: /Xác nhận hộ người chưa phản hồi/ }))
    expect(await screen.findByText('Xác nhận hộ 1 thành viên chưa phản hồi?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(confirmAll).not.toHaveBeenCalled()

    const loads = get.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hộ người chưa phản hồi/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận hộ' }))

    await waitFor(() => expect(confirmAll).toHaveBeenCalledWith('p2'))
    expect(await screen.findByText('Đã xác nhận hộ các thành viên chưa phản hồi.')).toBeInTheDocument()
    await waitFor(() => expect(get.mock.calls.length).toBeGreaterThan(loads))
    // The mutation runs asynchronously, so the cancelled attempt is counted once everything has settled.
    expect(confirmAll).toHaveBeenCalledTimes(1)
  })

  it('explains a refused confirmation and lets the director try again', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([asked('m3', 'Anna Đặng Thị Mai')])
    const confirmAll = vi
      .spyOn(participationApi, 'confirmAllParticipation')
      .mockRejectedValueOnce(new ApiError(403, { code: 'CHOIR_NOT_LEAD' }))
      .mockResolvedValueOnce()
    renderParticipation('/director/participation?programId=p2')

    fireEvent.click(await screen.findByRole('button', { name: /Xác nhận hộ người chưa phản hồi/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận hộ' }))
    expect(await screen.findByText('Chỉ ca trưởng của ca đoàn phụ trách chương trình mới làm được việc này.')).toBeInTheDocument()

    const retry = screen.getByRole('button', { name: /Xác nhận hộ người chưa phản hồi/ })
    await waitFor(() => expect(retry).toBeEnabled())
    fireEvent.click(retry)
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận hộ' }))
    await waitFor(() => expect(confirmAll).toHaveBeenCalledTimes(2))
  })

  it('does not send more for a program that is already past', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([asked('m3', 'Anna Đặng Thị Mai')])
    renderParticipation('/director/participation?programId=p1')

    expect(await screen.findByText('Chương trình đã qua: không gửi thêm yêu cầu xác nhận được.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi thêm cho thành viên chưa được mời/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Gửi yêu cầu xác nhận/ })).toBeNull()
  })
})
