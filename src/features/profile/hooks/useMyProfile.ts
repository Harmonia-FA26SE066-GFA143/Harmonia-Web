import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { getMyProfile, updateMyProfile } from '../api/profileApi'

const profileKey = ['profile', 'me'] as const

export function useMyProfile() {
  return useQuery({
    queryKey: profileKey,
    queryFn: getMyProfile,
    // Retrying cannot help while the API contract is missing.
    retry: (failureCount, error) => !(error instanceof ApiContractMissingError) && failureCount < 3,
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => queryClient.setQueryData(profileKey, profile),
  })
}
