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

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loại dữ liệu' }))
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
    // Field names and enum values in words, timestamps in Vietnam time (UTC+7).
    expect(within(dialog).getByText('Trạng thái')).toBeInTheDocument()
    expect(within(dialog).getByText('Đã gửi duyệt')).toBeInTheDocument()
    expect(within(dialog).getByText('Đã duyệt')).toBeInTheDocument()
    expect(within(dialog).getByText('Quyết định lúc')).toBeInTheDocument()
    expect(within(dialog).queryByText('2026-10-11T02:30:00Z')).toBeNull()
    expect(within(dialog).getAllByText(/11\/10\/2026 \d{2}:30/).length).toBeGreaterThan(0)
  })

  it('names the interactive score and its audited fields in words', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(
      page([
        {
          id: 'l3',
          createdAt: '2026-10-12T02:00:00Z',
          action: 'Updated',
          entityType: 'MusicMaterial',
          entityId: 'mm-1',
          oldValue: '{"MaterialType":"SheetMusic","ScoreRevision":1}',
          newValue: '{"MaterialType":"InteractiveScore","ScoreRevision":2,"ScoreSha256":"ab","PlaybackAudioSha256":"cd"}',
        },
      ]),
    )
    renderLog()

    fireEvent.click(await screen.findByRole('button', { name: /Xem chi tiết/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Bản nhạc tương tác')).toBeInTheDocument()
    expect(within(dialog).getByText('Phiên bản bản nhạc')).toBeInTheDocument()
    expect(within(dialog).getByText('Mã băm bản nhạc (SHA-256)')).toBeInTheDocument()
    expect(within(dialog).getByText('Mã băm audio phát (SHA-256)')).toBeInTheDocument()
    expect(within(dialog).queryByText('ScoreSha256')).toBeNull()
  })

  it('names the playback, lyrics and file fields of a material and its instrument in Vietnamese', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(
      page([
        {
          id: 'l4',
          createdAt: '2026-10-12T03:00:00Z',
          action: 'Updated',
          entityType: 'MusicMaterial',
          entityId: 'mm-2',
          oldValue: '{"FileRevision":1,"PlaybackInstrument":"Piano"}',
          newValue: '{"FileRevision":2,"PlaybackInstrument":"StringEnsemble","LyricsText":"Lạy Chúa","PlaybackDurationSeconds":95.5}',
        },
      ]),
    )
    renderLog()

    fireEvent.click(await screen.findByRole('button', { name: /Xem chi tiết/ }))
    const dialog = await screen.findByRole('dialog')
    for (const label of ['Phiên bản tệp', 'Nhạc cụ phát', 'Lời bài hát', 'Thời lượng bản phát (giây)', 'Piano', 'Dàn dây']) {
      expect(within(dialog).getByText(label)).toBeInTheDocument()
    }
    for (const raw of ['FileRevision', 'PlaybackInstrument', 'LyricsText', 'PlaybackDurationSeconds', 'StringEnsemble']) {
      expect(within(dialog).queryByText(raw)).toBeNull()
    }
  })

  it('labels the change type and action columns once each, and resets filters from the filter bar', async () => {
    const list = vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(page(records))
    renderLog()

    expect(await screen.findAllByRole('columnheader', { name: 'Loại thay đổi' })).toHaveLength(1)
    expect(screen.getAllByRole('columnheader', { name: 'Thao tác' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /Xem chi tiết/ })[0]).toHaveTextContent('Xem')
    expect(screen.getByRole('combobox', { name: 'Loại thay đổi' })).toBeInTheDocument()

    const reset = screen.getByRole('button', { name: 'Xoá bộ lọc' })
    expect(reset).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Chỉ xem hoạt động của Lm. Gioan' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Xoá bộ lọc' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ userId: undefined }), expect.anything()))
    expect(screen.queryByText('Người thực hiện: Lm. Gioan')).toBeNull()
  })

  it('shows "Không có" for a missing before value and closes the detail with "Đóng"', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(
      page([{ id: 'l5', createdAt: '2026-10-14T02:00:00Z', action: 'Created', entityType: 'SongList', entityId: 'sl-2', newValue: '{"Status":"Draft"}' }]),
    )
    renderLog()

    fireEvent.click(await screen.findByRole('button', { name: /Xem chi tiết/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Loại thay đổi')).toBeInTheDocument()
    expect(within(dialog).getByText('Không có')).toBeInTheDocument()
    expect(within(dialog).queryByText('—')).toBeNull()

    // The header × is also named "Đóng"; the ViewDrawer footer button is the one with visible text.
    const footerClose = within(dialog).getAllByRole('button', { name: 'Đóng' }).find((button) => button.textContent === 'Đóng')
    fireEvent.click(footerClose!)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('names director nominations, training and event choirs and their audited fields in Vietnamese', async () => {
    vi.spyOn(activityLogApi, 'listActivityLog').mockResolvedValue(
      page([
        {
          id: 'l4',
          createdAt: '2026-10-13T02:00:00Z',
          action: 'Updated',
          entityType: 'DirectorNomination',
          entityId: 'dn-1',
          oldValue: '{"Status":"Pending"}',
          newValue: '{"Status":"InTraining","ReviewNote":"Cử đi học khoá giáo phận."}',
        },
      ]),
    )
    renderPage(<ActivityLogPage />, '/admin/activity-log', '/admin/activity-log?entityType=DirectorNomination')

    expect(await screen.findAllByText('Đề cử ca trưởng')).not.toHaveLength(0)
    fireEvent.click(await screen.findByRole('button', { name: /Xem chi tiết: Cập nhật Đề cử ca trưởng/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Đang đào tạo')).toBeInTheDocument()
    expect(within(dialog).getByText('Ghi chú xem xét')).toBeInTheDocument()
  })
})
