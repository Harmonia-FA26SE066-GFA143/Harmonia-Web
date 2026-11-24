import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, setSession } from '@/lib/auth/session'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as api from '../api/notesApi'
import type { DirectorNote } from '../types'
import { DirectorNotesPage, PriestNotesPage } from './NotesPage'

// The hub is not reachable in a test; the page then says it is disconnected and works from the REST answers.
vi.mock('@microsoft/signalr', () => {
  class HubConnectionBuilder {
    withUrl() {
      return this
    }
    withAutomaticReconnect() {
      return this
    }
    build() {
      return { on() {}, onreconnecting() {}, onreconnected() {}, onclose() {}, start: () => Promise.reject(new Error('offline')), stop: () => Promise.resolve(), state: 'Disconnected' }
    }
  }
  return { HubConnectionBuilder, HubConnectionState: { Connected: 'Connected' } }
})

const note = (fields: Partial<DirectorNote>): DirectorNote => ({
  id: 'n1',
  fromUserId: 'priest-1',
  fromUserName: 'Cha Giuse',
  toUserId: 'me',
  toUserName: 'Anh Phêrô',
  content: 'Chúa Nhật này hát bộ lễ Seraphim.',
  sentAt: '2026-11-10T02:00:00Z',
  ...fields,
})

const threadPage = (items: DirectorNote[]) => ({ items, pageNumber: 1, pageSize: 30, totalCount: items.length, totalPages: 1 })
const renderNotes = () => renderPage(<DirectorNotesPage />, '/director/notes')

beforeEach(() => {
  setSession({
    accessToken: 'access',
    accessTokenExpiresAt: '2099-01-01T00:00:00Z',
    refreshToken: 'refresh',
    user: { id: 'me', email: 'phero@giaoxu.org', roleName: 'ChoirDirector' },
  })
  vi.spyOn(api, 'listRecipients').mockResolvedValue([
    { id: 'priest-1', fullName: 'Cha Giuse', email: 'giuse@giaoxu.org' },
    { id: 'priest-2', fullName: '', email: 'phanxico@giaoxu.org' },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
  clearSession()
})

describe('DirectorNotesPage', () => {
  it('says there is nobody to write to', async () => {
    vi.mocked(api.listRecipients).mockResolvedValue([])
    vi.spyOn(api, 'listConversations').mockResolvedValue([])
    renderNotes()

    expect(await screen.findByRole('heading', { name: 'Chưa có Cha xứ nào để nhắn' })).toBeInTheDocument()
  })

  it('lists everyone to write to, opens the latest conversation and marks it read', async () => {
    vi.spyOn(api, 'listConversations').mockResolvedValue([{ userId: 'priest-1', fullName: 'Cha Giuse', lastNote: note({}), unreadCount: 2 }])
    vi.spyOn(api, 'listThread').mockResolvedValue(threadPage([note({})]))
    const read = vi.spyOn(api, 'markConversationRead').mockResolvedValue()
    renderNotes()

    expect(await screen.findByRole('log', { name: 'Tin nhắn với Cha Giuse' })).toBeInTheDocument()
    // A recipient without a name is listed by email; the page says the live connection is down.
    expect(screen.getByRole('button', { name: 'phanxico@giaoxu.org' })).toBeInTheDocument()
    expect(screen.getByText('Mất kết nối, đang thử lại')).toBeInTheDocument()
    expect(screen.getByLabelText('2 tin chưa đọc')).toBeInTheDocument()
    await waitFor(() => expect(read.mock.calls[0]?.[0]).toBe('priest-1'))
  })

  it('sends a trimmed message to the open conversation and clears the composer', async () => {
    vi.spyOn(api, 'listConversations').mockResolvedValue([])
    vi.spyOn(api, 'listThread').mockResolvedValue(threadPage([]))
    const send = vi.spyOn(api, 'sendMessage').mockResolvedValue(note({ id: 'n2', fromUserId: 'me', toUserId: 'priest-1' }))
    renderNotes()

    const composer = await screen.findByLabelText('Nhắn cho Cha Giuse')
    expect(screen.getByRole('button', { name: /Gửi/ })).toBeDisabled()
    fireEvent.change(composer, { target: { value: '  Dạ con đã nhận.  ' } })
    fireEvent.click(screen.getByRole('button', { name: /Gửi/ }))

    await waitFor(() => expect(send.mock.calls[0]).toEqual(['priest-1', 'Dạ con đã nhận.']))
    await waitFor(() => expect(composer).toHaveValue(''))
  })

  it('shows the live state in the opaque chat header and a divider for each day', async () => {
    vi.spyOn(api, 'listConversations').mockResolvedValue([{ userId: 'priest-1', fullName: 'Cha Giuse', lastNote: note({}), unreadCount: 0 }])
    vi.spyOn(api, 'listThread').mockResolvedValue(
      // Newest first, as the backend pages them.
      threadPage([
        note({ id: 'n3', sentAt: '2026-11-10T03:00:00Z', content: 'Tin thứ ba' }),
        note({ id: 'n2', sentAt: '2026-11-10T02:00:00Z', content: 'Tin thứ hai' }),
        note({ id: 'n1', sentAt: '2026-11-08T02:00:00Z', content: 'Tin đầu' }),
      ]),
    )
    const { container } = renderNotes()

    await screen.findByText('Tin thứ ba')
    const live = screen.getByText('Mất kết nối, đang thử lại')
    expect(live.closest('.chat-header')).not.toBeNull()
    expect(screen.getAllByRole('separator', { name: /\d{2}\/\d{2}\/\d{4}|Hôm nay|Hôm qua/ })).toHaveLength(2)
    expect(screen.getByRole('separator', { name: '08/11/2026' })).toBeInTheDocument()
    expect(container.querySelector('.notes-shell-card')).not.toBeNull()
    expect(screen.getByLabelText('Nhắn cho Cha Giuse')).toHaveAccessibleDescription('Enter để gửi, Shift+Enter để xuống dòng.')
  })

  it('keeps the chat usable when one of its two lists fails', async () => {
    vi.spyOn(api, 'listConversations').mockRejectedValue(new ApiError(403, undefined))
    vi.spyOn(api, 'listThread').mockResolvedValue(threadPage([]))
    renderNotes()

    expect(await screen.findByRole('log', { name: 'Tin nhắn với Cha Giuse' })).toBeInTheDocument()
    expect(screen.getByText(/Không tải được các cuộc trò chuyện cũ/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Không thể tải cuộc trò chuyện' })).toBeNull()
  })

  it('blocks with a recoverable error only when both lists fail', async () => {
    vi.mocked(api.listRecipients).mockRejectedValue(new ApiError(403, undefined))
    vi.spyOn(api, 'listConversations').mockRejectedValue(new ApiError(403, undefined))
    renderNotes()

    expect(await screen.findByRole('heading', { name: 'Không thể tải cuộc trò chuyện' })).toBeInTheDocument()
  })
})

describe('PriestNotesPage', () => {
  it('keeps the note-by-date action in the page header and the chat beside it', async () => {
    vi.spyOn(api, 'listConversations').mockResolvedValue([])
    vi.spyOn(api, 'listThread').mockResolvedValue(threadPage([]))
    renderPage(<PriestNotesPage />, '/priest/notes')

    expect(await screen.findByRole('button', { name: /Gửi ghi chú theo ngày\/sự kiện/ })).toBeInTheDocument()
    expect(await screen.findByRole('log', { name: 'Tin nhắn với Cha Giuse' })).toBeInTheDocument()
  })
})
