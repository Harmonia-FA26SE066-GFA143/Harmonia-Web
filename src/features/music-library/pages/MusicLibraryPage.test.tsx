import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '@/lib/api/client'
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
  localStorage.clear()
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
    expect(screen.getByRole('link', { name: 'Con Bước Lên Bàn Thờ' }).closest('li')).toHaveTextContent('Lm. Kim Long')
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
      expect.objectContaining({ pageNumber: 1, pageSize: 24 }),
    )
  })

  it('finds songs not classified yet or missing a material, and shows how each song is used', async () => {
    const request = vi.spyOn(client, 'apiRequest').mockImplementation(async (path) => {
      if (typeof path === 'string' && path.startsWith('/api/songs')) {
        return {
          ...page([]),
          totalCount: 1,
          totalPages: 1,
          items: [
            {
              ...song('s3', 'Kinh Hoà Bình'),
              materialCounts: { SheetMusic: 1, Lyrics: 0, SampleAudio: 0, RehearsalMaterial: 0 },
              isClassified: false,
              timesUsed: 3,
              lastUsedDate: '2026-10-18',
            },
          ],
        } as never
      }
      return [] as never
    })
    renderPage(<MusicLibraryPage />, '/director/library', '/director/library?classified=no&missingMaterial=sampleAudio')

    expect(await screen.findByText('Kinh Hoà Bình')).toBeInTheDocument()
    expect(screen.getByText('Chưa phân loại', { selector: '.ant-tag' })).toBeInTheDocument()
    // Materials in words, as the "Thiếu tài liệu" filter names them.
    const index = within(screen.getByRole('region', { name: 'Mục lục bài hát' }))
    expect(index.getByText('Bản nhạc')).toBeInTheDocument()
    expect(index.getByText('Chưa có audio mẫu')).toBeInTheDocument()
    expect(index.getByText('Chưa có lời bài hát')).toBeInTheDocument()
    expect(request).toHaveBeenCalledWith('/api/songs?isClassified=false&missingMaterialType=SampleAudio&pageNumber=1&pageSize=24')

    // Switch to table view and verify table row cells
    fireEvent.click(screen.getByRole('radio', { name: /Bảng/ }))
    const cells = (await screen.findByRole('row', { name: /Kinh Hoà Bình/ })).querySelectorAll('td')
    // Times used, then materials, as right-aligned figures.
    expect(cells[4]).toHaveTextContent('3')
    expect(cells[5]).toHaveTextContent('1')
  })

  it('restores the filters and the page from the address, as after Back from a song', async () => {
    const list = vi.spyOn(songsApi, 'listSongs').mockResolvedValue({ ...page(songs), totalCount: 45, totalPages: 3, pageNumber: 2 })
    renderPage(<MusicLibraryPage />, '/director/library', '/director/library?search=xin&seasonId=a1&slotId=s2&page=2')

    expect(await screen.findByText('Xin Vâng')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Tìm bài hát' })).toHaveValue('xin')
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'xin', seasonId: 'a1', slotId: 's2' }),
      expect.objectContaining({ pageNumber: 2, pageSize: 24 }),
    )
  })

  it('shows the active filters as chips that remove them, with the filter panel shut', async () => {
    const list = vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page(songs))
    renderPage(<MusicLibraryPage />, '/director/library', '/director/library?classified=no')

    expect(await screen.findByRole('button', { name: /Bộ lọc \(1\)$/ })).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lọc Phân loại: Chưa phân loại' }))

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ classified: 'no' }), expect.anything())
    await waitFor(() => expect(list.mock.lastCall?.[0].classified).toBeUndefined())
    // The removed chip's focus lands on the filter button, not the page start.
    expect(screen.getByRole('button', { name: /Bộ lọc$/ })).toHaveFocus()
  })

  it('links each title to its song page', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page(songs))
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByRole('link', { name: 'Con Bước Lên Bàn Thờ' })).toHaveAttribute('href', '/director/library/s1')
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

    expect(await within(dialog).findByText(/^Kho đã có bài hát cùng tên và cùng nhạc sĩ./)).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tên bài hát' })).toHaveValue('Xin Vâng')
  })

  it('switches between index list and table view with density control and stores selection in localStorage', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page(songs))
    renderPage(<MusicLibraryPage />, '/director/library')

    // Default is index view
    expect(await screen.findByRole('region', { name: 'Mục lục bài hát' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Mục lục/ })).toBeChecked()

    // Switch to table view
    fireEvent.click(screen.getByRole('radio', { name: /Bảng/ }))
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(localStorage.getItem('harmonia:music-library:view')).toBe('table')

    // Switch density to compact
    fireEvent.click(screen.getByRole('radio', { name: 'Gọn' }))
    expect(localStorage.getItem('harmonia:music-library:density')).toBe('compact')

    // Switch density back to comfortable
    fireEvent.click(screen.getByRole('radio', { name: 'Thoải mái' }))
    expect(localStorage.getItem('harmonia:music-library:density')).toBe('comfortable')

    // Switch back to index view
    fireEvent.click(screen.getByRole('radio', { name: /Mục lục/ }))
    expect(screen.getByRole('region', { name: 'Mục lục bài hát' })).toBeInTheDocument()
    expect(localStorage.getItem('harmonia:music-library:view')).toBe('index')
  })

  it('handles edge cases: long title, missing author, and without audio in index view', async () => {
    const longTitleSong: Song = {
      ...song('s-long', 'Bài Ca Tạ Ơn Thiên Chúa Đấng Tối Cao Ngự Trị Trên Các Tầng Trời và Ban Muôn Hồng Ân'),
      composer: null,
      lyricist: null,
      musicalKey: 'C',
      tempo: '4/4',
      materialCounts: { sheetMusic: 1, lyrics: 1, sampleAudio: 0, rehearsalMaterial: 0 },
    }
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(page([longTitleSong]))
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByText('Bài Ca Tạ Ơn Thiên Chúa Đấng Tối Cao Ngự Trị Trên Các Tầng Trời và Ban Muôn Hồng Ân')).toBeInTheDocument()
    expect(screen.getByText('Chưa ghi tác giả · Giọng C · Nhịp 4/4')).toBeInTheDocument()
    expect(screen.getByText('Bản nhạc')).toBeInTheDocument()
    expect(screen.getByText('Lời bài hát')).toBeInTheDocument()
    expect(screen.getByText('Chưa có audio mẫu')).toBeInTheDocument()
  })
})
