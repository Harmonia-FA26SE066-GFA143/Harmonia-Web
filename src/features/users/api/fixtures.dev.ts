/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `accountsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Fictional sample people. Statuses are the four conceptual labels in roles-permissions.md (DECIDED); how a
 * status changes after create/reopen is a fixture assumption, not a business rule (TBD with the backend).
 */
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { SystemRole } from '@/shared/types/account'
import type { Account, CreateAccountValues } from '../types'

let accounts: Account[] = [
  { id: 'dev-acc-1', fullName: 'Quản trị viên Giáo xứ', email: 'quantri@giaoxu.org', status: 'active', role: 'admin' },
  { id: 'dev-acc-2', fullName: 'Lm. Gioan Nguyễn Minh', email: 'gioan.minh@giaoxu.org', status: 'active', role: 'priest' },
  {
    id: 'dev-acc-3',
    fullName: 'Giuse Trần Minh Tâm',
    email: 'giuse.tam@giaoxu.org',
    phone: '0901 234 567',
    status: 'active',
    role: 'director',
  },
  { id: 'dev-acc-4', fullName: 'Maria Nguyễn Thu Hướng', email: 'maria.huong@giaoxu.org', status: 'active', role: 'member' },
  { id: 'dev-acc-5', fullName: 'Têrêsa Lê Hoàng Vy', email: 'teresa.vy@giaoxu.org', status: 'active', role: 'member' },
  { id: 'dev-acc-6', fullName: 'Simon Phan Văn Đức', email: 'simon.duc@giaoxu.org', status: 'active', role: 'member' },
  {
    id: 'dev-acc-7',
    fullName: 'Vinhsơn Nguyễn Văn Hưng',
    email: 'vinhson.hung@giaoxu.org',
    status: 'deactivated',
    role: 'member',
  },
  {
    id: 'dev-acc-8',
    fullName: 'Phaolô Hoàng Anh Tuấn',
    email: 'phaolo.tuan@giaoxu.org',
    phone: '0912 345 678',
    status: 'pending',
    requestedRole: 'member',
  },
  { id: 'dev-acc-9', fullName: 'Anna Đỗ Thị Mai', email: 'anna.mai@giaoxu.org', status: 'pending', requestedRole: 'director' },
  {
    id: 'dev-acc-10',
    fullName: 'Phêrô Lê Văn Bình',
    email: 'phero.binh@giaoxu.org',
    status: 'rejected',
    requestedRole: 'priest',
    rejectionReason: 'Không thuộc giáo xứ.',
  },
]

function update(id: string, change: (account: Account) => Account): Account {
  const current = accounts.find((account) => account.id === id)
  if (!current) throw new Error(`DEV FIXTURE: không tìm thấy tài khoản ${id}`)
  const next = change(current)
  accounts = accounts.map((account) => (account.id === id ? next : account))
  return next
}

export const listAccountsFixture = () => readFixture(accounts)

export const createAccountFixture = (values: CreateAccountValues) =>
  writeFixture(() => {
    // Fixture assumption: an Admin-created account starts active (initial status is TBD).
    const account: Account = { id: nextFixtureId('acc'), ...values, status: 'active' }
    accounts = [account, ...accounts]
    return account
  })

export const confirmAccountFixture = (id: string, role: SystemRole) =>
  writeFixture(() => update(id, (account) => ({ ...account, status: 'active', role })))

export const rejectAccountFixture = (id: string, reason?: string) =>
  writeFixture(() => update(id, (account) => ({ ...account, status: 'rejected', rejectionReason: reason })))

export const reopenAccountFixture = (id: string) =>
  // Fixture assumption: a reopened account returns to pending (resulting status is TBD).
  writeFixture(() => update(id, (account) => ({ ...account, status: 'pending', rejectionReason: undefined })))

export const changeAccountRoleFixture = (id: string, role: SystemRole) =>
  writeFixture(() => update(id, (account) => ({ ...account, role })))
