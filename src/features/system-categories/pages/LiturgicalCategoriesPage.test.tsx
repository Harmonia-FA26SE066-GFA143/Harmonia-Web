import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as categoriesApi from '../api/categoriesApi'
import type { LiturgicalCatalog } from '../types'
import { LiturgicalCategoriesPage } from './LiturgicalCategoriesPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LiturgicalCategoriesPage', () => {
  it('offers the four FE-50 catalogs as tabs', async () => {
    renderPage(<LiturgicalCategoriesPage />, '/admin/liturgical-categories')

    for (const name of ['Mùa phụng vụ', 'Loại Thánh lễ', 'Loại nghi thức', 'Danh mục sự kiện']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(await screen.findByRole('heading', { name: 'Không thể tải danh mục mùa phụng vụ' })).toBeInTheDocument()
  })

  it('loads the catalog of the selected tab', async () => {
    const list = vi
      .spyOn(categoriesApi, 'listLiturgicalCategories')
      .mockImplementation(async (catalog: LiturgicalCatalog) =>
        catalog === 'massTypes' ? [{ id: 'm1', name: 'Lễ Chúa Nhật' }] : [{ id: 's1', name: 'Mùa Vọng' }],
      )
    renderPage(<LiturgicalCategoriesPage />, '/admin/liturgical-categories')

    expect(await screen.findByText('Mùa Vọng')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Loại Thánh lễ' }))

    expect(await screen.findByText('Lễ Chúa Nhật')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thêm loại Thánh lễ/ })).toBeInTheDocument()
    await waitFor(() => expect(list).toHaveBeenCalledWith('massTypes'))
  })
})
