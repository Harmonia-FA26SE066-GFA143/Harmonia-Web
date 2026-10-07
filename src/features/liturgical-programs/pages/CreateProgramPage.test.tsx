import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import type { LiturgicalEvent } from '../types'
import { CreateProgramPage } from './CreateProgramPage'

const route = '/priest/programs/new'

const created: LiturgicalEvent = {
  id: 'new-1',
  date: '2026-10-04',
  time: '18:30',
  locationId: 'loc-1',
  locationName: 'Nhà thờ chính',
  massTypeId: 'mass-1',
  status: 'draft',
}

beforeEach(() => {
  vi.spyOn(categoriesApi, 'listLookup').mockImplementation(async (kind) =>
    kind === 'worshipLocations'
      ? [{ id: 'loc-1', name: 'Nhà thờ chính' }]
      : kind === 'massTypes'
        ? [{ id: 'mass-1', name: 'Thánh lễ Chúa Nhật' }]
        : [],
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function choose(label: string, option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }))
  fireEvent.click(await screen.findByTitle(option))
}

function enterTime(value: string) {
  const input = screen.getByPlaceholderText('Chọn giờ')
  fireEvent.mouseDown(input)
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
}

describe('CreateProgramPage', () => {
  it('requires date, time, place and a Mass or ceremony type', async () => {
    const create = vi.spyOn(eventsApi, 'createEvent')
    renderPage(<CreateProgramPage />, route)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))

    expect(await screen.findByText('Vui lòng chọn ngày cử hành.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng chọn giờ.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng chọn nơi cử hành.')).toBeInTheDocument()
    expect(screen.getByText('Chọn loại Thánh lễ hoặc loại nghi thức.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a draft with the date preselected from the calendar and opens it', async () => {
    const create = vi.spyOn(eventsApi, 'createEvent').mockResolvedValue(created)
    renderPage(<CreateProgramPage />, route, `${route}?date=2026-10-04`)

    expect(screen.getByDisplayValue('04/10/2026')).toBeInTheDocument()
    enterTime('18:30')
    await choose('Nơi cử hành', 'Nhà thờ chính')
    await choose('Loại Thánh lễ', 'Thánh lễ Chúa Nhật')
    fireEvent.change(screen.getByRole('textbox', { name: 'Tiêu đề (không bắt buộc)' }), { target: { value: '  Lễ Bổn mạng ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))

    await waitFor(() =>
      expect(create.mock.calls[0]?.[0]).toEqual({
        date: '2026-10-04',
        time: '18:30',
        locationId: 'loc-1',
        massTypeId: 'mass-1',
        ceremonyTypeId: undefined,
        seasonId: undefined,
        categoryId: undefined,
        title: 'Lễ Bổn mạng',
        specialRequirements: undefined,
      }),
    )
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/new-1')
  })

  it('explains a taken slot and keeps the entered values', async () => {
    vi.spyOn(eventsApi, 'createEvent').mockRejectedValue(new ApiError(409, { code: 'EVENT_SLOT_TAKEN' }))
    renderPage(<CreateProgramPage />, route, `${route}?date=2026-10-04`)

    enterTime('18:30')
    await choose('Nơi cử hành', 'Nhà thờ chính')
    await choose('Loại Thánh lễ', 'Thánh lễ Chúa Nhật')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))

    expect(await screen.findByText('Đã có sự kiện khác cùng ngày, giờ và nơi cử hành.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('04/10/2026')).toBeInTheDocument()
  })

  it('asks before leaving with unsaved input', async () => {
    renderPage(<CreateProgramPage />, route)

    fireEvent.change(screen.getByRole('textbox', { name: 'Tiêu đề (không bắt buộc)' }), { target: { value: 'Lễ Bổn mạng' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Rời khỏi trang tạo chương trình?')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ở lại' }))
    await waitFor(() => expect(screen.queryByTestId('location')).toBeNull())
    expect(screen.getByRole('textbox', { name: 'Tiêu đề (không bắt buộc)' })).toHaveValue('Lễ Bổn mạng')

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Rời khỏi trang' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs')
  })

  it('leaves without asking when nothing was entered', async () => {
    renderPage(<CreateProgramPage />, route)

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs')
  })
})
