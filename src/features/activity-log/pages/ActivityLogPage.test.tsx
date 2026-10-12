import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as activityLogApi from '../api/activityLogApi'
import type { ActivityRecord } from '../types'
import { ActivityLogPage } from './ActivityLogPage'

const records: ActivityRecord[] = [
  {
    id: 'l1',
    createdAt: '2026-10-11T02:30:00Z',
    user: { id: 'u1', fullName: 'Lm. Gioan', email: 'gioan@giaoxu.org' },
    action: 'Updated',
    entityType: 'SongList',
    entityId: 'sl-1',
    oldValue: '{"Status":"Submitted"}',
    newValue: '{"Status":"Approved","DecidedAt":"2026-10-11T02:30:00Z"}',
    ipAddress: '10.0.0.5',
  },
  { id: 'l2', createdAt: '2026-10-10T08:00:00Z', action: 'PasswordChanged', entityType: 'User', entityId: 'u9' },
]

const page = (items: ActivityRecord[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })

const renderLog = () => renderPage(<ActivityLogPage />, '/admin/activity-log')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ActivityLogPage', () => {
  it('shows a recoverable error when the log cannot be loaded', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockRejectedValue(new ApiError(403, undefined))
    renderLog()

    expect(await screen.findByRole('heading', { name: 'Không thể tải lịch sử hoạt động' })).toBeInTheDocument()
  })

  it('explains an empty log', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(page([]))
    renderLog()

    expect(await screen.findByRole('heading', { name: 'Chưa có hoạt động nào' })).toBeInTheDocument()
  })

  it('filters on the server, by data type and by the person picked in the table', async () => {
    const list = vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(page(records))
    renderLog()

    expect(await screen.findByText('Không đăng nhập')).toBeInTheDocument()
    expect(screen.getByText('Đổi mật khẩu')).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith(
      { entityType: undefined, action: undefined, fromDate: undefined, userId: undefined },
      { pageNumber: 1, pageSize: 20 },
    )

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Lọc theo loại dữ liệu' }))
    fireEvent.click(await screen.findByTitle('Danh sách bài hát'))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ entityType: 'SongList' }), expect.anything()))

    fireEvent.click(screen.getByRole('button', { name: 'Chỉ xem hoạt động của Lm. Gioan' }))
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ entityType: 'SongList', userId: 'u1' }), expect.anything()),
    )
    expect(screen.getByText('Người thực hiện: Lm. Gioan')).toBeInTheDocument()
  })

  it('shows the values before and after a change', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(page(records))
    renderLog()

    fireEvent.click(await screen.findByRole('button', { name: /Xem chi tiết: Cập nhật Danh sách bài hát/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Lm. Gioan (gioan@giaoxu.org)')).toBeInTheDocument()
    expect(within(dialog).getByText('10.0.0.5')).toBeInTheDocument()
    expect(within(dialog).getByText('Submitted')).toBeInTheDocument()
    expect(within(dialog).getByText('Approved')).toBeInTheDocument()
    expect(within(dialog).getByText('DecidedAt')).toBeInTheDocument()
  })
})
