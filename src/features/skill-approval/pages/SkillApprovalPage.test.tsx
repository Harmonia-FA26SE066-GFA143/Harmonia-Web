import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import { renderPage } from '@/test/renderPage'
import * as memberSkillsApi from '../api/memberSkillsApi'
import type { PendingSkill } from '../types'
import { SkillApprovalPage } from './SkillApprovalPage'

const skills: PendingSkill[] = [
  { id: 's1', memberName: 'Maria Lan', skillName: 'Soprano', categoryName: 'Bè', level: 'advanced', declaredAt: '2026-11-10T02:00:00Z' },
  {
    id: 's2',
    memberName: 'Giuse Minh',
    skillName: 'Organ',
    categoryName: 'Nhạc cụ',
    declaredAt: '2026-11-11T02:00:00Z',
    evidence: { kind: 'voice', fileName: 'organ.m4a', url: 'https://files/organ.m4a' },
  },
]

const page = (items: PendingSkill[]): PagedList<PendingSkill> => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })

const renderSkills = () => renderPage(<SkillApprovalPage />, '/director/skill-approval')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SkillApprovalPage', () => {
  it('lists the pending declarations with level and evidence', async () => {
    vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue(page(skills))
    renderSkills()

    expect(await screen.findByText('2 kỹ năng chờ duyệt')).toBeInTheDocument()
    expect(screen.getByText('Nâng cao')).toBeInTheDocument()
    expect(screen.getByText('Không gửi')).toBeInTheDocument()
    expect(screen.getByLabelText('Nghe minh chứng Organ của Giuse Minh')).toHaveAttribute('src', 'https://files/organ.m4a')
  })

  it('says when nothing waits', async () => {
    vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue(page([]))
    renderSkills()
    expect(await screen.findByText('Không có kỹ năng nào chờ duyệt')).toBeInTheDocument()
  })

  it('shows an error state when the list cannot load', async () => {
    vi.spyOn(memberSkillsApi, 'listPendingSkills').mockRejectedValue(new ApiError(403, {}))
    renderSkills()
    expect(await screen.findByText('Không thể tải kỹ năng chờ duyệt')).toBeInTheDocument()
  })

  it('approves after confirmation and reloads the list', async () => {
    const list = vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue(page(skills))
    const approve = vi.spyOn(memberSkillsApi, 'approveSkill').mockResolvedValue()
    renderSkills()

    fireEvent.click(await screen.findByRole('button', { name: 'Duyệt Soprano của Maria Lan' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Maria Lan sẽ được ghi nhận kỹ năng Soprano/)).toBeInTheDocument()
    list.mockResolvedValue(page([skills[1]]))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Duyệt' }))

    await waitFor(() => expect(approve).toHaveBeenCalledWith('s1'))
    expect(await screen.findByText('Đã duyệt Soprano của Maria Lan.')).toBeInTheDocument()
    expect(await screen.findByText('1 kỹ năng chờ duyệt')).toBeInTheDocument()
  })

  it('requires a reason to reject and sends it trimmed', async () => {
    vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue(page(skills))
    const reject = vi.spyOn(memberSkillsApi, 'rejectSkill').mockResolvedValue()
    renderSkills()

    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối Organ của Giuse Minh' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    expect(await within(dialog).findByText('Vui lòng nhập lý do từ chối.')).toBeInTheDocument()
    expect(reject).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Lý do từ chối'), { target: { value: '  Chưa đủ minh chứng  ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    await waitFor(() => expect(reject).toHaveBeenCalledWith('s2', 'Chưa đủ minh chứng'))
    expect(await screen.findByText('Đã từ chối Organ của Giuse Minh.')).toBeInTheDocument()
  })

  // jsdom runs no CSS animation, so a closed Ant Design modal stays in the DOM in its leave state.
  async function rejectFailing(error: ApiError) {
    vi.spyOn(memberSkillsApi, 'listPendingSkills').mockResolvedValue(page(skills))
    vi.spyOn(memberSkillsApi, 'rejectSkill').mockRejectedValue(error)
    renderSkills()
    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối Organ của Giuse Minh' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Lý do từ chối'), { target: { value: 'Trùng' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    return dialog
  }

  it('keeps the reject dialog and the reason on an ordinary failure', async () => {
    const dialog = await rejectFailing(new ApiError(400, { code: 'OTHER' }))
    expect(await screen.findByText('Không thể từ chối kỹ năng. Vui lòng thử lại.')).toBeInTheDocument()
    expect(dialog).not.toHaveClass('ant-zoom-leave')
    expect(within(dialog).getByLabelText('Lý do từ chối')).toHaveValue('Trùng')
  })

  it('closes the reject dialog when another director already decided', async () => {
    const dialog = await rejectFailing(new ApiError(409, { code: 'MEMBER_SKILL_ALREADY_REVIEWED' }))
    expect(await screen.findByText('Khai báo này đã được Ca trưởng khác xử lý. Danh sách đã được tải lại.')).toBeInTheDocument()
    await waitFor(() => expect(dialog).toHaveClass('ant-zoom-leave'))
  })
})
