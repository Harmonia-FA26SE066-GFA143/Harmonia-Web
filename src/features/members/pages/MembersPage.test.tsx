import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import { renderPage } from '@/test/renderPage'
import * as membersApi from '../api/membersApi'
import type { MemberProfile } from '../types'
import { MembersPage } from './MembersPage'

const member = (patch: Partial<MemberProfile>): MemberProfile => ({
  id: 'm1',
  fullName: 'Maria Lan',
  email: 'lan@giaoxu.vn',
  phone: '0901234567',
  dateOfBirth: null,
  joinedDate: '2024-05-01',
  status: 'active',
  skills: ['Soprano'],
  role: 'member',
  ...patch,
})

const page = (items: MemberProfile[]): PagedList<MemberProfile> => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })

const renderMembers = () => renderPage(<MembersPage />, '/director/members')

beforeEach(() => {
  vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([])
  vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([
    { id: 'm1', fullName: 'Maria Lan', skills: ['Soprano'] },
    { id: 'm2', fullName: 'Giuse Minh', skills: ['Nam cao', 'Organ'] },
    { id: 'm3', fullName: 'Phêrô Hải', skills: ['Bass'] },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MembersPage', () => {
  it('counts active members by voice part, Vietnamese names included', async () => {
    vi.spyOn(membersApi, 'searchMembers').mockResolvedValue(page([member({})]))
    renderMembers()

    const strip = await screen.findByLabelText('Ca viên đang sinh hoạt theo bè')
    const value = (label: string) => within(strip).getByText(label).nextElementSibling
    expect(value('Đang sinh hoạt')).toHaveTextContent('3')
    expect(value('Soprano')).toHaveTextContent('1')
    expect(value('Alto')).toHaveTextContent('0')
    expect(value('Tenor')).toHaveTextContent('1')
    expect(value('Bass')).toHaveTextContent('1')
  })

  it('says the choir is empty before any filter', async () => {
    vi.spyOn(membersApi, 'searchMembers').mockResolvedValue(page([]))
    renderMembers()
    expect(await screen.findByText('Chưa có ca viên nào')).toBeInTheDocument()
  })

  it('searches after typing stops and offers to clear a search with no match', async () => {
    const search = vi.spyOn(membersApi, 'searchMembers').mockImplementation(async (filters) => page(filters.search ? [] : [member({})]))
    renderMembers()

    fireEvent.change(await screen.findByLabelText('Tìm ca viên'), { target: { value: 'không có' } })
    await waitFor(() => expect(search).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'không có' }), { pageNumber: 1, pageSize: 20 }))
    expect(await screen.findByText('0 ca viên')).toBeInTheDocument()
    expect(screen.queryByText('Chưa có ca viên nào')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Đặt lại bộ lọc/ }))
    expect(await screen.findByText('Maria Lan')).toBeInTheDocument()
  })

  it('saves an edited profile and closes the drawer', async () => {
    vi.spyOn(membersApi, 'searchMembers').mockResolvedValue(page([member({})]))
    const update = vi.spyOn(membersApi, 'updateMember').mockResolvedValue()
    renderMembers()

    fireEvent.click(await screen.findByRole('button', { name: 'Sửa Maria Lan' }))
    const drawer = await screen.findByRole('dialog')
    fireEvent.change(within(drawer).getByLabelText('Số điện thoại (không bắt buộc)'), { target: { value: '0912000111' } })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith('m1', expect.objectContaining({ phone: '0912000111', joinedDate: '2024-05-01', status: 'active' })))
    expect(await screen.findByText('Đã lưu thông tin ca viên.')).toBeInTheDocument()
  })

  it('explains why a member who changed role cannot be edited', async () => {
    vi.spyOn(membersApi, 'searchMembers').mockResolvedValue(page([member({})]))
    vi.spyOn(membersApi, 'updateMember').mockRejectedValue(new ApiError(409, { code: 'MEMBER_NOT_ACTIVE' }))
    renderMembers()

    fireEvent.click(await screen.findByRole('button', { name: 'Sửa Maria Lan' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByText('Tài khoản này không còn là ca viên nên không sửa được hồ sơ. Vui lòng tải lại trang.')).toBeInTheDocument()
  })
})
