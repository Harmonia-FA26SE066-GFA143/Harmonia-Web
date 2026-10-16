import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as membersApi from '@/features/members/api/membersApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { programPage } from '@/test/programs'
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

const renderParticipation = (initialEntry = '/director/participation') =>
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

  it('does not send more for a program that is already past', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([asked('m3', 'Anna Đặng Thị Mai')])
    renderParticipation('/director/participation?programId=p1')

    expect(await screen.findByText('Chương trình đã qua: không gửi thêm yêu cầu xác nhận được.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi thêm cho thành viên chưa được mời/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Gửi yêu cầu xác nhận/ })).toBeNull()
  })
})
