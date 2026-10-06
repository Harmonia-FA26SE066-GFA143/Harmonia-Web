import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as songsApi from '../api/songsApi'
import type { Song, SongClassification, SongMaterial } from '../types'
import { SongDetailPage } from './SongDetailPage'

const song: Song = {
  id: 's1',
  title: 'Con Bước Lên Bàn Thờ',
  composer: 'Lm. Kim Long',
  lyricist: null,
  musicalKey: 'Rê trưởng',
  tempo: null,
  notes: null,
}

const classification: SongClassification = {
  liturgicalSeasons: [
    { id: 'season-5', name: 'Mùa Thường Niên' },
    { id: 'season-3', name: 'Mùa Chay' },
  ],
  massTypes: [],
  ceremonyTypes: [],
  songThemes: [],
  vocalRequirements: [{ skillId: 'sk1', skillName: 'Soprano', isMandatory: true }],
  instrumentRequirements: [],
}

const materials: SongMaterial[] = [
  { id: 'm1', kind: 'sheetMusic', fileName: 'con-buoc_SATB.pdf', uploadedAt: '2026-08-12T08:00:00.000Z' },
  { id: 'm2', kind: 'sampleAudio', fileName: 'audio-mau.mp3', uploadedAt: '2026-08-15T08:00:00.000Z', url: 'blob:x' },
]

const renderDetail = () => renderPage(<SongDetailPage />, '/director/library/:songId', '/director/library/s1')

function withSong() {
  vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
  vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue(classification)
  vi.spyOn(songsApi, 'listMaterials').mockResolvedValue(materials)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SongDetailPage', () => {
  it('shows a recoverable error when the song cannot be loaded', async () => {
    vi.spyOn(songsApi, 'getSong').mockRejectedValue(new ApiError(403, undefined))
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không thể tải bài hát' })).toBeInTheDocument()
  })

  it('shows the not-found state for an unknown song', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(null)
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy bài hát' })).toBeInTheDocument()
  })

  it('shows the song fields, every classification value and materials grouped by kind', async () => {
    withSong()
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1, name: 'Con Bước Lên Bàn Thờ' })).toBeInTheDocument()
    expect(screen.getByText('Lm. Kim Long')).toBeInTheDocument()
    expect(screen.getByText('Rê trưởng')).toBeInTheDocument()
    expect(await screen.findByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getByText('Mùa Chay')).toBeInTheDocument()
    expect(screen.getByText('Soprano (bắt buộc)')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa phân loại')).toHaveLength(4)
    for (const kind of ['Bản nhạc', 'Lời bài hát', 'Audio mẫu', 'Tài liệu tập luyện']) {
      expect(await screen.findByRole('heading', { level: 3, name: kind })).toBeInTheDocument()
    }
    expect(screen.getByText('con-buoc_SATB.pdf')).toBeInTheDocument()
    expect(screen.getByLabelText('Nghe audio-mau.mp3')).toBeInTheDocument()
  })

  it('keeps the song visible when its materials cannot be loaded', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue(classification)
    vi.spyOn(songsApi, 'listMaterials').mockRejectedValue(new ApiError(403, undefined))
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không thể tải tài liệu' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Con Bước Lên Bàn Thờ' })).toBeInTheDocument()
  })

  it('saves edited song fields', async () => {
    withSong()
    const update = vi.spyOn(songsApi, 'updateSong').mockResolvedValue({ ...song, tempo: 'Andante' })
    renderDetail()

    fireEvent.click(await screen.findByRole('button', { name: /Chỉnh sửa/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Nhịp độ' }), { target: { value: 'Andante' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('s1', {
        title: 'Con Bước Lên Bàn Thờ',
        composer: 'Lm. Kim Long',
        lyricist: undefined,
        musicalKey: 'Rê trưởng',
        tempo: 'Andante',
        notes: undefined,
      }),
    )
  })

  it('uploads a file into the chosen material kind', async () => {
    withSong()
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
    withSong()
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
