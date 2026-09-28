import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as songsApi from '../api/songsApi'
import type { Song } from '../types'
import { MusicLibraryPage } from './MusicLibraryPage'

const songs: Song[] = [
  {
    id: 's1',
    title: 'Con Bước Lên Bàn Thờ',
    season: { id: 'season-5', name: 'Mùa Thường Niên' },
    theme: 'Nhập lễ',
    vocalRequirements: 'Soprano, Alto, Tenor, Bass',
    instrumentRequirements: 'Organ',
    availableMaterials: ['sheetMusic', 'sampleAudio'],
  },
  { id: 's2', title: 'Xin Vâng', theme: 'Đức Mẹ', availableMaterials: [] },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MusicLibraryPage', () => {
  it('shows a recoverable error while the library API contract is missing', async () => {
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByRole('heading', { name: 'Không thể tải kho bài hát' })).toBeInTheDocument()
  })

  it('shows the empty state with an add action', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue([])
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByRole('heading', { name: 'Chưa có bài hát nào' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Thêm bài hát/ }).length).toBeGreaterThan(0)
  })

  it('lists songs with classification, requirements and available materials', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(songs)
    renderPage(<MusicLibraryPage />, '/director/library')

    expect(await screen.findByText('Con Bước Lên Bàn Thờ')).toBeInTheDocument()
    expect(screen.getByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getByText('Soprano, Alto, Tenor, Bass')).toBeInTheDocument()
    expect(screen.getByText('Bản nhạc')).toBeInTheDocument()
    expect(screen.getByText('Audio mẫu')).toBeInTheDocument()
    expect(screen.getByText('Chưa có')).toBeInTheDocument()
    expect(screen.getByText('2 bài hát')).toBeInTheDocument()
  })

  it('searches by title and distinguishes no results', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(songs)
    renderPage(<MusicLibraryPage />, '/director/library')

    const search = await screen.findByRole('textbox', { name: 'Tìm theo tên bài hát' })
    fireEvent.change(search, { target: { value: 'xin vang' } })
    expect(screen.queryByText('Con Bước Lên Bàn Thờ')).toBeNull()
    expect(screen.getByText('Xin Vâng')).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'không có' } })
    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
  })

  it('adds a song with only the title required and opens it', async () => {
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue(songs)
    const create = vi.spyOn(songsApi, 'createSong').mockResolvedValue({ id: 'new', title: 'Hãy Trở Về', availableMaterials: [] })
    renderPage(<MusicLibraryPage />, '/director/library')

    fireEvent.click(await screen.findByRole('button', { name: /Thêm bài hát/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu bài hát' }))
    expect(await within(dialog).findByText('Vui lòng nhập tên bài hát.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Tên bài hát' }), { target: { value: ' Hãy Trở Về ' } })
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Chủ đề' }), { target: { value: 'Sám hối ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu bài hát' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hãy Trở Về', theme: 'Sám hối' })),
    )
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/library/new')
  })
})
