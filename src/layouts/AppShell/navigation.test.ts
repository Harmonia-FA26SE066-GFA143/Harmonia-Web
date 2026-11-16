import { describe, expect, it } from 'vitest'
import { findSelectedPath, getSurface, surfaces } from './navigation'

describe('getSurface', () => {
  it('derives the role workspace from the URL prefix', () => {
    expect(getSurface('/admin')).toBe('admin')
    expect(getSurface('/priest/programs/42')).toBe('priest')
    expect(getSurface('/director/rehearsals')).toBe('director')
  })

  it('returns undefined for role-neutral or look-alike paths', () => {
    expect(getSurface('/profile')).toBeUndefined()
    expect(getSurface('/administrator')).toBeUndefined()
  })
})

describe('findSelectedPath', () => {
  it('selects the dashboard only on its own path', () => {
    expect(findSelectedPath(surfaces.admin.sections, '/admin')).toBe('/admin')
    expect(findSelectedPath(surfaces.admin.sections, '/admin/accounts')).toBe('/admin/accounts')
  })

  it('keeps the list item selected on nested detail pages', () => {
    expect(findSelectedPath(surfaces.priest.sections, '/priest/programs/42/song-review')).toBe('/priest/programs')
  })
})

describe('Admin navigation', () => {
  it('groups pages into focused areas instead of one overflowing strip', () => {
    expect(
      surfaces.admin.sections.map((section) => ({
        label: section.label,
        pages: section.items.map((item) => item.label),
      })),
    ).toEqual([
      { label: 'Tổng quan', pages: ['Tổng quan'] },
      { label: 'Người dùng', pages: ['Tài khoản', 'Đăng ký gia nhập', 'Vai trò & Phân quyền', 'Đề cử Ca trưởng'] },
      { label: 'Tổ chức', pages: ['Ca đoàn'] },
      { label: 'Danh mục', pages: ['Kỹ năng', 'Phụng vụ'] },
      { label: 'Hệ thống', pages: ['Cấu hình chung', 'Lịch sử hoạt động'] },
      { label: 'Báo cáo', pages: ['Báo cáo'] },
    ])
  })
})
