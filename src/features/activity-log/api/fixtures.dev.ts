/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `activityLogApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Fictional records using only the FE-54 activity kinds. Timestamps are relative to "now" so period filters work.
 */
import dayjs from 'dayjs'
import { readFixture } from '@/lib/api/fixtureRuntime.dev'
import type { ActivityRecord } from '../types'

const ago = (hours: number) => dayjs().subtract(hours, 'hour').toISOString()

const records: ActivityRecord[] = [
  {
    id: 'dev-log-1',
    occurredAt: ago(1),
    actorName: 'Lm. Gioan Nguyễn Minh',
    actorRole: 'priest',
    type: 'songListApproval',
    target: 'Thánh lễ Chúa Nhật XXVI Thường Niên',
    details: 'Phê duyệt danh sách 5 bài hát.',
  },
  {
    id: 'dev-log-2',
    occurredAt: ago(3),
    actorName: 'Quản trị viên Giáo xứ',
    actorRole: 'admin',
    type: 'roleChange',
    target: 'Tài khoản Anna Đỗ Thị Mai',
    details: 'Vai trò: Ca viên → Ca trưởng.',
  },
  {
    id: 'dev-log-3',
    occurredAt: ago(20),
    actorName: 'Giuse Trần Minh Tâm',
    actorRole: 'director',
    type: 'rosterConfirmation',
    target: 'Thánh lễ Chúa Nhật XXVI Thường Niên',
  },
  {
    id: 'dev-log-4',
    occurredAt: ago(30),
    actorName: 'Giuse Trần Minh Tâm',
    actorRole: 'director',
    type: 'skillApproval',
    target: 'Têrêsa Lê Hoàng Vy – Soprano',
  },
  {
    id: 'dev-log-5',
    occurredAt: ago(4 * 24),
    actorName: 'Giuse Trần Minh Tâm',
    actorRole: 'director',
    type: 'attendanceUpdate',
    target: 'Buổi tập thứ Sáu',
    details: 'Cập nhật điểm danh cho 18 ca viên.',
  },
  {
    id: 'dev-log-6',
    occurredAt: ago(12 * 24),
    actorName: 'Giuse Trần Minh Tâm',
    actorRole: 'director',
    type: 'materialDeletion',
    target: 'Bản nhạc "Kinh Vinh Danh" (PDF cũ)',
  },
  {
    id: 'dev-log-7',
    occurredAt: ago(40 * 24),
    actorName: 'Quản trị viên Giáo xứ',
    actorRole: 'admin',
    type: 'roleChange',
    target: 'Tài khoản Simon Phan Văn Đức',
    details: 'Vai trò được xác nhận: Ca viên.',
  },
]

export const listActivityLogFixture = () => readFixture(records)
