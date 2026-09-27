import { render } from '@testing-library/react'
import { StrictMode, type ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { AppProviders } from '@/app/providers'

// Test-only helper; React Fast Refresh does not apply here.
// oxlint-disable-next-line react/only-export-components
function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

/**
 * Renders a page at `path` inside the app providers. Any navigation away lands on a probe that shows the
 * new pathname (read it with `screen.findByTestId('location')`). StrictMode matches src/main.tsx so tests see the
 * same double mount as the dev server. `initialEntry` (e.g. with a query string) defaults to `path`.
 */
export function renderPage(element: ReactElement, path = '/', initialEntry = path) {
  const router = createMemoryRouter(
    [
      { path, element },
      { path: '*', element: <LocationProbe /> },
    ],
    { initialEntries: [initialEntry] },
  )
  return render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}
