import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { env } from '@/config/env'
import { freshAccessToken } from '@/lib/api/client'
import {
  listConversations,
  listRecipients,
  listThread,
  markConversationRead,
  sendMessage,
  sendNote,
} from '../api/notesApi'
import type { DirectorNoteValues } from '../types'

const notesKey = ['director-notes'] as const
const threadPageSize = 30

export function useConversations() {
  return useQuery({ queryKey: [...notesKey, 'conversations'], queryFn: listConversations })
}

export function useNoteRecipients() {
  return useQuery({ queryKey: [...notesKey, 'recipients'], queryFn: listRecipients })
}

/** Newest first, thirty at a time; the page reverses them and loads older ones on request. */
export function useThread(withUserId: string | undefined) {
  return useInfiniteQuery({
    queryKey: [...notesKey, 'thread', withUserId],
    queryFn: ({ pageParam }) => listThread(withUserId!, { pageNumber: pageParam, pageSize: threadPageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pageNumber < last.totalPages ? last.pageNumber + 1 : undefined),
    enabled: withUserId !== undefined,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ toUserId, content }: { toUserId: string; content: string }) => sendMessage(toUserId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
    // A refusal usually means the other person was deactivated meanwhile.
    onError: () => queryClient.invalidateQueries({ queryKey: [...notesKey, 'recipients'] }),
  })
}

/** Parish Priest only. */
export function useSendNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: DirectorNoteValues) => sendNote(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
    onError: () => queryClient.invalidateQueries({ queryKey: [...notesKey, 'recipients'] }),
  })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => markConversationRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...notesKey, 'conversations'] }),
  })
}

/**
 * Listens on the backend's SignalR hub (`/hubs/notifications`, Harmonia-BE NotificationHub) while the chat page is
 * open. A pushed message or read receipt only invalidates the cached lists, so the REST answers stay the single
 * source of truth and a missed push is repaired by the next refetch. Returns false while disconnected.
 * ponytail: the connection lives with the page; a header-wide unread badge would need it hoisted into the shell.
 */
export function useDirectorNotesLive(): boolean {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: notesKey })
    const connection = new HubConnectionBuilder()
      // Absolute: SignalR cannot resolve a relative URL outside a browser page (and the dev proxy keeps it same-origin).
      .withUrl(new URL(`${env.apiBaseUrl}/hubs/notifications`, location.href).href, { accessTokenFactory: freshAccessToken })
      .withAutomaticReconnect()
      .build()
    // Wire names are the INotificationClient method names, suffix included.
    connection.on('ReceiveDirectorNoteAsync', refresh)
    connection.on('ReceiveDirectorNotesReadAsync', refresh)
    connection.onreconnecting(() => setConnected(false))
    connection.onreconnected(() => {
      setConnected(true)
      refresh()
    })
    connection.onclose(() => setConnected(false))

    let stopped = false
    connection
      .start()
      .then(() => {
        if (!stopped) setConnected(connection.state === HubConnectionState.Connected)
      })
      .catch(() => {
        // Left offline: the page says so and the lists still refresh on focus and after every send.
        if (!stopped) setConnected(false)
      })
    return () => {
      stopped = true
      void connection.stop()
    }
  }, [queryClient])

  return connected
}
