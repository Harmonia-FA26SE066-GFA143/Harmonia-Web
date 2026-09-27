import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as categoriesApi from '../api/categoriesApi'
import { SkillCategoriesPage } from './SkillCategoriesPage'

const skills = [
  { id: 's1', name: 'Soprano' },
  { id: 's2', name: 'Alto' },
  { id: 's3', name: 'Organ', description: 'Đệm đàn Thánh lễ' },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SkillCategoriesPage', () => {
  it('shows a recoverable error while the catalog API contract is missing', async () => {
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    expect(screen.getByRole('status', { name: 'Đang tải danh mục kỹ năng' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Không thể tải danh mục kỹ năng' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument()
  })

  it('shows the empty state with an add action', async () => {
    vi.spyOn(categoriesApi, 'listSkillCategories').mockResolvedValue([])
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    expect(await screen.findByRole('heading', { name: 'Chưa có kỹ năng nào' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thêm kỹ năng/ })).toBeInTheDocument()
  })

  it('filters by name ignoring diacritics and offers to clear the search', async () => {
    vi.spyOn(categoriesApi, 'listSkillCategories').mockResolvedValue(skills)
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    const search = await screen.findByRole('textbox', { name: 'Tìm kiếm kỹ năng' })
    fireEvent.change(search, { target: { value: 'dan' } })
    expect(screen.getByText('Organ')).toBeInTheDocument()
    expect(screen.queryByText('Soprano')).toBeNull()

    fireEvent.change(search, { target: { value: 'violin' } })
    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Xoá bộ lọc/ }))
    expect(screen.getByText('Soprano')).toBeInTheDocument()
  })

  it('requires a name before adding a skill', async () => {
    vi.spyOn(categoriesApi, 'listSkillCategories').mockResolvedValue(skills)
    const create = vi.spyOn(categoriesApi, 'createSkillCategory')
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm kỹ năng/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    expect(await within(dialog).findByText('Vui lòng nhập tên kỹ năng.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('edits an existing skill with its current values prefilled', async () => {
    vi.spyOn(categoriesApi, 'listSkillCategories').mockResolvedValue(skills)
    const update = vi
      .spyOn(categoriesApi, 'updateSkillCategory')
      .mockResolvedValue({ id: 's3', name: 'Organ điện tử' })
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa Organ' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Chỉnh sửa kỹ năng')).toBeInTheDocument()
    const name = within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' })
    expect(name).toHaveValue('Organ')

    fireEvent.change(name, { target: { value: '  Organ điện tử ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('s3', { name: 'Organ điện tử', description: 'Đệm đàn Thánh lễ' }),
    )
  })

  it('keeps the modal open with the entered values when saving fails', async () => {
    vi.spyOn(categoriesApi, 'listSkillCategories').mockResolvedValue(skills)
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm kỹ năng/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' }), { target: { value: 'Violin' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    expect(await screen.findByText('Không thể lưu kỹ năng. Vui lòng thử lại.')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' })).toHaveValue('Violin')
  })
})
