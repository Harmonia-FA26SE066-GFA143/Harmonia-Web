import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as settingsApi from '../api/settingsApi'
import type { SystemSetting } from '../types'
import { SettingsPage } from './SettingsPage'

const settings: SystemSetting[] = [
  { id: 's1', key: 'Parish.Name', value: 'Giáo xứ Tân Định', dataType: 'string', isPublic: true },
  { id: 's2', key: 'Roster.RecentServiceDays', value: '60', dataType: 'int', isPublic: false, minValue: 1, maxValue: 365 },
  { id: 's3', key: 'Practice.AllowLateSubmission', value: 'false', dataType: 'bool', isPublic: false },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SettingsPage', () => {
  it('shows a recoverable error when the settings cannot be loaded', async () => {
    vi.spyOn(settingsApi, 'listSettings').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<SettingsPage />, '/admin/settings')

    expect(await screen.findByRole('heading', { name: 'Không thể tải cấu hình' })).toBeInTheDocument()
  })

  it('saves only the settings that changed, as the text the backend stores', async () => {
    vi.spyOn(settingsApi, 'listSettings').mockResolvedValue(settings)
    const update = vi.spyOn(settingsApi, 'updateSetting').mockResolvedValue()
    renderPage(<SettingsPage />, '/admin/settings')

    expect(await screen.findByRole('textbox', { name: 'Tên giáo xứ' })).toHaveValue('Giáo xứ Tân Định')
    expect(screen.getByText(/Từ 1 đến 365\./)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByText('Không có thay đổi nào để lưu.')).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Số ngày tính là phục vụ gần đây' }), { target: { value: '90' } })
    fireEvent.click(screen.getByRole('switch', { name: 'Cho nộp bài tập trễ hạn' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
    expect(update).toHaveBeenCalledWith('s2', '90')
    expect(update).toHaveBeenCalledWith('s3', 'true')
    expect(await screen.findByText('Đã lưu 2 thiết lập.')).toBeInTheDocument()
  })
})
