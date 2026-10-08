import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as categoriesApi from '../api/categoriesApi'
import type { CatalogItem, Skill } from '../types'
import { SkillCategoriesPage } from './SkillCategoriesPage'

const categories: CatalogItem[] = [
  { id: 'c-vocal', name: 'Bè giọng', description: null, isActive: true },
  { id: 'c-instrument', name: 'Nhạc cụ', description: null, isActive: true },
]

const skills: Skill[] = [
  { id: 's1', categoryId: 'c-vocal', name: 'Soprano', description: null, isActive: true },
  { id: 's2', categoryId: 'c-vocal', name: 'Alto', description: null, isActive: false },
  { id: 's3', categoryId: 'c-instrument', name: 'Organ', description: 'Đệm đàn Thánh lễ', isActive: true },
]

beforeEach(() => {
  vi.spyOn(categoriesApi, 'listCatalogItems').mockResolvedValue(categories)
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function choose(dialog: HTMLElement, label: string, option: string) {
  fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: label }))
  fireEvent.click(await screen.findByTitle(option))
}

describe('SkillCategoriesPage', () => {
  it('shows a recoverable error when the skills cannot be loaded', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    expect(screen.getByRole('status', { name: 'Đang tải danh mục kỹ năng' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Không thể tải danh mục kỹ năng' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument()
  })

  it('shows the empty state with an add action', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue([])
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    expect(await screen.findByRole('heading', { name: 'Chưa có kỹ năng nào' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thêm kỹ năng/ })).toBeInTheDocument()
  })

  it('lists every skill with its category and status, and filters ignoring diacritics', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue(skills)
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    const alto = (await screen.findByText('Alto')).closest('tr') as HTMLElement
    expect(within(alto).getByText('Bè giọng')).toBeInTheDocument()
    expect(within(alto).getByText('Ngừng dùng')).toBeInTheDocument()

    const search = screen.getByRole('textbox', { name: 'Tìm kiếm kỹ năng' })
    fireEvent.change(search, { target: { value: 'dan' } })
    expect(screen.getByText('Organ')).toBeInTheDocument()
    expect(screen.queryByText('Soprano')).toBeNull()

    fireEvent.change(search, { target: { value: 'violin' } })
    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Xoá bộ lọc/ }))
    expect(screen.getByText('Soprano')).toBeInTheDocument()
  })

  it('requires a name and a category before adding a skill', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue(skills)
    const save = vi.spyOn(categoriesApi, 'saveSkill')
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm kỹ năng/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    expect(await within(dialog).findByText('Vui lòng nhập tên kỹ năng.')).toBeInTheDocument()
    expect(within(dialog).getByText('Vui lòng chọn nhóm kỹ năng.')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })

  it('adds a skill to a category, in use by default', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue(skills)
    const save = vi
      .spyOn(categoriesApi, 'saveSkill')
      .mockResolvedValue({ id: 's4', categoryId: 'c-instrument', name: 'Guitar', description: null, isActive: true })
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm kỹ năng/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' }), { target: { value: ' Guitar ' } })
    await choose(dialog, 'Nhóm kỹ năng', 'Nhạc cụ')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(undefined, expect.objectContaining({ name: 'Guitar', categoryId: 'c-instrument', isActive: true })),
    )
    expect(await screen.findByText('Đã thêm kỹ năng.')).toBeInTheDocument()
  })

  it('edits a skill with its current values prefilled and can switch it off', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue(skills)
    const save = vi.spyOn(categoriesApi, 'saveSkill').mockResolvedValue({ ...skills[2], isActive: false })
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa Organ' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Chỉnh sửa kỹ năng')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' })).toHaveValue('Organ')

    fireEvent.click(within(dialog).getByRole('switch', { name: 'Đang sử dụng' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('s3', {
        name: 'Organ',
        categoryId: 'c-instrument',
        description: 'Đệm đàn Thánh lễ',
        isActive: false,
      }),
    )
  })

  it('shows a taken name under the field and keeps the entered values', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue(skills)
    vi.spyOn(categoriesApi, 'saveSkill').mockRejectedValue(new ApiError(409, { code: 'SKILL_NAME_DUPLICATE' }))
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa Organ' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' }), { target: { value: 'Soprano' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    expect(
      await within(dialog).findByText('Nhóm kỹ năng này đã có kỹ năng cùng tên, kể cả kỹ năng đã ngừng dùng.'),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' })).toHaveValue('Soprano')
  })

  it('keeps the modal open when saving fails for another reason', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue(skills)
    vi.spyOn(categoriesApi, 'saveSkill').mockRejectedValue(new ApiError(500, undefined))
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa Organ' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByText('Không thể lưu kỹ năng. Vui lòng thử lại.')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' })).toHaveValue('Organ')
  })

  it('manages the skill categories in their own tab', async () => {
    vi.spyOn(categoriesApi, 'listSkills').mockResolvedValue(skills)
    const save = vi
      .spyOn(categoriesApi, 'saveCatalogItem')
      .mockResolvedValue({ id: 'c-solo', name: 'Đơn ca', description: null, isActive: true })
    renderPage(<SkillCategoriesPage />, '/admin/skill-categories')

    fireEvent.click(screen.getByRole('tab', { name: 'Nhóm kỹ năng' }))
    expect(await screen.findByText('Nhạc cụ')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Thêm nhóm kỹ năng/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên nhóm kỹ năng' }), { target: { value: 'Đơn ca' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm' }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('skillCategories', undefined, expect.objectContaining({ name: 'Đơn ca', isActive: true })),
    )
  })
})
