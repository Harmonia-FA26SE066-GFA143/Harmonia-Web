import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as api from './api/memberRegistrationsApi'
import { JoinChoirPage } from './pages/JoinChoirPage'
import { MemberRegistrationsPage } from './pages/MemberRegistrationsPage'

afterEach(() => vi.restoreAllMocks())

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } })
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu tham gia' }))

describe('JoinChoirPage', () => {
  it('says what is missing and sends nothing', async () => {
    const submit = vi.spyOn(api, 'submitRegistration')
    renderPage(<JoinChoirPage />, '/join')
    send()

    expect(await screen.findByText('Vui lòng nhập họ tên.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  it('sends the trimmed request and says it is not an account', async () => {
    const submit = vi.spyOn(api, 'submitRegistration').mockResolvedValue(undefined)
    renderPage(<JoinChoirPage />, '/join')
    fill('Họ tên', '  An Nguyễn ')
    fill('Email', 'an@giaoxu.org')
    send()

    expect(await screen.findByText(/chưa phải tài khoản đăng nhập/)).toBeInTheDocument()
    expect(submit.mock.calls[0][0]).toEqual({ fullName: 'An Nguyễn', email: 'an@giaoxu.org', phone: undefined, note: undefined })
  })

  it('keeps the form and explains the rate limit', async () => {
    vi.spyOn(api, 'submitRegistration').mockRejectedValue(new ApiError(429, { code: 'RATE_LIMIT_EXCEEDED' }))
    renderPage(<JoinChoirPage />, '/join')
    fill('Họ tên', 'An')
    fill('Email', 'an@giaoxu.org')
    send()

    expect(await screen.findByText(/thử lại sau 10 phút/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Họ tên/)).toHaveValue('An')
  })
})

const row: api.MemberRegistration = { id: 'r1', fullName: 'An Nguyễn', email: 'an@giaoxu.org', phone: null, note: 'Ca đoàn Cecilia', createdAt: '2026-11-09T08:00:00Z' }
const page = (items: api.MemberRegistration[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })

describe('MemberRegistrationsPage', () => {
  it('shows the empty state', async () => {
    vi.spyOn(api, 'listRegistrations').mockResolvedValue(page([]))
    renderPage(<MemberRegistrationsPage />, '/admin/member-registrations')
    expect(await screen.findByText('Chưa có yêu cầu nào')).toBeInTheDocument()
  })

  it('asks before accepting, then reports the account', async () => {
    vi.spyOn(api, 'listRegistrations').mockResolvedValue(page([row]))
    const accept = vi.spyOn(api, 'acceptRegistration').mockResolvedValue(undefined)
    renderPage(<MemberRegistrationsPage />, '/admin/member-registrations')

    fireEvent.click(await screen.findByRole('button', { name: 'Chấp nhận yêu cầu của An Nguyễn' }))
    expect(accept).not.toHaveBeenCalled()
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tạo tài khoản' }))

    await waitFor(() => expect(accept.mock.calls[0][0]).toBe('r1'))
    expect(await screen.findByText(/Đã tạo tài khoản Ca viên cho An Nguyễn/)).toBeInTheDocument()
  })

  it('explains an email that already has an account', async () => {
    vi.spyOn(api, 'listRegistrations').mockResolvedValue(page([row]))
    vi.spyOn(api, 'acceptRegistration').mockRejectedValue(new ApiError(409, { code: 'USER_EMAIL_ALREADY_EXISTS' }))
    renderPage(<MemberRegistrationsPage />, '/admin/member-registrations')

    fireEvent.click(await screen.findByRole('button', { name: 'Chấp nhận yêu cầu của An Nguyễn' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tạo tài khoản' }))
    expect(await screen.findByText(/Email này đã có tài khoản/)).toBeInTheDocument()
  })

  it('deletes only after the confirmation', async () => {
    vi.spyOn(api, 'listRegistrations').mockResolvedValue(page([row]))
    const remove = vi.spyOn(api, 'deleteRegistration').mockResolvedValue(undefined)
    renderPage(<MemberRegistrationsPage />, '/admin/member-registrations')

    fireEvent.click(await screen.findByRole('button', { name: 'Xoá yêu cầu của An Nguyễn' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Xoá yêu cầu' }))
    await waitFor(() => expect(remove.mock.calls[0][0]).toBe('r1'))
  })
})
