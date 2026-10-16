import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as membersApi from '@/features/members/api/membersApi'
import { renderPage } from '@/test/renderPage'
import { programPage } from '@/test/programs'
import * as participationApi from '../api/participationApi'
import { ParticipationPage } from './ParticipationPage'

const sentAt = '2026-09-27T02:30:00.000Z'

const renderParticipation = (initialEntry = '/director/participation') =>
  renderPage(<ParticipationPage />, '/director/participation', initialEntry)

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage(
    { id: 'p2', eventName: 'Lễ Bổn mạng', date: dayjs().add(5, 'day').format('YYYY-MM-DD') },
    { id: 'p1', eventName: 'Lễ Chúa Nhật', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD') },
  ))
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
    renderParticipation('/director/participation?programId=p2')

    expect(await screen.findByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Chưa phản hồi (1)'))
    expect(screen.queryByText('Maria Nguyễn Thu Hướng')).toBeNull()
    expect(screen.getByText('Anna Đặng Thị Mai')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Gửi lại cho 1 thành viên chưa phản hồi/ }))
    const confirm = await screen.findByRole('dialog')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Gửi lại' }))

    await waitFor(() => expect(send).toHaveBeenCalledWith('p2', ['m3']))
  })

  it('counts the filter tabs within the search, says when the list was loaded and marks past programs', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      { memberId: 'm1', fullName: 'Maria Nguyễn Thu Hướng', skills: [], sentAt, response: 'confirmed', respondedAt: sentAt },
      { memberId: 'm2', fullName: 'Simon Phan Văn Đức', skills: [], sentAt, response: 'unsure', respondedAt: sentAt },
      { memberId: 'm3', fullName: 'Anna Đặng Thị Mai', skills: [], sentAt },
    ])
    renderParticipation('/director/participation?programId=p1')

    expect(await screen.findByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    expect(screen.getByText(/\(đã qua\)/)).toBeInTheDocument()
    expect(screen.getByText(/Cập nhật lúc \d{2}:\d{2}/)).toBeInTheDocument()
    expect(screen.getByText('Tất cả (3)')).toBeInTheDocument()
    // Tag text is darker than the Ant Design preset, which is below 4.5:1 for green and gold.
    expect(screen.getByText('Xác nhận', { selector: '.ant-tag' })).toHaveStyle({ color: '#237804' })
    expect(screen.getByText('Chưa chắc chắn', { selector: '.ant-tag' })).toHaveStyle({ color: '#874d00' })

    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm thành viên' }), { target: { value: 'Anna' } })
    expect(await screen.findByText('Tất cả (1)')).toBeInTheDocument()
    expect(screen.getByText('Chưa phản hồi (1)')).toBeInTheDocument()
    expect(screen.getByText('Xác nhận (0)')).toBeInTheDocument()
  })

  it('does not send or resend for a program that is already past', async () => {
    vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
      { memberId: 'm3', fullName: 'Anna Đặng Thị Mai', skills: [], sentAt },
    ])
    renderParticipation('/director/participation?programId=p1')

    expect(await screen.findByText('Chương trình đã qua: không gửi hoặc gửi lại yêu cầu xác nhận được.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi lại cho 1 thành viên chưa phản hồi/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Gửi yêu cầu xác nhận/ })).toBeNull()
  })
})
