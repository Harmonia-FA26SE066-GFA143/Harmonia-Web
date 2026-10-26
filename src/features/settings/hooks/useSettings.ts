import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contactEmail } from '@/config/contact'
import { getPublicSettings, listSettings, updateSetting } from '../api/settingsApi'

const settingsKey = ['system-settings'] as const

export function useSettings() {
  return useQuery({ queryKey: [...settingsKey, 'all'], queryFn: listSettings })
}

/** Read on every page for the announcement; it changes rarely. */
export function usePublicSettings() {
  return useQuery({ queryKey: [...settingsKey, 'public'], queryFn: getPublicSettings, staleTime: 5 * 60_000 })
}

/** The contact email the Admin set (Contact.Email), or the project's own while it is empty or not loaded. */
export const useContactEmail = () => usePublicSettings().data?.contactEmail ?? contactEmail

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
