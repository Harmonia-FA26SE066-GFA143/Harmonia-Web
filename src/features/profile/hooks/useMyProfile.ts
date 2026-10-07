import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyProfile, updateMyProfile } from '../api/profileApi'

const profileKey = ['profile', 'me'] as const

export function useMyProfile() {
  return useQuery({ queryKey: profileKey, queryFn: getMyProfile })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => queryClient.setQueryData(profileKey, profile),
  })
}
