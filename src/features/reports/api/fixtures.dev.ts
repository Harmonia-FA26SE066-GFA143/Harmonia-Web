/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `reportsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Fictional rows; metric values are sample numbers, not computed (metric definitions are UNRESOLVED).
 * All rows belong to the current month and to "Mùa Thường Niên" (catalog fixture id dev-season-5), so choosing
 * another month or season shows the "no results" state.
 */
import dayjs from 'dayjs'
import { readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { ReportExportRequest, ReportFilters, ReportKind, ReportResult, ReportRow } from '../types'

const sampleSeasonId = 'dev-season-5'
const day = (offset: number) => dayjs().startOf('month').add(offset, 'day')
const date = (offset: number) => day(offset).format('DD/MM/YYYY')
const time = (offset: number, hour: number) => day(offset).hour(hour).minute(45).format('DD/MM/YYYY HH:mm')
const sundayMass = 'Thánh lễ Chúa Nhật tuần này'

const data: Record<ReportKind, ReportResult> = {
  attendance: {
    metrics: { total: 32, present: 28, absent: 3, notRecorded: 1 },
    rows: [
      ['Maria Nguyễn Thu Hướng', 'Có mặt', time(5, 5)],
      ['Têrêsa Lê Hoàng Vy', 'Có mặt', time(5, 5)],
      ['Simon Phan Văn Đức', 'Vắng mặt', undefined],
      ['Phaolô Hoàng Anh Tuấn', 'Chưa điểm danh', undefined],
    ].map(([member, status, recordedAt], index) => ({
      id: `dev-att-${index}`,
      cells: { member, event: sundayMass, season: 'Mùa Thường Niên', recordedAt, status },
    })),
  },
  userActivity: {
    metrics: { total: 24 },
    rows: [
      { id: 'dev-ua-1', cells: { occurredAt: time(6, 7), actor: 'Lm. Gioan Nguyễn Minh', action: 'Duyệt danh sách bài hát', target: sundayMass } },
      { id: 'dev-ua-2', cells: { occurredAt: time(4, 14), actor: 'Quản trị viên Giáo xứ', action: 'Thay đổi vai trò', target: 'Tài khoản Anna Đỗ Thị Mai' } },
      { id: 'dev-ua-3', cells: { occurredAt: time(3, 10), actor: 'Giuse Trần Minh Tâm', action: 'Xác nhận phân công', target: sundayMass } },
    ],
  },
  participation: {
    metrics: { requests: 28, confirmed: 22, declined: 3, unsure: 2, noResponse: 1 },
    rows: [
      ['Maria Nguyễn Thu Hướng', 'Xác nhận tham gia', undefined],
      ['Simon Phan Văn Đức', 'Từ chối tham gia', 'Bận việc gia đình'],
      ['Têrêsa Lê Hoàng Vy', 'Chưa chắc chắn', 'Chờ lịch làm việc'],
      ['Phaolô Hoàng Anh Tuấn', 'Chưa phản hồi', undefined],
    ].map(([member, response, note], index) => ({
      id: `dev-par-${index}`,
      cells: { member, event: sundayMass, date: date(5), response, note },
    })),
  },
  practiceCompletion: {
    metrics: { assigned: 19, passed: 11, needsRevision: 2, awaitingReview: 5, overdue: 1 },
    rows: [
      ['Simon Phan Văn Đức', 'Luyện bè trầm', 'Kinh Vinh Danh', 'Đạt', time(2, 21)],
      ['Têrêsa Lê Hoàng Vy', 'Luyện điệp khúc', 'Lạy Chúa Từ Nhân', 'Chờ đánh giá', time(4, 18)],
      ['Maria Nguyễn Thu Hướng', 'Khớp nhịp bè', 'Tâm Tình Tri Ân', 'Cần chỉnh sửa', time(3, 15)],
    ].map(([member, assignment, song, status, submittedAt], index) => ({
      id: `dev-pra-${index}`,
      cells: { member, assignment, song, status, submittedAt },
    })),
  },
  serviceHistory: {
    metrics: {},
    rows: [
      { id: 'dev-sh-1', programId: 'dev-program-1', cells: { program: 'Lễ Chúa Nhật Thường Niên', date: date(5), season: 'Mùa Thường Niên', massType: 'Lễ Chúa Nhật', ceremonyType: '—' } },
      { id: 'dev-sh-2', programId: 'dev-program-2', cells: { program: 'Giờ Chầu Thánh Thể đầu tháng', date: date(2), season: 'Mùa Thường Niên', massType: '—', ceremonyType: 'Chầu Thánh Thể' } },
    ],
  },
  songUsage: {
    metrics: {},
    rows: [
      { id: 'dev-su-1', programId: 'dev-program-1', cells: { song: 'Con Bước Lên Bàn Thờ', liturgicalPart: 'Ca nhập lễ', program: 'Lễ Chúa Nhật Thường Niên', date: date(5) } },
      { id: 'dev-su-2', programId: 'dev-program-1', cells: { song: 'Lễ Vật Tâm Tình', liturgicalPart: 'Ca dâng lễ', program: 'Lễ Chúa Nhật Thường Niên', date: date(5) } },
      { id: 'dev-su-3', programId: 'dev-program-2', cells: { song: 'Trầm Hương Đốt', liturgicalPart: 'Chầu Thánh Thể', program: 'Giờ Chầu Thánh Thể đầu tháng', date: date(2) } },
    ],
  },
  eventPreparation: {
    metrics: {},
    rows: [
      // Preparation labels are sample text; the real status values are TBD.
      { id: 'dev-ep-1', programId: 'dev-program-3', cells: { program: 'Lễ Chúa Nhật tuần sau', date: date(12), preparation: 'Đang chuẩn bị' } },
      { id: 'dev-ep-2', programId: 'dev-program-4', cells: { program: 'Lễ Bổn mạng Giáo xứ', date: date(20), preparation: 'Chưa bắt đầu' } },
    ],
  },
}

function matches(filters: ReportFilters): boolean {
  const monthOk = !filters.month || filters.month === dayjs().format('YYYY-MM')
  const seasonOk = !filters.seasonId || filters.seasonId === sampleSeasonId
  // Mass and ceremony type filters are not simulated.
  return monthOk && seasonOk
}

export async function getReportFixture(kind: ReportKind, filters: ReportFilters): Promise<ReportResult> {
  const { metrics, rows } = data[kind]
  const [result] = await readFixture([{ metrics, rows }])
  if (!result) return { metrics: {}, rows: [] as ReportRow[] }
  if (!matches(filters)) {
    return { metrics: Object.fromEntries(Object.keys(metrics).map((key) => [key, 0])), rows: [] }
  }
  return result
}

export async function exportReportFixture(_request: ReportExportRequest): Promise<void> {
  await writeFixture(() => ({}))
}
