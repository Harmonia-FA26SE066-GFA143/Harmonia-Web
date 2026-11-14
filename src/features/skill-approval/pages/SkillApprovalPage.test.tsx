import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as api from '../api/memberSkillsApi'
import type { PendingSkill } from '../types'
import { SkillApprovalPage } from './SkillApprovalPage'

const tenor: PendingSkill = {
  id: 's1',
  memberName: 'Giuse Vũ Đình Khôi',
  skillName: 'Tenor',
  categoryName: 'Bè hát',
  level: 'intermediate',
  declaredAt: '2026-11-10T02:00:00Z',
}

const page = (items: PendingSkill[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: items.length ? 1 : 0 })
const renderApproval = () => renderPage(<SkillApprovalPage />, '/director/skills')

afterEach(() => vi.restoreAllMocks())

describe('SkillApprovalPage', () => {
  it('says when no declaration is waiting', async () => {
    vi.spyOn(api, 'listPendingSkills').mockResolvedValue(page([]))
    renderApproval()

    expect(await screen.findByRole('heading', { name: 'Không có kỹ năng nào chờ duyệt' })).toBeInTheDocument()
  })

  it('approves only after the confirmation', async () => {
    vi.spyOn(api, 'listPendingSkills').mockResolvedValue(page([tenor]))
    const approve = vi.spyOn(api, 'approveSkill').mockResolvedValue()
    renderApproval()

    fireEvent.click(await screen.findByRole('button', { name: 'Duyệt Tenor của Giuse Vũ Đình Khôi' }))
    expect(approve).not.toHaveBeenCalled()
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Duyệt' }))

    await waitFor(() => expect(approve.mock.calls[0]?.[0]).toBe('s1'))
    expect(await screen.findByText('Đã duyệt Tenor của Giuse Vũ Đình Khôi.')).toBeInTheDocument()
  })

  it('asks for the reason of a rejection and sends it trimmed', async () => {
    vi.spyOn(api, 'listPendingSkills').mockResolvedValue(page([tenor]))
    const reject = vi.spyOn(api, 'rejectSkill').mockResolvedValue()
    renderApproval()

    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối Tenor của Giuse Vũ Đình Khôi' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    expect(await within(dialog).findByText('Vui lòng nhập lý do từ chối.')).toBeInTheDocument()
    expect(reject).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Lý do từ chối'), { target: { value: '  Chưa đúng bè  ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    await waitFor(() => expect(reject.mock.calls[0]).toEqual(['s1', 'Chưa đúng bè']))
  })

  it('explains a declaration another Choir Director already decided', async () => {
    vi.spyOn(api, 'listPendingSkills').mockResolvedValue(page([tenor]))
    vi.spyOn(api, 'approveSkill').mockRejectedValue(new ApiError(409, { code: 'MEMBER_SKILL_ALREADY_REVIEWED' }))
    renderApproval()

    fireEvent.click(await screen.findByRole('button', { name: 'Duyệt Tenor của Giuse Vũ Đình Khôi' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Duyệt' }))

    expect(await screen.findByText(/đã được Ca trưởng khác xử lý/)).toBeInTheDocument()
  })
})
