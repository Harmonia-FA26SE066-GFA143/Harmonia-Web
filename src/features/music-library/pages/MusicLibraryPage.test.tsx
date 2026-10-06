import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import { renderPage } from '@/test/renderPage'
import * as songsApi from '../api/songsApi'
import type { Song } from '../types'
import { MusicLibraryPage } from './MusicLibraryPage'

const song = (id: string, title: string, composer: string | null = null): Song => ({
  id,
  title,
  composer,
  lyricist: null,
  musicalKey: null,
  tempo: null,
  notes: null,
})

const page = (items: Song[]): PagedList<Song> => ({
  items,
  pageNumber: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: items.length ? 1 : 0,
})

const songs = [song('s1', 'Con Bước Lên Bàn Thờ', 'Lm. Kim Long'), song('s2', 'Xin Vâng')]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MusicLibraryPage', () => {
  it('shows a recoverable error when the library cannot be loaded', async () => {
    vi.spyOn(songsApi, 'listSongs').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByRole('heading', { name: 'Không thể tải kho bài hát' })).toBeInTheDocument()
  })

  it('shows the empty state with an add action', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page([]))
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByRole('heading', { name: 'Chưa có bài hát nào' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Thêm bài hát/ }).length).toBeGreaterThan(0)
  })

  it('lists one page of songs with their composer and the total count', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page(songs))
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByText('Con Bước Lên Bàn Thờ')).toBeInTheDocument()
    expect(screen.getByText('Lm. Kim Long')).toBeInTheDocument()
    expect(screen.getByText('2 bài hát')).toBeInTheDocument()
  })

  it('searches on the server and distinguishes no results', async () => {
    const list = vi.spyOn(songsApi, 'listSongs').mockImplementation(async (filters) =>
      page(filters.search ? [] : songs),
    )
    renderPage(<MusicLibraryPage />, '/director/library')

    fireEvent.change(await screen.findByRole('textbox', { name: 'Tìm bài hát' }), { target: { value: 'không có' } })
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'không có' }),
      expect.objectContaining({ pageNumber: 1, pageSize: 20 }),
    )
  })

  it('adds a song with only the title required and opens it', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page(songs))
    const create = vi.spyOn(songsApi, 'createSong').mockResolvedValue(song('new', 'Hãy Trở Về', 'Thái Nguyên'))
    renderPage(<MusicLibraryPage />, '/director/library')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm bài hát/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu bài hát' }))
    expect(await within(dialog).findByText('Vui lòng nhập tên bài hát.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên bài hát' }), { target: { value: ' Hãy Trở Về ' } })
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Nhạc sĩ' }), { target: { value: 'Thái Nguyên ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu bài hát' }))

    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hãy Trở Về', composer: 'Thái Nguyên' })))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/library/new')
  })

  it('explains a duplicate title under the field and keeps the form open', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page(songs))
    vi.spyOn(songsApi, 'createSong').mockRejectedValue(new ApiError(409, { code: 'SONG_TITLE_DUPLICATE' }))
    renderPage(<MusicLibraryPage />, '/director/library')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm bài hát/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên bài hát' }), { target: { value: 'Xin Vâng' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu bài hát' }))

    expect(await within(dialog).findByText('Kho đã có bài hát cùng tên và cùng nhạc sĩ.')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tên bài hát' })).toHaveValue('Xin Vâng')
  })
})
