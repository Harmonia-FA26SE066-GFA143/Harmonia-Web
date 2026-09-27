import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as programsApi from '../api/programsApi'
import { CreateProgramPage } from './CreateProgramPage'

const route = '/priest/programs/new'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CreateProgramPage', () => {
  it('requires the event name and date', async () => {
    const create = vi.spyOn(programsApi, 'createProgram')
    renderPage(<CreateProgramPage />, route)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu chương trình' }))

    expect(await screen.findByText('Vui lòng nhập tên sự kiện.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng chọn ngày cử hành.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a program with the date preselected from the calendar and opens it', async () => {
    const create = vi
      .spyOn(programsApi, 'createProgram')
      .mockResolvedValue({ id: 'new-1', eventName: 'Lễ Bổn mạng', date: '2026-10-04' })
    renderPage(<CreateProgramPage />, route, `${route}?date=2026-10-04`)

    expect(screen.getByDisplayValue('04/10/2026')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Tên sự kiện' }), { target: { value: '  Lễ Bổn mạng ' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Yêu cầu đặc biệt (không bắt buộc)' }), {
      target: { value: 'Có rước kiệu' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chương trình' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        eventName: 'Lễ Bổn mạng',
        date: '2026-10-04',
        seasonId: undefined,
        massTypeId: undefined,
        ceremonyTypeId: undefined,
        specialRequirements: 'Có rước kiệu',
      }),
    )
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/new-1')
  })

  it('keeps the entered values when saving fails', async () => {
    vi.spyOn(programsApi, 'createProgram').mockRejectedValue(new Error('offline'))
    renderPage(<CreateProgramPage />, route, `${route}?date=2026-10-04`)

    fireEvent.change(screen.getByRole('textbox', { name: 'Tên sự kiện' }), { target: { value: 'Lễ Bổn mạng' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chương trình' }))

    expect(await screen.findByText('Không thể lưu chương trình. Vui lòng thử lại.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Tên sự kiện' })).toHaveValue('Lễ Bổn mạng')
  })

  it('asks before leaving with unsaved input', async () => {
    renderPage(<CreateProgramPage />, route)

    fireEvent.change(screen.getByRole('textbox', { name: 'Tên sự kiện' }), { target: { value: 'Lễ Bổn mạng' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Rời khỏi trang tạo chương trình?')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ở lại' }))
    await waitFor(() => expect(screen.queryByTestId('location')).toBeNull())
    expect(screen.getByRole('textbox', { name: 'Tên sự kiện' })).toHaveValue('Lễ Bổn mạng')

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
