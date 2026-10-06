import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
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

    fireEvent.click(await screen.findByRole('button', { name: /Chỉnh sửa$/ }))
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

  describe('classification', () => {
    const instrumentCategory = '0904ad8b-87f2-46c5-9938-f6cfbf0fa70b'

    function withLookups() {
      vi.spyOn(categoriesApi, 'listLookup').mockImplementation(async (kind) =>
        kind === 'skills'
          ? [
              { id: 'sk1', name: 'Soprano', categoryId: 'vocal-category' },
              { id: 'sk2', name: 'Organ', categoryId: instrumentCategory },
            ]
          : [],
      )
    }

    async function openEditor() {
      fireEvent.click(await screen.findByRole('button', { name: /Chỉnh sửa phân loại/ }))
      return screen.findByRole('dialog')
    }

    it('saves the whole set, offering only instrument skills for instrument requirements', async () => {
      withSong()
      withLookups()
      const update = vi.spyOn(songsApi, 'updateSongClassification').mockResolvedValue(classification)
      renderDetail()

      const dialog = await openEditor()
      fireEvent.click(within(dialog).getByRole('button', { name: /Thêm nhạc cụ/ }))
      fireEvent.mouseDown(await within(dialog).findByRole('combobox', { name: 'Yêu cầu nhạc cụ 1' }))
      expect(await screen.findByRole('option', { name: 'Organ' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Soprano' })).toBeNull()
      fireEvent.click(screen.getByTitle('Organ'))
      fireEvent.click(within(dialog).getAllByRole('checkbox', { name: 'Bắt buộc' })[1])
      fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu phân loại' }))

      await waitFor(() =>
        expect(update).toHaveBeenCalledWith('s1', {
          // Deactivated seasons are no longer in the lookup, yet the song keeps them.
          liturgicalSeasonIds: ['season-5', 'season-3'],
          massTypeIds: [],
          ceremonyTypeIds: [],
          songThemeIds: [],
          vocalRequirements: [{ skillId: 'sk1', isMandatory: true }],
          instrumentRequirements: [{ skillId: 'sk2', isMandatory: true }],
        }),
      )
    })

    it('explains a choice that was deactivated meanwhile and keeps the editor open', async () => {
      withSong()
      withLookups()
      vi.spyOn(songsApi, 'updateSongClassification').mockRejectedValue(
        new ApiError(400, { code: 'SONG_CLASSIFICATION_TARGET_INVALID' }),
      )
      renderDetail()

      const dialog = await openEditor()
      fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu phân loại' }))

      expect(await screen.findByText(/đã bị tắt hoặc không còn tồn tại/)).toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: 'Lưu phân loại' })).toBeInTheDocument()
    })
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
