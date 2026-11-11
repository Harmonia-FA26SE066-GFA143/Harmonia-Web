import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as eventsApi from '../api/eventsApi'
import type { LiturgicalEvent } from '../types'
import { CreateProgramPage } from './CreateProgramPage'

const route = '/priest/programs/new'

// These four tests fill the real form: a TimePicker and up to three Ant Design selects, each of which renders its popup in
// jsdom with React in development mode inside StrictMode. That is CPU work, not waiting (about 1.2–1.6 s alone, measured
// per step, no timer or request in it), so with several test files sharing the processor it grows past the 5 s default
// (3.7 s with four runs at once, 5.8 s before the label queries below). Their own limit, not a global one; nothing is
// relaxed in what they check.
const FILL_FORM_TIMEOUT_MS = 15_000

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
        : kind === 'seasons'
          ? [{ id: 's-ot', name: 'Mùa Thường Niên' }]
          : [],
  )
  vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([
    { id: 'choir-1', name: 'Ca đoàn Cecilia', isActive: true },
    { id: 'choir-off', name: 'Ca đoàn cũ', isActive: false },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Fields are found by their label, not `getByRole('combobox', { name })`: the role query works out the accessible name of
// every candidate through jsdom's getComputedStyle against Ant Design's injected rules, 130–180 ms per call here (the
// label query takes 2–4 ms), which is what pushed these tests past 5 s when several test files ran at once. Each label
// is still the field's own (`<label for>` must point at the input), so a field that lost its label fails here too. What a
// role query would also prove, that the element is a combobox or a text box, is read straight off the element it found
// (an attribute or a tag: microseconds), so a field that stopped being one fails here as well.
const TEXT_BOX = 'input:not([type]), input[type="text"], textarea'
function field(label: string, role: 'combobox' | 'textbox' = 'textbox') {
  const element = screen.getByLabelText(label)
  if (role === 'combobox') expect(element).toHaveAttribute('role', 'combobox')
  else expect(element.matches(TEXT_BOX)).toBe(true)
  return element
}

async function choose(label: string, option: string) {
  fireEvent.mouseDown(field(label, 'combobox'))
  fireEvent.click(await screen.findByTitle(option))
}

function enterTime(value: string) {
  const input = screen.getByPlaceholderText('Chọn giờ')
  fireEvent.mouseDown(input)
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
}

describe('CreateProgramPage', () => {
  it('requires date, time, place, a Mass or ceremony type and a serving choir', async () => {
    const create = vi.spyOn(eventsApi, 'createEvent')
    renderPage(<CreateProgramPage />, route)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))

    expect(await screen.findByText('Vui lòng chọn ngày cử hành.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng chọn giờ.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng chọn nơi cử hành.')).toBeInTheDocument()
    expect(screen.getByText('Chọn loại Thánh lễ hoặc loại nghi thức.')).toBeInTheDocument()
    expect(screen.getByText('Chọn ít nhất một ca đoàn phục vụ.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  }, FILL_FORM_TIMEOUT_MS)

  it('creates a draft with the date preselected from the calendar and opens it', async () => {
    const create = vi.spyOn(eventsApi, 'createEvent').mockResolvedValue(created)
    renderPage(<CreateProgramPage />, route, `${route}?date=2026-10-04`)

    expect(screen.getByDisplayValue('04/10/2026')).toBeInTheDocument()
    enterTime('18:30')
    await choose('Nơi cử hành', 'Nhà thờ chính')
    await choose('Loại Thánh lễ', 'Thánh lễ Chúa Nhật')
    // A switched-off choir cannot serve a new event; a single choir becomes the lead by itself.
    fireEvent.mouseDown(field('Ca đoàn phục vụ', 'combobox'))
    expect(screen.queryByTitle('Ca đoàn cũ')).toBeNull()
    await choose('Ca đoàn phục vụ', 'Ca đoàn Cecilia')
    fireEvent.change(field('Tiêu đề (không bắt buộc)'), { target: { value: '  Lễ Bổn mạng ' } })
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
        choirIds: ['choir-1'],
        leadChoirId: 'choir-1',
      }),
    )
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/new-1')
  }, FILL_FORM_TIMEOUT_MS)

  it('tells which season the backend filled in when none was chosen', async () => {
    vi.spyOn(eventsApi, 'createEvent').mockResolvedValue({ ...created, seasonId: 's-ot' })
    renderPage(<CreateProgramPage />, route, `${route}?date=2026-10-04`)

    expect(screen.getByText(/Để trống thì hệ thống điền mùa/)).toBeInTheDocument()
    enterTime('18:30')
    await choose('Nơi cử hành', 'Nhà thờ chính')
    await choose('Loại Thánh lễ', 'Thánh lễ Chúa Nhật')
    await choose('Ca đoàn phục vụ', 'Ca đoàn Cecilia')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))

    expect(await screen.findByText('Đã tạo bản nháp sự kiện, mùa phụng vụ được điền là Mùa Thường Niên.')).toBeInTheDocument()
  }, FILL_FORM_TIMEOUT_MS)

  it('explains a taken slot and keeps the entered values', async () => {
    vi.spyOn(eventsApi, 'createEvent').mockRejectedValue(new ApiError(409, { code: 'LITURGICAL_EVENT_SLOT_TAKEN' }))
    renderPage(<CreateProgramPage />, route, `${route}?date=2026-10-04`)

    enterTime('18:30')
    await choose('Nơi cử hành', 'Nhà thờ chính')
    await choose('Loại Thánh lễ', 'Thánh lễ Chúa Nhật')
    await choose('Ca đoàn phục vụ', 'Ca đoàn Cecilia')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))

    expect(await screen.findByText('Đã có sự kiện khác cùng ngày, giờ và nơi cử hành.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('04/10/2026')).toBeInTheDocument()
  }, FILL_FORM_TIMEOUT_MS)

  it('asks before leaving with unsaved input', async () => {
    renderPage(<CreateProgramPage />, route)

    fireEvent.change(field('Tiêu đề (không bắt buộc)'), { target: { value: 'Lễ Bổn mạng' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Rời khỏi trang tạo chương trình?')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ở lại' }))
    await waitFor(() => expect(screen.queryByTestId('location')).toBeNull())
    expect(field('Tiêu đề (không bắt buộc)')).toHaveValue('Lễ Bổn mạng')

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
