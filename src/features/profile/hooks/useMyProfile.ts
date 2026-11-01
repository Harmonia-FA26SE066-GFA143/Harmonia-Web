import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteMyAvatar, getMyProfile, updateMyAvatar, updateMyProfile } from '../api/profileApi'
import type { Profile } from '../types'

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

export function useUpdateMyAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMyAvatar,
    onSuccess: (profile) => queryClient.setQueryData(profileKey, profile),
  })
}

export function useDeleteMyAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMyAvatar,
    onSuccess: () => queryClient.setQueryData<Profile>(profileKey, (profile) => profile && { ...profile, avatarUrl: undefined }),
  })
}
