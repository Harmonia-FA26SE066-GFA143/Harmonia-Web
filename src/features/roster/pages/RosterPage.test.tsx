import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as participationApi from '@/features/participation/api/participationApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { renderPage } from '@/test/renderPage'
import * as rosterApi from '../api/rosterApi'
import type { Roster } from '../types'
import { RosterPage } from './RosterPage'

const renderRoster = () => renderPage(<RosterPage />, '/director/roster', '/director/roster?programId=p1')

const roster: Roster = {
  programId: 'p1',
  requirements: [{ id: 'req-1', songId: 's1', skill: { id: 'k-tenor', name: 'Tenor' }, count: 2 }],
  assignments: [{ requirementId: 'req-1', memberId: 'm1', fullName: 'Giuse Vũ Đình Khôi' }],
}

const withApprovedList = () =>
  vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({
    programId: 'p1',
    status: 'approved',
    items: [{ id: 'i1', songId: 's1', title: 'Con Bước Lên Bàn Thờ', liturgicalPart: 'Ca nhập lễ' }],
  })

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([
    { id: 'p1', eventName: 'Thánh lễ Hôn Phối', date: dayjs().add(5, 'day').format('YYYY-MM-DD'), songListStatus: 'approved' },
  ])
  vi.spyOn(categoriesApi, 'listSkillCategories').mockResolvedValue([
    { id: 'k-tenor', name: 'Tenor' },
    { id: 'k-organ', name: 'Organ' },
  ])
  vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
    { memberId: 'm1', fullName: 'Giuse Vũ Đình Khôi', skills: ['Tenor'], response: 'confirmed' },
    { memberId: 'm2', fullName: 'Giuse Nguyễn Hoàng Long', skills: ['Tenor'], response: 'confirmed' },
    { memberId: 'm3', fullName: 'Vinhsơn Nguyễn Văn Hưng', skills: ['Tenor'], response: 'unsure' },
    { memberId: 'm4', fullName: 'Simon Phan Văn Đức', skills: ['Bass'], response: 'confirmed' },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RosterPage', () => {
  it('shows a recoverable error while the API contract is missing', async () => {
    withApprovedList()
    renderRoster()

    expect(await screen.findByRole('heading', { name: 'Không thể tải dữ liệu phân công' })).toBeInTheDocument()
  })

  it('needs an approved song list', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({ programId: 'p1', status: 'submitted', items: [] })
    renderRoster()

    expect(await screen.findByRole('heading', { name: 'Chưa có danh sách bài hát đã duyệt' })).toBeInTheDocument()
  })

  it('warns about shortages and offers only confirmed members with the skill', async () => {
    withApprovedList()
    vi.spyOn(rosterApi, 'getRoster').mockResolvedValue(roster)
    const save = vi.spyOn(rosterApi, 'saveRoster').mockResolvedValue(roster)
    renderRoster()

    expect(await screen.findByText('Con Bước Lên Bàn Thờ: thiếu 1 Tenor')).toBeInTheDocument()
    fireEvent.mouseDown(within(screen.getByLabelText('Ca viên cho Tenor').closest('.ant-select') as HTMLElement).getByRole('combobox'))
    expect(await screen.findByRole('option', { name: 'Giuse Nguyễn Hoàng Long' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Vinhsơn Nguyễn Văn Hưng' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Simon Phan Văn Đức' })).toBeNull()

    fireEvent.click(await screen.findByTitle('Giuse Nguyễn Hoàng Long'))
    fireEvent.click(screen.getByRole('button', { name: /Lưu phân công/ }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('p1', {
        requirements: roster.requirements,
        assignments: [
          { requirementId: 'req-1', memberId: 'm1', fullName: 'Giuse Vũ Đình Khôi' },
          { requirementId: 'req-1', memberId: 'm2', fullName: 'Giuse Nguyễn Hoàng Long' },
        ],
      }),
    )
  })

  it('keeps a member who is no longer eligible but does not count them', async () => {
    withApprovedList()
    vi.spyOn(rosterApi, 'getRoster').mockResolvedValue({
      ...roster,
      requirements: [{ ...roster.requirements[0], count: 1 }],
      assignments: [{ requirementId: 'req-1', memberId: 'm3', fullName: 'Vinhsơn Nguyễn Văn Hưng' }],
    })
    renderRoster()

    expect(await screen.findByText('Vinhsơn Nguyễn Văn Hưng (không còn đủ điều kiện)')).toBeInTheDocument()
    expect(screen.getByText('Con Bước Lên Bàn Thờ: thiếu 1 Tenor')).toBeInTheDocument()
  })

  it('applies the chosen suggestions', async () => {
    withApprovedList()
    vi.spyOn(rosterApi, 'getRoster').mockResolvedValue(roster)
    vi.spyOn(rosterApi, 'getRosterSuggestions').mockResolvedValue([
      { requirementId: 'req-1', memberId: 'm2', fullName: 'Giuse Nguyễn Hoàng Long' },
    ])
    renderRoster()

    fireEvent.click(await screen.findByRole('button', { name: /Gợi ý nhân sự/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Áp dụng 1 gợi ý' }))

    await waitFor(() => expect(screen.queryByText(/Còn thiếu người/)).toBeNull())
    expect(screen.getByRole('button', { name: /Lưu phân công/ })).toBeEnabled()
  })
})
