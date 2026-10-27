import { useLocation, useSearchParams } from 'react-router'

/**
 * The selected tab kept in `?tab=`, so reload and the back button return to it; an unknown value falls back. The
 * router state is kept, so a page opened with state (e.g. the list it came from) does not lose it on a tab change.
 */
export function useUrlTab<K extends string>(keys: readonly K[], fallback: K) {
  const [params, setParams] = useSearchParams()
  const { state } = useLocation()
  const value = params.get('tab')
  const tab = keys.find((key) => key === value) ?? fallback
  const setTab = (next: string) => {
    const query = new URLSearchParams(params)
    if (next === fallback) query.delete('tab')
    else query.set('tab', next)
    setParams(query, { replace: true, state })
  }
  return [tab, setTab] as const
}
