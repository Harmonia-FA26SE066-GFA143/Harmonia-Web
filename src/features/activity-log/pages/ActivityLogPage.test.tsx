import { fireEvent, screen, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as activityLogApi from '../api/activityLogApi'
import type { ActivityRecord } from '../types'
import { ActivityLogPage } from './ActivityLogPage'

const records: ActivityRecord[] = [
  {
    id: 'l1',
    occurredAt: dayjs().subtract(1, 'hour').toISOString(),
    actorName: 'Lm. Gioan',
    actorRole: 'priest',
    type: 'songListApproval',
    target: 'Lễ Chúa Nhật',
    details: 'Phê duyệt 5 bài hát.',
  },
  {
    id: 'l2',
    occurredAt: dayjs().subtract(40, 'day').toISOString(),
    actorName: 'Quản trị viên',
    actorRole: 'admin',
    type: 'roleChange',
    target: 'Tài khoản Anna',
  },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ActivityLogPage', () => {
  it('shows a recoverable error while the activity API contract is missing', async () => {
    renderPage(<ActivityLogPage />, '/admin/activity-log')

    expect(await screen.findByRole('heading', { name: 'Không thể tải lịch sử hoạt động' })).toBeInTheDocument()
  })

  it('shows the empty state when nothing has been recorded', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue([])
    renderPage(<ActivityLogPage />, '/admin/activity-log')

    expect(await screen.findByRole('heading', { name: 'Chưa có hoạt động nào' })).toBeInTheDocument()
  })

  it('lists FE-54 activities and filters them by keyword', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(records)
    renderPage(<ActivityLogPage />, '/admin/activity-log')

    expect(await screen.findByText('Duyệt danh sách bài hát')).toBeInTheDocument()
    expect(screen.getByText('Thay đổi vai trò')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm hoạt động' }), { target: { value: 'anna' } })
    expect(screen.queryByText('Lễ Chúa Nhật')).toBeNull()
    expect(screen.getByText('1 bản ghi')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm hoạt động' }), { target: { value: 'không-có' } })
    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
  })

  it('opens the read-only detail of a record', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(records)
    renderPage(<ActivityLogPage />, '/admin/activity-log')

    fireEvent.click(await screen.findByRole('button', { name: 'Xem chi tiết: Duyệt danh sách bài hát – Lễ Chúa Nhật' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Phê duyệt 5 bài hát.')).toBeInTheDocument()
    expect(within(dialog).getByText('Lm. Gioan (Cha xứ / Ban phụng vụ)')).toBeInTheDocument()
  })
})
