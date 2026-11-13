import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PagedList } from '@/lib/api/paging'
import { setSession } from '@/lib/auth/session'
import { renderPage } from '@/test/renderPage'
import * as notesApi from '../api/notesApi'
import type { DirectorNote, NoteConversation } from '../types'
import { DirectorNotesPage } from './NotesPage'

// The page listens on a SignalR hub; the test decides whether it connects.
const hub = vi.hoisted(() => ({ start: () => Promise.resolve() as Promise<void> }))
vi.mock('@microsoft/signalr', () => {
  const connection = {
    state: 'Connected',
    on: () => {},
    onreconnecting: () => {},
    onreconnected: () => {},
    onclose: () => {},
    start: () => hub.start(),
    stop: () => Promise.resolve(),
  }
  const builder = { withUrl: () => builder, withAutomaticReconnect: () => builder, build: () => connection }
  return { HubConnectionBuilder: class { constructor() { return builder } }, HubConnectionState: { Connected: 'Connected' } }
})

const note = (patch: Partial<DirectorNote>): DirectorNote => ({
  id: 'n1',
  fromUserId: 'p1',
  fromUserName: 'Cha Phaolô',
  toUserId: 'me',
  toUserName: 'Ca trưởng',
  content: 'Chúa nhật này tập thêm bài Kinh Hòa Bình',
  sentAt: '2026-11-12T01:00:00Z',
  ...patch,
})

const conversation: NoteConversation = { userId: 'p1', fullName: 'Cha Phaolô', lastNote: note({}), unreadCount: 2 }
const thread = (items: DirectorNote[]): PagedList<DirectorNote> => ({ items, pageNumber: 1, pageSize: 30, totalCount: items.length, totalPages: 1 })

const renderNotes = () => renderPage(<DirectorNotesPage />, '/director/notes')

beforeEach(() => {
  hub.start = () => Promise.resolve()
  setSession({ accessToken: 't', accessTokenExpiresAt: '2099-01-01T00:00:00Z', refreshToken: 'r', user: { id: 'me', email: 'ct@giaoxu.vn', roleName: 'ChoirDirector' } })
  vi.spyOn(notesApi, 'listThread').mockResolvedValue(thread([note({})]))
  vi.spyOn(notesApi, 'markConversationRead').mockResolvedValue()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('DirectorNotesPage', () => {
  it('lists conversations first, then recipients not yet talked to, and reads the open one', async () => {
    vi.spyOn(notesApi, 'listConversations').mockResolvedValue([conversation])
    vi.spyOn(notesApi, 'listRecipients').mockResolvedValue([
      { id: 'p2', fullName: '', email: 'cha.giuse@giaoxu.vn' },
      { id: 'p1', fullName: 'Cha Phaolô', email: 'cha.phaolo@giaoxu.vn' },
    ])
    renderNotes()

    const nav = await screen.findByRole('navigation', { name: 'Cuộc trò chuyện' })
    const contacts = within(nav).getAllByRole('button')
    expect(contacts.map((button) => button.textContent)).toEqual([
      expect.stringContaining('Cha Phaolô'),
      expect.stringContaining('cha.giuse@giaoxu.vn'),
    ])
    expect(contacts[0]).toHaveAttribute('aria-current', 'true')
    expect(within(contacts[0]).getByLabelText('2 tin chưa đọc')).toBeInTheDocument()
    await waitFor(() => expect(notesApi.markConversationRead).toHaveBeenCalledWith('p1'))
    expect(await screen.findByText('Đang kết nối')).toBeInTheDocument()
  })

  it('sends a trimmed message on Enter and clears the box', async () => {
    vi.spyOn(notesApi, 'listConversations').mockResolvedValue([{ ...conversation, unreadCount: 0 }])
    vi.spyOn(notesApi, 'listRecipients').mockResolvedValue([])
    const send = vi.spyOn(notesApi, 'sendMessage').mockResolvedValue(note({ id: 'n2', fromUserId: 'me', content: 'Dạ con biết rồi' }))
    renderNotes()

    const box = await screen.findByLabelText('Nhắn cho Cha Phaolô')
    fireEvent.change(box, { target: { value: '  Dạ con biết rồi  ' } })
    fireEvent.keyDown(box, { key: 'Enter', keyCode: 13 })

    await waitFor(() => expect(send).toHaveBeenCalledWith('p1', 'Dạ con biết rồi'))
    await waitFor(() => expect(box).toHaveValue(''))
    expect(notesApi.markConversationRead).not.toHaveBeenCalled()
  })

  it('says when there is nobody to write to', async () => {
    vi.spyOn(notesApi, 'listConversations').mockResolvedValue([])
    vi.spyOn(notesApi, 'listRecipients').mockResolvedValue([])
    renderNotes()
    expect(await screen.findByText('Chưa có Cha xứ nào để nhắn')).toBeInTheDocument()
  })

  it('says so when the live connection fails', async () => {
    hub.start = () => Promise.reject(new Error('offline'))
    vi.spyOn(notesApi, 'listConversations').mockResolvedValue([])
    vi.spyOn(notesApi, 'listRecipients').mockResolvedValue([])
    renderNotes()
    expect(await screen.findByText('Mất kết nối, đang thử lại')).toBeInTheDocument()
  })
})
