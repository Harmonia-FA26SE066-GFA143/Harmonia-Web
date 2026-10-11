import { Outlet, useMatches } from 'react-router'
import { isPageHandle } from './placeholderRoute'

/** Root route element: puts the matched page's `handle.title` in the tab title (React 19 hoists `<title>` into the head). */
export function PageTitle() {
  const handle = useMatches().findLast((match) => isPageHandle(match.handle))?.handle
  return (
    <>
      <title>{isPageHandle(handle) ? `${handle.title} · Harmonia` : 'Harmonia'}</title>
      <Outlet />
    </>
  )
}
