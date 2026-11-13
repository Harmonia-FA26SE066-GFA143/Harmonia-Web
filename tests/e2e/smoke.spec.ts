import { expect as baseExpect, test, type Page, type Route } from '@playwright/test'

// The dev server compiles each workspace's code on its first visit, which can take longer than the 5 s default.
const expect = baseExpect.configure({ timeout: 20_000 })

// Smoke flows in a real browser without a backend: every `/api` call is answered here. Calls a test does not
// answer get 404, so a page that reads more than the test cares about shows its own empty or error state.

type Handler = (route: Route) => unknown
const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
const paged = (items: unknown[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })

async function mockApi(page: Page, handlers: Record<string, Handler>) {
  // Match on the path: a glob like `**/api/**` would also catch Vite's source modules such as /src/lib/api/client.ts.
  await page.route((url) => url.pathname.startsWith('/api/'), (route) => {
    const { pathname } = new URL(route.request().url())
    const handler = handlers[`${route.request().method()} ${pathname}`]
    return handler ? handler(route) : json(route, { code: 'NOT_FOUND' }, 404)
  })
}

const session = (roleName: string) => ({
  accessToken: 'e2e',
  accessTokenExpiresAt: '2099-01-01T00:00:00Z',
  refreshToken: 'e2e-refresh',
  user: { id: 'u1', email: 'e2e@giaoxu.vn', fullName: 'Người kiểm thử', roleName },
})

async function signedInAs(page: Page, roleName: string) {
  await page.addInitScript((value) => localStorage.setItem('harmonia.session', value), JSON.stringify(session(roleName)))
}

test('a Parish Priest signs in and lands in their workspace', async ({ page }) => {
  await mockApi(page, { 'POST /api/auth/login': (route) => json(route, session('ParishPriest')) })
  await page.goto('/login')
  await page.getByLabel('Email').fill('cha@giaoxu.vn')
  await page.getByLabel('Mật khẩu').fill('dung-mat-khau')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL(/\/priest$/)
})

test('a wrong password keeps the user on the sign-in page with the reason', async ({ page }) => {
  await mockApi(page, { 'POST /api/auth/login': (route) => json(route, { code: 'AUTH_INVALID_CREDENTIALS' }, 401) })
  await page.goto('/login')
  await page.getByLabel('Email').fill('cha@giaoxu.vn')
  await page.getByLabel('Mật khẩu').fill('sai')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByText('Email hoặc mật khẩu không chính xác.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('a Choir Director cannot open the Admin workspace', async ({ page }) => {
  await signedInAs(page, 'ChoirDirector')
  await mockApi(page, {})
  await page.goto('/admin/accounts')
  await expect(page.getByText('403')).toBeVisible()
})

test('a Choir Director approves a declared skill', async ({ page }) => {
  let pending = [
    { id: 's1', memberFullName: 'Maria Lan', skillName: 'Soprano', categoryName: 'Bè', level: 'Advanced', declaredAt: '2026-11-10T02:00:00Z', evidence: null },
  ]
  await signedInAs(page, 'ChoirDirector')
  await mockApi(page, {
    'GET /api/member-skills/pending': (route) => json(route, paged(pending)),
    'PATCH /api/member-skills/s1/approve': (route) => {
      pending = []
      return route.fulfill({ status: 204 })
    },
  })

  await page.goto('/director/skill-approval')
  await page.getByRole('button', { name: 'Duyệt Soprano của Maria Lan' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Duyệt' }).click()
  await expect(page.getByText('Đã duyệt Soprano của Maria Lan.')).toBeVisible()
  await expect(page.getByText('Không có kỹ năng nào chờ duyệt')).toBeVisible()
})
