import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as skillsApi from '@/features/skill-approval/api/memberSkillsApi'
import { renderPage } from '@/test/renderPage'
import * as api from '../api/membersApi'
import type { MemberProfile } from '../types'
import { MembersPage } from './MembersPage'

const member = (overrides: Partial<MemberProfile> = {}): MemberProfile => ({
  id: 'm1',
  fullName: 'Nguyễn Thị Lan',
  email: 'lan@giaoxu.org',
  phone: null,
  saintName: 'Maria',
  gender: null,
  dateOfBirth: null,
  joinedDate: '2024-03-01',
  status: 'active',
  skills: ['Organ'],
  role: 'member',
  ...overrides,
})

const page = (items: MemberProfile[], totalCount = items.length) => ({ items, pageNumber: 1, pageSize: 20, totalCount, totalPages: 1 })

const strip = (label: string) => within(screen.getByRole('definition', { hidden: true }).closest('main') ?? document.body).getByLabelText(label)

beforeEach(() => {
  // Catalog lookups (skill filter) are not under test.
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })))
  vi.spyOn(skillsApi, 'listPendingSkills').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 1, totalCount: 2, totalPages: 2 })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('MembersPage', () => {
  it('splits status counts from voice-part counts and never shows a false 0 while voices are unknown (G2-03, R2.6)', async () => {
    vi.spyOn(api, 'searchMembers').mockResolvedValue(page([member()], 3))
    vi.spyOn(api, 'listAllChoirMembers').mockRejectedValue(new Error('offline'))
    renderPage(<MembersPage />, '/m')

    const status = await screen.findByLabelText('Tình trạng ca viên')
    await waitFor(() => expect(within(status).getAllByText('3')).toHaveLength(3))
    const voices = screen.getByLabelText('Phân bố theo bè (ca viên đang sinh hoạt)')
    expect(within(voices).getByText('Chưa phân bè')).toBeInTheDocument()
    await waitFor(() => expect(within(voices).getAllByText('Chưa có dữ liệu')).toHaveLength(5))
    expect(within(voices).queryByText('0')).toBeNull()
  })

  it('counts voice parts from every active member', async () => {
    vi.spyOn(api, 'searchMembers').mockResolvedValue(page([member()]))
    vi.spyOn(api, 'listAllChoirMembers').mockResolvedValue([
      { id: 'a', fullName: 'A', skills: ['Soprano'] },
      { id: 'b', fullName: 'B', skills: ['Soprano'] },
      { id: 'c', fullName: 'C', skills: ['Organ'] },
    ])
    renderPage(<MembersPage />, '/m')

    const voices = await screen.findByLabelText('Phân bố theo bè (ca viên đang sinh hoạt)')
    await waitFor(() => expect(within(within(voices).getByText('Nữ cao').closest('div')!).getByText('2')).toBeInTheDocument())
    expect(within(within(voices).getByText('Chưa phân bè').closest('div')!).getByText('1')).toBeInTheDocument()
  })

  it('shows the voice column, missing phone and unassigned voice, and the shared filter reset', async () => {
    vi.spyOn(api, 'searchMembers').mockResolvedValue(page([member()]))
    vi.spyOn(api, 'listAllChoirMembers').mockResolvedValue([])
    renderPage(<MembersPage />, '/m')

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Bè & Kỹ năng' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Thao tác' })).toBeInTheDocument()
    expect(within(table).getByText('Chưa cập nhật')).toBeInTheDocument()
    expect(within(table).getByText('Chưa phân bè')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xoá bộ lọc' })).toBeDisabled()
  })

  it('opens a read-only profile without a revoke action, then the edit form from it (G2-09, G2-04, B63)', async () => {
    vi.spyOn(api, 'searchMembers').mockResolvedValue(page([member()]))
    vi.spyOn(api, 'listAllChoirMembers').mockResolvedValue([])
    renderPage(<MembersPage />, '/m')

    fireEvent.click(await screen.findByRole('button', { name: 'Xem hồ sơ Nguyễn Thị Lan' }))
    const view = within(await screen.findByRole('dialog', { name: 'Hồ sơ ca viên' }))
    expect(view.getByText('Bè & Kỹ năng đã duyệt')).toBeInTheDocument()
    expect(view.queryByRole('button', { name: /thu hồi|revoke/i })).toBeNull()

    fireEvent.click(view.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }))
    const form = within(await screen.findByRole('dialog', { name: 'Chỉnh sửa hồ sơ' }))
    expect(form.getByText('Bè (từ kỹ năng đã duyệt)')).toBeInTheDocument()
    expect(form.getByText(/Họ tên và email thuộc tài khoản/)).toBeInTheDocument()
    expect(form.queryByText(/không bắt buộc/)).toBeNull()
  })

  it('offers only the profile view for a profile kept after a role change (B46)', async () => {
    vi.spyOn(api, 'searchMembers').mockResolvedValue(page([member({ role: 'director', skills: [] })]))
    vi.spyOn(api, 'listAllChoirMembers').mockResolvedValue([])
    renderPage(<MembersPage />, '/m')

    expect(await screen.findByRole('button', { name: 'Xem hồ sơ Nguyễn Thị Lan' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chỉnh sửa hồ sơ Nguyễn Thị Lan' })).toBeNull()
    expect(within(screen.getByRole('table')).queryByText('Chưa phân bè')).toBeNull()
  })
})

void strip
