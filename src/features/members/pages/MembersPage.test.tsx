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

  it('opens the profile, with no revoke action when no approved skill carries its id, then the edit form (G2-09, G2-04)', async () => {
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

  it('revokes an approved skill with a reason from the profile (B63, PATCH member-skills/{id}/revoke)', async () => {
    vi.spyOn(api, 'searchMembers').mockResolvedValue(page([member({ skills: ['Soprano'], approvedSkills: [{ id: 'ms1', name: 'Soprano' }] })]))
    vi.spyOn(api, 'listAllChoirMembers').mockResolvedValue([])
    const revoke = vi.spyOn(skillsApi, 'revokeSkill').mockResolvedValue()
    renderPage(<MembersPage />, '/m')

    fireEvent.click(await screen.findByRole('button', { name: 'Xem hồ sơ Nguyễn Thị Lan' }))
    const view = within(await screen.findByRole('dialog', { name: 'Hồ sơ ca viên' }))
    fireEvent.click(view.getByRole('button', { name: 'Thu hồi kỹ năng Nữ cao' }))
    // The modal opens over the profile drawer, so it is found by its own title.
    const modal = within((await screen.findByText('Thu hồi kỹ năng', { selector: '.ant-modal-title' })).closest('.ant-modal') as HTMLElement)
    fireEvent.click(modal.getByRole('button', { name: 'Thu hồi' }))
    expect(await modal.findByText('Vui lòng nhập lý do thu hồi.')).toBeInTheDocument()
    fireEvent.change(modal.getByLabelText('Lý do thu hồi'), { target: { value: 'Chưa đạt bè nữ cao' } })
    fireEvent.click(modal.getByRole('button', { name: 'Thu hồi' }))

    await waitFor(() => expect(revoke).toHaveBeenCalledWith('ms1', 'Chưa đạt bè nữ cao'))
    expect(await screen.findByText('Đã thu hồi kỹ năng Nữ cao. Ca viên sẽ nhận được thông báo.')).toBeInTheDocument()
    expect(view.queryByRole('button', { name: 'Thu hồi kỹ năng Nữ cao' })).toBeNull()
  })

  it('warns before a member stops serving that upcoming invitations and roster lines go (BE origin/main 1040339)', async () => {
    vi.spyOn(api, 'searchMembers').mockResolvedValue(page([member()]))
    vi.spyOn(api, 'listAllChoirMembers').mockResolvedValue([])
    renderPage(<MembersPage />, '/m')

    fireEvent.click(await screen.findByRole('button', { name: /Chỉnh sửa hồ sơ Nguyễn Thị Lan/ }))
    const form = within(await screen.findByRole('dialog', { name: 'Chỉnh sửa hồ sơ' }))
    expect(form.queryByText(/gỡ khỏi xác nhận tham gia và phân công/)).toBeNull()
    fireEvent.mouseDown(form.getByLabelText('Trạng thái'))
    fireEvent.click((await screen.findAllByTitle('Tạm nghỉ')).find((node) => node.classList.contains('ant-select-item-option')) as HTMLElement)
    expect(await form.findByText(/gỡ khỏi xác nhận tham gia và phân công/)).toBeInTheDocument()
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
