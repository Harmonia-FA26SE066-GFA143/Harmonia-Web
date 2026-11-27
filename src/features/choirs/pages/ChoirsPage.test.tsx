import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as membersApi from '@/features/members/api/membersApi'
import * as accountsApi from '@/features/users/api/accountsApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { clearSession, setSession } from '@/lib/auth/session'
import * as api from '../api/choirsApi'
import { EventChoirsCard } from '../components/EventChoirsCard'
import type { Choir, ChoirMembership } from '../types'
import { AdminChoirsPage, DirectorChoirsPage } from './ChoirsPage'

const choir = (overrides: Partial<Choir> = {}): Choir => ({
  id: 'c1',
  name: 'Ca đoàn Cecilia',
  description: 'Hát lễ Chúa nhật 8g00',
  isActive: true,
  directorId: 'd1',
  directorName: 'Giuse Trần Văn An',
  ...overrides,
})

const membership = (memberId: string, fullName: string): ChoirMembership => ({
  memberId,
  fullName,
  email: `${memberId}@giaoxu.org`,
  joinedDate: '2025-01-10',
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ChoirsPage', () => {
  it('shows Director choir cards and real member count or Chưa có dữ liệu on error (G2-10, R2.6)', async () => {
    vi.spyOn(api, 'listChoirs').mockResolvedValue([
      choir({ id: 'c1', name: 'Ca đoàn Cecilia' }),
      choir({ id: 'c2', name: 'Ca đoàn Têrêsa' }),
    ])
    vi.spyOn(api, 'listMembersOfChoir').mockImplementation(async (id) => {
      if (id === 'c1') return [membership('m1', 'Maria Lan'), membership('m2', 'Giuse Bình')]
      throw new ApiError(404, { code: 'CHOIR_NOT_FOUND' })
    })

    renderPage(<DirectorChoirsPage />, '/director/choirs')

    expect(await screen.findByRole('heading', { name: 'Ca đoàn của tôi' })).toBeInTheDocument()
    const card1 = (await screen.findByText('Ca đoàn Cecilia')).closest('li') as HTMLElement
    const card2 = screen.getByText('Ca đoàn Têrêsa').closest('li') as HTMLElement
    await waitFor(() => expect(within(card1).getByText('2 ca viên')).toBeInTheDocument())
    await waitFor(() => expect(within(card2).getByText('Chưa có dữ liệu')).toBeInTheDocument())
    expect(within(card2).queryByText('0 ca viên')).toBeNull()
  })

  it('opens ChoirMembersDrawer as ViewDrawer with ACTIONS_COLUMN_TITLE and preserves adding members', async () => {
    vi.spyOn(api, 'listChoirs').mockResolvedValue([choir()])
    vi.spyOn(api, 'listMembersOfChoir').mockResolvedValue([membership('m1', 'Maria Lan')])
    vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([
      { id: 'm1', fullName: 'Maria Lan', skills: [] },
      { id: 'm2', fullName: 'Phêrô Dũng', skills: [] },
    ])

    renderPage(<DirectorChoirsPage />, '/director/choirs')

    fireEvent.click(await screen.findByRole('button', { name: 'Ca viên của Ca đoàn Cecilia' }))
    const dialog = await screen.findByRole('dialog', { name: 'Ca viên của Ca đoàn Cecilia' })
    expect(within(dialog).getByRole('columnheader', { name: 'Thao tác' })).toBeInTheDocument()
    expect(within(dialog).getByText('Maria Lan')).toBeInTheDocument()

    const footer = document.querySelector('.ant-drawer-footer') as HTMLElement
    expect(within(footer).getByRole('button', { name: 'Đóng' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm ca viên' }))
    expect(within(dialog).getByText('Thêm ca viên vào Ca đoàn Cecilia')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Hủy' })).toBeInTheDocument()
  })

  it('lets a Choir Director invite only members without a choir, and says it is an invitation (ChoirService.cs:210-219)', async () => {
    setSession({
      accessToken: 'a',
      accessTokenExpiresAt: '2099-01-01T00:00:00Z',
      refreshToken: 'r',
      user: { id: 'd1', email: 'd@giaoxu.org', roleName: 'ChoirDirector' },
    })
    vi.spyOn(api, 'listChoirs').mockResolvedValue([choir()])
    vi.spyOn(api, 'listMembersOfChoir').mockResolvedValue([membership('m1', 'Maria Lan')])
    vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([
      { id: 'm2', fullName: 'Phêrô Dũng', skills: [], choirs: [] },
      { id: 'm3', fullName: 'Anna Hoa', skills: [], choirs: [{ id: 'c9', name: 'Ca đoàn Thiếu nhi' }] },
    ])
    const add = vi.spyOn(api, 'addChoirMembers').mockResolvedValue()

    renderPage(<DirectorChoirsPage />, '/director/choirs')
    fireEvent.click(await screen.findByRole('button', { name: 'Ca viên của Ca đoàn Cecilia' }))
    const dialog = await screen.findByRole('dialog', { name: 'Ca viên của Ca đoàn Cecilia' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mời ca viên' }))
    expect(within(dialog).getByText('Mời ca viên vào Ca đoàn Cecilia')).toBeInTheDocument()

    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Ca viên cần mời' }))
    expect(await screen.findByRole('option', { name: 'Phêrô Dũng' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Anna Hoa' })).toBeNull()
    fireEvent.click((await screen.findAllByTitle('Phêrô Dũng')).find((node) => node.classList.contains('ant-select-item-option')) as HTMLElement)
    fireEvent.click(within(dialog).getByRole('button', { name: /^Gửi lời mời/ }))

    await waitFor(() => expect(add).toHaveBeenCalled())
    expect(await screen.findByText('Đã gửi lời mời tới 1 ca viên. Họ sẽ vào Ca đoàn Cecilia khi chấp nhận lời mời.')).toBeInTheDocument()
    clearSession()
  })

  it('preserves AdminChoirsPage table, EmptyCell, ACTIONS_COLUMN_TITLE and form drawer', async () => {
    vi.spyOn(api, 'listChoirs').mockResolvedValue([choir({ directorId: undefined, directorName: undefined })])
    vi.spyOn(api, 'listMembersOfChoir').mockResolvedValue([])
    vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([])
    vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })

    renderPage(<AdminChoirsPage />, '/admin/choirs')

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Ca trưởng phụ trách' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Thao tác' })).toBeInTheDocument()
    expect(within(table).getByText('Chưa có')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Thêm ca đoàn' }))
    const dialog = await screen.findByRole('dialog', { name: 'Thêm ca đoàn' })
    expect(within(dialog).getByLabelText('Mô tả')).toBeInTheDocument()
    expect(within(dialog).queryByText(/không bắt buộc/)).toBeNull()
  })

  it('shows one "Thêm ca đoàn" when the Admin has no choir, and none to a Director (SYS-06)', async () => {
    vi.spyOn(api, 'listChoirs').mockResolvedValue([])
    const all = vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([])
    const { unmount } = renderPage(<AdminChoirsPage />, '/admin/choirs')

    expect(await screen.findByRole('heading', { name: 'Chưa có ca đoàn nào' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Thêm ca đoàn' })).toHaveLength(1)
    unmount()
    all.mockClear()

    renderPage(<DirectorChoirsPage />, '/director/choirs')
    expect(await screen.findByRole('heading', { name: 'Bạn chưa phụ trách ca đoàn nào' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thêm ca đoàn' })).toBeNull()
    expect(all).not.toHaveBeenCalled()
  })

  it('never asks a Director with a choir for every member profile (Admin-only unplaced check)', async () => {
    vi.spyOn(api, 'listChoirs').mockResolvedValue([choir()])
    vi.spyOn(api, 'listMembersOfChoir').mockResolvedValue([membership('m1', 'Maria Lan')])
    const all = vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([])
    renderPage(<DirectorChoirsPage />, '/director/choirs')

    // With a choir listed, the only caller (UnplacedMembersNotice) is reachable if the role gate breaks.
    const card = (await screen.findByText('Ca đoàn Cecilia')).closest('li') as HTMLElement
    await waitFor(() => expect(within(card).getByText('1 ca viên')).toBeInTheDocument())
    expect(screen.queryByText(/chưa thuộc ca đoàn nào/)).toBeNull()
    expect(all).not.toHaveBeenCalled()
  })

  it('lists unplaced members from every profile page and says so when the check fails (B54)', async () => {
    vi.spyOn(api, 'listChoirs').mockResolvedValue([choir()])
    vi.spyOn(api, 'listMembersOfChoir').mockResolvedValue([membership('m1', 'Maria Lan')])
    vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
    const all = vi.spyOn(membersApi, 'listAllChoirMembers').mockResolvedValue([
      { id: 'm1', fullName: 'Maria Lan', skills: [] },
      { id: 'm2', fullName: 'Phêrô Dũng', skills: [] },
    ])
    const { unmount } = renderPage(<AdminChoirsPage />, '/admin/choirs')

    expect(await screen.findByText('1 ca viên chưa thuộc ca đoàn nào')).toBeInTheDocument()
    expect(screen.getByText(/Phêrô Dũng/)).toBeInTheDocument()
    unmount()

    all.mockRejectedValue(new ApiError(403, undefined))
    renderPage(<AdminChoirsPage />, '/admin/choirs')
    expect(await screen.findByText('Không thể kiểm tra danh sách ca viên chưa thuộc ca đoàn.')).toBeInTheDocument()
  })

  it('preserves Parish Priest canEdit flow in EventChoirsCard', async () => {
    vi.spyOn(api, 'listEventChoirs').mockResolvedValue([
      { choirId: 'c1', name: 'Ca đoàn Cecilia', isActive: true, isLead: true, directorId: 'd1', directorName: 'Giuse An' },
    ])
    vi.spyOn(api, 'listChoirs').mockResolvedValue([choir()])

    renderPage(<EventChoirsCard eventId="e1" canEdit />, '/priest/programs/e1')

    const editBtn = await screen.findByRole('button', { name: 'Sửa ca đoàn phục vụ' })
    fireEvent.click(editBtn)
    expect(await screen.findByRole('button', { name: 'Hủy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeInTheDocument()
  })
})
