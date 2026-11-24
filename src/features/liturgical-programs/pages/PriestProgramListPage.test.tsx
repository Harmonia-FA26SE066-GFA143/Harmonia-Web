import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as participationApi from '@/features/participation/api/participationApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { vietnamToday } from '@/lib/api/dates'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import type { LiturgicalEvent } from '../types'
import { PriestProgramListPage } from './PriestProgramListPage'

const event = (id: string, title: string, status: LiturgicalEvent['status']): LiturgicalEvent => ({
  id,
  date: '2026-10-04',
  time: '07:00',
  title,
  locationId: 'loc-1',
  locationName: 'Nhà thờ chính',
  status,
})

const page = (items: LiturgicalEvent[]): PagedList<LiturgicalEvent> => ({
  items,
  pageNumber: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: items.length ? 1 : 0,
})

const events = [event('e1', 'Lễ Chúa Nhật', 'published'), event('e2', 'Lễ Bổn mạng', 'draft')]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestProgramListPage', () => {
  it('shows a recoverable error when the events cannot be loaded', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách chương trình' })).toBeInTheDocument()
  })

  it('shows the empty state with a create action', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(page([]))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByRole('heading', { name: 'Chưa có chương trình phụng vụ nào' })).toBeInTheDocument()
    // SYS-06: the empty state keeps the only create button; the header keeps the generation.
    expect(screen.getAllByRole('button', { name: /Tạo chương trình/ })).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Tạo từ giờ lễ cố định/ })).toBeInTheDocument()
  })

  it('lists one page of events with place, time and status, and opens one', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(page(events))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    // The picked row is also read in the preview beside the table, so the rows are read in the table.
    const table = within(await screen.findByRole('table'))
    expect(await table.findByText('Lễ Chúa Nhật')).toBeInTheDocument()
    expect(table.getByText('Bản nháp')).toBeInTheDocument()
    expect(table.getAllByText('04/10/2026 · 07:00')).toHaveLength(2)
    expect(screen.getByRole('complementary', { name: /Xem trước/ })).toBeInTheDocument()
    expect(screen.getByText('2 sự kiện')).toBeInTheDocument()
    expect(table.getByRole('columnheader', { name: 'Thao tác' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết Lễ Bổn mạng ngày 04/10/2026' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/e2')
  })

  it('filters by status on the server and distinguishes no results', async () => {
    const list = vi
      .spyOn(eventsApi, 'listEvents')
      .mockImplementation(async (filters) => page(filters.status ? [] : events))
    renderPage(<PriestProgramListPage />, '/priest/programs')

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Trạng thái' }))
    fireEvent.click(await screen.findByTitle('Đã hủy'))

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'cancelled' }),
        expect.objectContaining({ pageNumber: 1, pageSize: 20 }),
      ),
    )
  })

  it('creates draft events from the active fixed Mass times for four weeks from today', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(page(events))
    vi.spyOn(categoriesApi, 'listMassSchedules').mockResolvedValue([
      { id: 'ms1', dayOfWeek: 'Sunday', time: '05:00', massTypeId: 'm1', locationId: 'loc-1', title: 'Lễ sáng sớm', isActive: true },
      { id: 'ms2', dayOfWeek: 'Monday', time: '18:00', massTypeId: 'm1', locationId: 'loc-1', title: 'Lễ chiều', isActive: false },
    ])
    vi.spyOn(categoriesApi, 'listLookup').mockImplementation(async (kind) =>
      kind === 'worshipLocations' ? [{ id: 'loc-1', name: 'Nhà thờ chính' }] : [],
    )
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([])
    const generate = vi.spyOn(eventsApi, 'generateEvents').mockResolvedValue([event('e3', 'Lễ sáng sớm', 'draft')])
    renderPage(<PriestProgramListPage />, '/priest/programs')

    fireEvent.click(await screen.findByRole('button', { name: /Tạo từ giờ lễ cố định/ }))
    const dialog = await screen.findByRole('dialog')
    // The date range takes focus first, without opening its calendar.
    const [fromInput] = within(dialog).getAllByRole('textbox').filter((input) => input.closest('.ant-picker-range'))
    await waitFor(() => expect(fromInput).toHaveFocus())
    expect(document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)')).toBeNull()
    // Only the active Mass time is used.
    expect(await within(dialog).findByText('Chúa nhật · 05:00 · Lễ sáng sớm · Nhà thờ chính')).toBeInTheDocument()
    expect(within(dialog).queryByText(/Lễ chiều/)).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo sự kiện nháp' }))

    const today = dayjs(vietnamToday())
    await waitFor(() =>
      expect(generate).toHaveBeenCalledWith(today.format('YYYY-MM-DD'), today.add(27, 'day').format('YYYY-MM-DD'), {
        choirIds: [],
        leadChoirId: undefined,
      }),
    )
    expect(await screen.findByText('Đã tạo 1 sự kiện nháp.')).toBeInTheDocument()
  })

  it('gives the created drafts the only active choir, as serving and lead choir', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(page(events))
    vi.spyOn(categoriesApi, 'listMassSchedules').mockResolvedValue([
      { id: 'ms1', dayOfWeek: 'Sunday', time: '05:00', massTypeId: 'm1', locationId: 'loc-1', title: 'Lễ sáng sớm', isActive: true },
    ])
    vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([])
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([
      { id: 'c1', name: 'Ca đoàn Cecilia', isActive: true, directorId: 'u1' },
      { id: 'c2', name: 'Ca đoàn cũ', isActive: false },
    ])
    const generate = vi
      .spyOn(eventsApi, 'generateEvents')
      .mockResolvedValue([event('e3', 'Lễ sáng sớm', 'draft'), event('e4', 'Lễ sáng sớm', 'draft')])
    const setChoirs = vi.spyOn(choirsApi, 'updateEventChoirs')
    renderPage(<PriestProgramListPage />, '/priest/programs')

    fireEvent.click(await screen.findByRole('button', { name: /Tạo từ giờ lễ cố định/ }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Ca đoàn Cecilia')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo sự kiện nháp' }))

    // B55: the choirs travel with the generation request; no per-draft update follows.
    expect(await screen.findByText('Đã tạo 2 sự kiện nháp.')).toBeInTheDocument()
    expect(generate.mock.calls[0]?.[2]).toEqual({ choirIds: ['c1'], leadChoirId: 'c1' })
    expect(setChoirs).not.toHaveBeenCalled()
  })

  it('locks the generation while the choirs cannot be loaded, and offers to retry', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(page(events))
    vi.spyOn(categoriesApi, 'listMassSchedules').mockResolvedValue([
      { id: 'ms1', dayOfWeek: 'Sunday', time: '05:00', massTypeId: 'm1', locationId: 'loc-1', title: 'Lễ sáng sớm', isActive: true },
    ])
    vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([])
    const listChoirs = vi.spyOn(choirsApi, 'listChoirs').mockRejectedValue(new ApiError(403, undefined))
    const generate = vi.spyOn(eventsApi, 'generateEvents')
    renderPage(<PriestProgramListPage />, '/priest/programs')

    fireEvent.click(await screen.findByRole('button', { name: /Tạo từ giờ lễ cố định/ }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Không thể tải danh sách ca đoàn.')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Tạo sự kiện nháp' })).toBeDisabled()

    const calls = listChoirs.mock.calls.length
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(listChoirs.mock.calls.length).toBeGreaterThan(calls))
    expect(generate).not.toHaveBeenCalled()
  })

  it('publishes the selected upcoming drafts, invites their members and names each refusal', async () => {
    const soon = dayjs(vietnamToday()).add(7, 'day').format('YYYY-MM-DD')
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue(
      page([event('e1', 'Lễ Chúa Nhật', 'published'), { ...event('e2', 'Lễ Bổn mạng', 'draft'), date: soon }, { ...event('e3', 'Lễ sáng', 'draft'), date: soon }, event('e4', 'Lễ đã qua', 'draft')]),
    )
    const publish = vi
      .spyOn(eventsApi, 'publishEvent')
      .mockImplementation(async (id) => {
        if (id === 'e3') throw new ApiError(409, { code: 'LITURGICAL_EVENT_CHOIR_REQUIRED' })
      })
    const invite = vi.spyOn(participationApi, 'sendParticipationRequests').mockResolvedValue(3)
    renderPage(<PriestProgramListPage />, '/priest/programs')

    // A published event and a past draft cannot be chosen.
    expect(await screen.findByRole('checkbox', { name: /Chọn Lễ Chúa Nhật/ })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /Chọn Lễ đã qua/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /Chọn Lễ Bổn mạng/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Chọn Lễ sáng/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Công bố 2 sự kiện đã chọn' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Công bố' }))

    expect((await screen.findAllByText('Đã công bố 1 trên 2 sự kiện')).length).toBeGreaterThan(0)
    expect(screen.getByText(/Lễ sáng: Chọn ca đoàn phục vụ và ca đoàn phụ trách/)).toBeInTheDocument()
    expect(publish.mock.calls.map(([id]) => id)).toEqual(['e2', 'e3'])
    expect(invite.mock.calls).toEqual([['e2']])
  })
})
