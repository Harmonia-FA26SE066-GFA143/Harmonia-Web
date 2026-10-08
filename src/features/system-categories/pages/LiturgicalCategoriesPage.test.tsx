import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as categoriesApi from '../api/categoriesApi'
import type { LiturgicalSeason } from '../types'
import { LiturgicalCategoriesPage } from './LiturgicalCategoriesPage'

const advent: LiturgicalSeason = {
  id: 's1',
  name: 'Mùa Vọng',
  startDate: '2026-11-29',
  endDate: '2026-12-24',
  colorHex: '#6B3FA0',
  isActive: true,
}

afterEach(() => {
  vi.restoreAllMocks()
})

function enterDate(placeholderIndex: number, value: string) {
  const input = screen.getAllByPlaceholderText('Chọn ngày')[placeholderIndex]
  fireEvent.mouseDown(input)
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
}

describe('LiturgicalCategoriesPage', () => {
  it('offers the four FE-50 catalogs as tabs', async () => {
    vi.spyOn(categoriesApi, 'listSeasons').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<LiturgicalCategoriesPage />, '/admin/liturgical-categories')

    for (const name of ['Mùa phụng vụ', 'Loại Thánh lễ', 'Loại nghi thức', 'Danh mục sự kiện']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(await screen.findByRole('heading', { name: 'Không thể tải danh mục mùa phụng vụ' })).toBeInTheDocument()
  })

  it('shows season dates and colour, and loads the catalog of the selected tab', async () => {
    vi.spyOn(categoriesApi, 'listSeasons').mockResolvedValue([advent])
    const list = vi
      .spyOn(categoriesApi, 'listCatalogItems')
      .mockResolvedValue([{ id: 'm1', name: 'Lễ Chúa Nhật', description: null, isActive: true }])
    renderPage(<LiturgicalCategoriesPage />, '/admin/liturgical-categories')

    expect(await screen.findByText('Mùa Vọng')).toBeInTheDocument()
    expect(screen.getByText('29/11/2026 – 24/12/2026')).toBeInTheDocument()
    expect(screen.getByText('#6B3FA0')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Loại Thánh lễ' }))
    expect(await screen.findByText('Lễ Chúa Nhật')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thêm loại Thánh lễ/ })).toBeInTheDocument()
    await waitFor(() => expect(list).toHaveBeenCalledWith('massTypes'))
  })

  it('requires the end of a season to come after its start', async () => {
    vi.spyOn(categoriesApi, 'listSeasons').mockResolvedValue([advent])
    const save = vi.spyOn(categoriesApi, 'saveSeason')
    renderPage(<LiturgicalCategoriesPage />, '/admin/liturgical-categories')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm mùa phụng vụ/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên mùa phụng vụ' }), { target: { value: 'Mùa Giáng Sinh' } })
    enterDate(0, '10/01/2027')
    enterDate(1, '25/12/2026')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    expect(await within(dialog).findByText('Ngày kết thúc phải sau ngày bắt đầu.')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })

  it('adds a season with its dates and reports an overlap from the backend', async () => {
    vi.spyOn(categoriesApi, 'listSeasons').mockResolvedValue([advent])
    const save = vi
      .spyOn(categoriesApi, 'saveSeason')
      .mockRejectedValue(new ApiError(409, { code: 'SEASON_DATE_OVERLAP' }))
    renderPage(<LiturgicalCategoriesPage />, '/admin/liturgical-categories')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm mùa phụng vụ/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên mùa phụng vụ' }), { target: { value: 'Mùa Giáng Sinh' } })
    enterDate(0, '20/12/2026')
    enterDate(1, '10/01/2027')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(undefined, {
        name: 'Mùa Giáng Sinh',
        startDate: '2026-12-20',
        endDate: '2027-01-10',
        isActive: true,
      }),
    )
    expect(await screen.findByText('Khoảng ngày này trùng với một mùa phụng vụ khác đang dùng.')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tên mùa phụng vụ' })).toHaveValue('Mùa Giáng Sinh')
  })
})
