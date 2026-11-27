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
/** Waits before each new attempt to connect the live hub; the last one repeats. */
const retryDelaysMs = [2_000, 5_000, 10_000, 30_000]

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

export type NotesLiveStatus = 'connecting' | 'connected' | 'reconnecting'

/**
 * Listens on the backend's SignalR hub (`/hubs/notifications`, Harmonia-BE NotificationHub) while the chat page is
 * open. A pushed message or read receipt only invalidates the cached lists, so the REST answers stay the single
 * source of truth and a missed push is repaired by the next refetch. Starts in `'connecting'` so initial page load
 * never flashes an error state, and retries (2, 5, 10, then every 30 seconds) until the page closes.
 * ponytail: the connection lives with the page; a header-wide unread badge would need it hoisted into the shell.
 */
export function useDirectorNotesLive(): NotesLiveStatus {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<NotesLiveStatus>('connecting')

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
    let stopped = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    // `withAutomaticReconnect` covers a dropped connection only; a failed first start, or a reconnect that gave up
    // (onclose), is retried here so "đang thử lại" stays true. The lists still refresh on focus and after every send.
    const start = (attempt: number) => {
      if (stopped) return
      connection
        .start()
        .then(() => {
          if (stopped) return
          setStatus(connection.state === HubConnectionState.Connected ? 'connected' : 'reconnecting')
          // Pushes may have been missed while offline.
          if (attempt > 0) refresh()
        })
        .catch(() => {
          if (stopped) return
          setStatus('reconnecting')
          clearTimeout(retryTimer)
          retryTimer = setTimeout(() => start(attempt + 1), retryDelaysMs[Math.min(attempt, retryDelaysMs.length - 1)])
        })
    }
    connection.onreconnecting(() => {
      if (!stopped) setStatus('reconnecting')
    })
    connection.onreconnected(() => {
      if (stopped) return
      setStatus('connected')
      refresh()
    })
    connection.onclose(() => {
      if (stopped) return
      setStatus('reconnecting')
      clearTimeout(retryTimer)
      retryTimer = setTimeout(() => start(1), retryDelaysMs[0])
    })

    start(0)
    return () => {
      stopped = true
      clearTimeout(retryTimer)
      void connection.stop().catch(() => undefined)
    }
  }, [queryClient])

  return status
}
