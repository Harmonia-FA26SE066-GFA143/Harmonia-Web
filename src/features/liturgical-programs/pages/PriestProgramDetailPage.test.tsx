import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import type { LiturgicalEvent } from '../types'
import { PriestProgramDetailPage } from './PriestProgramDetailPage'

const draft: LiturgicalEvent = {
  id: 'e1',
  date: '2099-09-27',
  time: '07:00',
  title: 'Lễ Chúa Nhật XXVI',
  locationId: 'loc-1',
  locationName: 'Nhà thờ chính',
  seasonId: 'season-5',
  massTypeId: 'mass-1',
  specialRequirements: 'Ưu tiên bài hát theo chủ đề Lời Chúa.',
  status: 'draft',
}

// The page reads :programId, so it is rendered under the parameterised route.
const renderDetail = () => renderPage(<PriestProgramDetailPage />, '/priest/programs/:programId', '/priest/programs/e1')

const confirmDialog = async (title: string) =>
  (await screen.findAllByText(title))[0].closest('.ant-modal') as HTMLElement

beforeEach(() => {
  vi.spyOn(categoriesApi, 'listLookup').mockImplementation(async (kind) =>
    kind === 'seasons'
      ? [{ id: 'season-5', name: 'Mùa Thường Niên' }]
      : kind === 'massTypes'
        ? [{ id: 'mass-1', name: 'Thánh lễ Chúa Nhật' }]
        : kind === 'worshipLocations'
          ? [{ id: 'loc-1', name: 'Nhà thờ chính' }]
          : [],
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestProgramDetailPage', () => {
  it('shows a recoverable error when the event cannot be loaded', async () => {
    vi.spyOn(eventsApi, 'getEvent').mockRejectedValue(new ApiError(403, undefined))
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không thể tải chương trình' })).toBeInTheDocument()
  })

  it('shows the not-found state for an unknown event', async () => {
    vi.spyOn(eventsApi, 'getEvent').mockResolvedValue(null)
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy chương trình phụng vụ' })).toBeInTheDocument()
  })

  it('shows every field of a draft with its catalog names', async () => {
    const get = vi.spyOn(eventsApi, 'getEvent').mockResolvedValue(draft)
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1, name: 'Lễ Chúa Nhật XXVI' })).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('e1')
    expect(screen.getByText('Bản nháp')).toBeInTheDocument()
    expect(await screen.findByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getByText('Thánh lễ Chúa Nhật')).toBeInTheDocument()
    expect(screen.getByText('Ưu tiên bài hát theo chủ đề Lời Chúa.')).toBeInTheDocument()
    expect(screen.getByText(/Chưa có danh sách bài hát/)).toBeInTheDocument()
  })

  it('publishes a draft after confirmation', async () => {
    vi.spyOn(eventsApi, 'getEvent').mockResolvedValue(draft)
    const publish = vi.spyOn(eventsApi, 'publishEvent').mockResolvedValue()
    renderDetail()

    fireEvent.click(await screen.findByRole('button', { name: 'Công bố' }))
    fireEvent.click(within(await confirmDialog('Công bố sự kiện?')).getByRole('button', { name: 'Công bố' }))

    await waitFor(() => expect(publish.mock.calls[0]?.[0]).toBe('e1'))
    expect(await screen.findByText('Đã công bố sự kiện.')).toBeInTheDocument()
  })

  it('cancels a published event, warning that members are notified', async () => {
    vi.spyOn(eventsApi, 'getEvent').mockResolvedValue({ ...draft, status: 'published', publishedAt: '2026-09-20T02:00:00Z' })
    const cancel = vi.spyOn(eventsApi, 'cancelEvent').mockResolvedValue()
    renderDetail()

    expect(await screen.findByText('Đã công bố')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Công bố' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Hủy sự kiện/ }))
    const dialog = await confirmDialog('Hủy sự kiện?')
    expect(within(dialog).getByText(/sẽ nhận thông báo hủy/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy sự kiện' }))

    await waitFor(() => expect(cancel.mock.calls[0]?.[0]).toBe('e1'))
  })

  it('offers no action on a cancelled event and no cancel on a past one', async () => {
    const get = vi.spyOn(eventsApi, 'getEvent').mockResolvedValue({ ...draft, status: 'cancelled' })
    const { unmount } = renderDetail()

    expect(await screen.findByText('Đã hủy')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sửa/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Hủy sự kiện/ })).toBeNull()
    unmount()

    get.mockResolvedValue({ ...draft, date: '2020-01-05' })
    renderDetail()
    expect(await screen.findByRole('button', { name: /Sửa/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Hủy sự kiện/ })).toBeNull()
  })

  it('edits the event in a dialog with its current values', async () => {
    vi.spyOn(eventsApi, 'getEvent').mockResolvedValue(draft)
    const update = vi.spyOn(eventsApi, 'updateEvent').mockResolvedValue({ ...draft, title: 'Lễ Bổn mạng' })
    renderDetail()

    fireEvent.click(await screen.findByRole('button', { name: /Sửa/ }))
    const dialog = await screen.findByRole('dialog')
    const title = within(dialog).getByRole('textbox', { name: 'Tiêu đề (không bắt buộc)' })
    expect(title).toHaveValue('Lễ Chúa Nhật XXVI')
    fireEvent.change(title, { target: { value: 'Lễ Bổn mạng' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('e1', {
        date: '2099-09-27',
        time: '07:00',
        locationId: 'loc-1',
        seasonId: 'season-5',
        massTypeId: 'mass-1',
        ceremonyTypeId: undefined,
        categoryId: undefined,
        title: 'Lễ Bổn mạng',
        specialRequirements: 'Ưu tiên bài hát theo chủ đề Lời Chúa.',
      }),
    )
  })
})
