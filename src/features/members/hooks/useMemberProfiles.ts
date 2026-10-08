import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { searchMembers, updateMember, type MemberPage } from '../api/membersApi'
import type { MemberFilters, MemberProfileValues } from '../types'

const profilesKey = ['member-profiles'] as const

/** One page of member records; the previous page stays visible while the next one loads. */
export function useMemberProfiles(filters: MemberFilters, page: MemberPage) {
  return useQuery({
    queryKey: [...profilesKey, filters, page],
    queryFn: () => searchMembers(filters, page),
    placeholderData: keepPreviousData,
  })
}

/** A status change also changes who the other pages offer as active members. */
export function useUpdateMemberProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MemberProfileValues }) => updateMember(id, values),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: profilesKey }),
        queryClient.invalidateQueries({ queryKey: ['choir-members'] }),
      ]),
  })
}
