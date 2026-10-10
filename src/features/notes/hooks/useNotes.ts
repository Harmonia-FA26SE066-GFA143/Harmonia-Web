import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listNotes, listRecipients, sendNote, type NotePage } from '../api/notesApi'
import type { DirectorNoteValues } from '../types'

const notesKey = ['director-notes'] as const

/** One page of notes; the previous page stays visible while the next one loads. */
export function useNotes(page: NotePage) {
  return useQuery({
    queryKey: [...notesKey, 'list', page],
    queryFn: () => listNotes(page),
    placeholderData: keepPreviousData,
  })
}

export function useNoteRecipients() {
  return useQuery({ queryKey: [...notesKey, 'recipients'], queryFn: listRecipients })
}

/** A refusal usually means a chosen Choir Director was deactivated meanwhile, so the recipients are reloaded. */
export function useSendNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: DirectorNoteValues) => sendNote(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...notesKey, 'list'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: [...notesKey, 'recipients'] }),
  })
}
