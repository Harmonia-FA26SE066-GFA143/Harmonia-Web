import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as membersApi from '@/features/members/api/membersApi'
import { renderPage } from '@/test/renderPage'
import * as participationApi from '../api/participationApi'
import { ParticipationPage } from './ParticipationPage'

const sentAt = '2026-09-27T02:30:00.000Z'

const renderParticipation = (initialEntry = '/director/participation') =>
  renderPage(<ParticipationPage />, '/director/participation', initialEntry)

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([
    { id: 'p1', eventName: 'Lễ Chúa Nhật', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD') },
    { id: 'p2', eventName: 'Lễ Bổn mạng', date: dayjs().add(5, 'day').format('YYYY-MM-DD') },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ParticipationPage', () => {
  it('shows a recoverable error while the API contract is missing', async () => {
    renderParticipation()

    expect(await screen.findByRole('heading', { name: 'Không thể tải phản hồi xác nhận' })).toBeInTheDocument()
  })

  it('sends the first request to the selected members of the next program', async () => {
    const get = vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([])
    vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([
      { id: 'm1', fullName: 'Maria Nguyễn Thu Hướng', skills: ['Organ'] },
      { id: 'm2', fullName: 'Simon Phan Văn Đức', skills: ['Bass'] },
    ])
    const send = vi.spyOn(participationApi, 'sendParticipationRequests').mockResolvedValue([])
    renderParticipation()

    expect(await screen.findByRole('heading', { name: 'Chưa gửi yêu cầu xác nhận' })).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('p2')

    fireEvent.click(screen.getAllByRole('button', { name: /Gửi yêu cầu xác nhận/ })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(await within(dialog).findByRole('checkbox', { name: /Simon Phan Văn Đức/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi cho 1 thành viên' }))

    await waitFor(() => expect(send).toHaveBeenCalledWith('p2', ['m1']))
  })

  it('counts responses, filters them and resends to members who have not responded', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      { memberId: 'm1', fullName: 'Maria Nguyễn Thu Hướng', skills: [], sentAt, response: 'confirmed', respondedAt: sentAt },
      { memberId: 'm2', fullName: 'Simon Phan Văn Đức', skills: [], sentAt, response: 'unsure', respondedAt: sentAt },
      { memberId: 'm3', fullName: 'Anna Đặng Thị Mai', skills: [], sentAt },
    ])
    const send = vi.spyOn(participationApi, 'sendParticipationRequests').mockResolvedValue([])
    renderParticipation('/director/participation?programId=p1')

    expect(await screen.findByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Chưa phản hồi (1)'))
    expect(screen.queryByText('Maria Nguyễn Thu Hướng')).toBeNull()
    expect(screen.getByText('Anna Đặng Thị Mai')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Gửi lại cho 1 thành viên chưa phản hồi/ }))
    const confirm = await screen.findByRole('dialog')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Gửi lại' }))

    await waitFor(() => expect(send).toHaveBeenCalledWith('p1', ['m3']))
  })
})
