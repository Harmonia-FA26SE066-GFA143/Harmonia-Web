import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as participationApi from '@/features/participation/api/participationApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as rosterApi from '../api/rosterApi'
import type { ServiceRoster } from '../types'
import { RosterPage } from './RosterPage'

const renderRoster = () => renderPage(<RosterPage />, '/director/roster', '/director/roster?programId=p1')

const roster: ServiceRoster = {
  id: 'r1',
  status: 'draft',
  assignments: [
    {
      id: 'a1',
      memberId: 'm1',
      memberName: 'Giuse Vũ Đình Khôi',
      skillId: 'k-tenor',
      skillName: 'Tenor',
      songListItemId: 'i1',
      source: 'manual',
    },
  ],
}

const tenorShort = {
  songListItemId: 'i1',
  songTitle: 'Con Bước Lên Bàn Thờ',
  skillId: 'k-tenor',
  skillName: 'Tenor',
  requiredCount: 2,
  assignedCount: 1,
}

const withApprovedList = () =>
  vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({
    programId: 'p1',
    status: 'approved',
    items: [{ id: 'i1', songId: 's1', title: 'Con Bước Lên Bàn Thờ', liturgicalPart: 'Ca nhập lễ' }],
  })

const withRoster = (value: ServiceRoster | null, shortages = [tenorShort]) => {
  withApprovedList()
  vi.spyOn(rosterApi, 'getRoster').mockResolvedValue(value)
  vi.spyOn(rosterApi, 'getShortages').mockResolvedValue(shortages)
  vi.spyOn(rosterApi, 'getPersonnelRequirements').mockResolvedValue([{ skillId: 'k-tenor', skillName: 'Tenor', requiredCount: 2 }])
}

// Ant Design renders a confirm title twice; the first one sits in the visible dialog.
const confirmDialog = async (title: string) => (await screen.findAllByText(title))[0].closest('.ant-modal') as HTMLElement

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([
    { id: 'p1', eventName: 'Thánh lễ Hôn Phối', date: dayjs().add(5, 'day').format('YYYY-MM-DD'), songListStatus: 'approved' },
  ])
  vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([
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
  it('needs an approved song list', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({ programId: 'p1', status: 'submitted', items: [] })
    renderRoster()

    expect(await screen.findByRole('heading', { name: 'Chưa có danh sách bài hát đã duyệt' })).toBeInTheDocument()
  })

  it('shows a recoverable error when the roster cannot be loaded', async () => {
    withApprovedList()
    vi.spyOn(rosterApi, 'getRoster').mockRejectedValue(new ApiError(403, undefined))
    vi.spyOn(rosterApi, 'getShortages').mockResolvedValue([])
    renderRoster()

    expect(await screen.findByRole('heading', { name: 'Không thể tải phân công' })).toBeInTheDocument()
  })

  it('shows the backend shortages and adds only confirmed members holding the skill', async () => {
    withRoster(roster)
    const add = vi.spyOn(rosterApi, 'addAssignment').mockResolvedValue()
    renderRoster()

    expect(await screen.findByText('Con Bước Lên Bàn Thờ: thiếu 1 Tenor')).toBeInTheDocument()
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Thêm ca viên cho Tenor' }))
    expect(await screen.findByRole('option', { name: 'Giuse Nguyễn Hoàng Long' })).toBeInTheDocument()
    // Already on the position, not confirmed, or without the skill.
    expect(screen.queryByRole('option', { name: 'Giuse Vũ Đình Khôi' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Vinhsơn Nguyễn Văn Hưng' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Simon Phan Văn Đức' })).toBeNull()

    fireEvent.click(await screen.findByTitle('Giuse Nguyễn Hoàng Long'))
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith({ eventId: 'p1', songListItemId: 'i1', skillId: 'k-tenor', memberId: 'm2' }),
    )
  })

  it('saves the requirements of a song as a set', async () => {
    withRoster(null)
    const save = vi.spyOn(rosterApi, 'savePersonnelRequirements').mockResolvedValue()
    renderRoster()

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Kỹ năng cần thêm cho Con Bước Lên Bàn Thờ' }))
    fireEvent.click(await screen.findByTitle('Organ'))
    fireEvent.click(screen.getByRole('button', { name: /Thêm yêu cầu/ }))
    // A new position takes members only once saved.
    expect(screen.getByText('Lưu yêu cầu trước khi phân công.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Lưu yêu cầu/ }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('i1', [
        { skillId: 'k-tenor', skillName: 'Tenor', requiredCount: 2 },
        { skillId: 'k-organ', skillName: 'Organ', requiredCount: 1 },
      ]),
    )
  })

  it('asks before replacing earlier suggestions', async () => {
    withRoster({ ...roster, status: 'suggested', assignments: [{ ...roster.assignments[0], source: 'suggested' }] })
    const suggest = vi.spyOn(rosterApi, 'suggestRoster').mockResolvedValue({ roster, isAiGenerated: false })
    renderRoster()

    fireEvent.click(await screen.findByRole('button', { name: /Gợi ý phân công/ }))
    const confirm = await confirmDialog('Gợi ý lại phân công?')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Gợi ý lại' }))

    await waitFor(() => expect(suggest).toHaveBeenCalledWith('p1'))
    expect(await screen.findByText('Đã gợi ý phân công theo quy tắc dự phòng của hệ thống.')).toBeInTheDocument()
  })

  it('finalizes with shortages, and only then notifies', async () => {
    withRoster(roster)
    const finalize = vi.spyOn(rosterApi, 'finalizeRoster').mockResolvedValue()
    renderRoster()

    expect(await screen.findByRole('button', { name: /Gửi thông báo phân công/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Chốt phân công/ }))
    const confirm = await confirmDialog('Chốt phân công?')
    expect(within(confirm).getByText(/Còn 1 vị trí thiếu người/)).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole('button', { name: 'Chốt phân công' }))

    await waitFor(() => expect(finalize).toHaveBeenCalledWith('r1'))
  })

  it('is read-only once finalized and notifies the chosen members', async () => {
    withRoster({ ...roster, status: 'finalized' })
    const notify = vi.spyOn(rosterApi, 'sendRosterNotifications').mockResolvedValue()
    renderRoster()

    expect(await screen.findByText('Phân công đã chốt. Yêu cầu nhân sự và phân công chỉ còn xem.')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Thêm ca viên cho Tenor' })).toBeNull()
    expect(screen.getByRole('button', { name: /Gợi ý phân công/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /Gửi thông báo phân công/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi cho 1 thành viên' }))

    await waitFor(() => expect(notify).toHaveBeenCalledWith('r1', ['m1']))
  })
})
