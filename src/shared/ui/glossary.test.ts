import { describe, expect, it } from 'vitest'
import {
  ACTIONS_COLUMN_TITLE,
  ATTENDANCE_LATE_LABEL,
  CANCEL_LABEL,
  CHOIR_NAV_LABEL,
  CREATE_ASSIGNMENT_LABEL,
  FILTER_RESET_LABEL,
  MATERIAL_LABELS,
  MISSING_FIELD_LABEL,
  PROGRAM_NOUN,
  UNASSIGNED_VOICE_LABEL,
  UNKNOWN_METRIC_LABEL,
  filterAllPlaceholder,
} from './glossary'

describe('glossary', () => {
  it('defines canonical Vietnamese terms per 02-ux-architecture §6', () => {
    expect(MATERIAL_LABELS.rehearsalMaterial).toBe('Tài liệu tập luyện')
    expect(PROGRAM_NOUN).toBe('Chương trình phụng vụ')
    expect(CHOIR_NAV_LABEL).toBe('Quản lý ca đoàn')
    expect(ATTENDANCE_LATE_LABEL).toBe('Đi trễ')
    expect(FILTER_RESET_LABEL).toBe('Xoá bộ lọc')
    expect(CANCEL_LABEL).toBe('Hủy')
    expect(CREATE_ASSIGNMENT_LABEL).toBe('Giao bài tập')
    expect(UNKNOWN_METRIC_LABEL).toBe('Chưa có dữ liệu')
    expect(MISSING_FIELD_LABEL).toBe('Chưa cập nhật')
    expect(UNASSIGNED_VOICE_LABEL).toBe('Chưa phân bè')
    expect(ACTIONS_COLUMN_TITLE).toBe('Thao tác')
    expect(filterAllPlaceholder('mùa')).toBe('Tất cả mùa')
  })
})
