import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPublicSettings, listSettings, updateSetting } from '../api/settingsApi'

const settingsKey = ['system-settings'] as const

export function useSettings() {
  return useQuery({ queryKey: [...settingsKey, 'all'], queryFn: listSettings })
}

/** Read on every page for the announcement; it changes rarely. */
export function usePublicSettings() {
  return useQuery({ queryKey: [...settingsKey, 'public'], queryFn: getPublicSettings, staleTime: 5 * 60_000 })
}

/** Saves the changed settings one by one; the lists are reloaded whatever the outcome. */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (changes: { id: string; value: string }[]) => {
      for (const { id, value } of changes) await updateSetting(id, value)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: settingsKey }),
  })
}
