import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as songsApi from '../api/songsApi'
import type { SongDetail } from '../types'
import { SongDetailPage } from './SongDetailPage'

const song: SongDetail = {
  id: 's1',
  title: 'Con Bước Lên Bàn Thờ',
  season: { id: 'season-5', name: 'Mùa Thường Niên' },
  vocalRequirements: 'Soprano, Alto, Tenor, Bass',
  materials: [
    { id: 'm1', kind: 'sheetMusic', fileName: 'con-buoc_SATB.pdf', uploadedAt: '2026-08-12T08:00:00.000Z' },
    { id: 'm2', kind: 'sampleAudio', fileName: 'audio-mau.mp3', uploadedAt: '2026-08-15T08:00:00.000Z', url: 'blob:x' },
  ],
}

const renderDetail = () => renderPage(<SongDetailPage />, '/director/library/:songId', '/director/library/s1')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SongDetailPage', () => {
  it('shows a recoverable error while the API contract is missing', async () => {
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không thể tải bài hát' })).toBeInTheDocument()
  })

  it('shows the not-found state for an unknown song', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(null)
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy bài hát' })).toBeInTheDocument()
  })

  it('shows the six FE-29 dimensions and materials grouped by the four kinds', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1, name: 'Con Bước Lên Bàn Thờ' })).toBeInTheDocument()
    expect(screen.getByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa phân loại')).toHaveLength(4)
    for (const kind of ['Bản nhạc', 'Lời bài hát', 'Audio mẫu', 'Tài liệu tập luyện']) {
      expect(screen.getByRole('heading', { level: 3, name: kind })).toBeInTheDocument()
    }
    expect(screen.getByText('con-buoc_SATB.pdf')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa có tài liệu')).toHaveLength(2)
    expect(screen.getByLabelText('Nghe audio-mau.mp3')).toBeInTheDocument()
  })

  it('uploads a file into the chosen material kind', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    const upload = vi
      .spyOn(songsApi, 'uploadMaterial')
      .mockResolvedValue({ id: 'm3', kind: 'lyrics', fileName: 'loi.pdf', uploadedAt: '2026-09-28T00:00:00.000Z' })
    renderDetail()

    const lyrics = (await screen.findByRole('heading', { level: 3, name: 'Lời bài hát' })).closest('section')!
    const input = lyrics.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['lời'], 'loi.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(upload).toHaveBeenCalledWith('s1', 'lyrics', file))
  })

  it('deletes a material only after confirmation', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    const remove = vi.spyOn(songsApi, 'deleteMaterial').mockResolvedValue()
    renderDetail()

    fireEvent.click(await screen.findByRole('button', { name: 'Xoá con-buoc_SATB.pdf' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Xoá tài liệu này?')).toBeInTheDocument()
    expect(remove).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Xoá' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith('s1', 'm1'))
  })
})
