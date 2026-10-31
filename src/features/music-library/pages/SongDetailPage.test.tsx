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
  liturgicalSlots: [{ id: 'slot-2', name: 'Đáp ca' }],
  vocalRequirements: [{ skillId: 'sk1', skillName: 'Soprano', isMandatory: true, requiredCount: 1 }],
  instrumentRequirements: [],
}

const material = (fields: Partial<SongMaterial> & Pick<SongMaterial, 'id' | 'kind' | 'title' | 'fileName'>): SongMaterial => ({
  fileSizeBytes: null,
  targetSkillId: null,
  targetSkillName: null,
  url: `https://files.example/${fields.fileName}`,
  lyricsText: null,
  // Read back from the database without the Z suffix (tbd-backlog B7).
  createdAt: '2026-08-12T08:00:00',
  ...fields,
})

const materials: SongMaterial[] = [
  material({ id: 'm1', kind: 'sheetMusic', title: 'Bản nhạc SATB', fileName: 'con-buoc_SATB.pdf', fileSizeBytes: 2_516_582 }),
  material({ id: 'm2', kind: 'sampleAudio', title: 'Audio mẫu bè Tenor', fileName: 'audio-mau.mp3', targetSkillName: 'Tenor' }),
]

/** Opens the song page on one of its tabs (`?tab=`), as a link or reload would. */
const renderDetail = (tab?: 'classification' | 'materials') =>
  renderPage(<SongDetailPage />, '/director/library/:songId', `/director/library/s1${tab ? `?tab=${tab}` : ''}`)

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
    // Key metadata stands under the title on every tab.
    expect(screen.getByText('Giọng Rê trưởng · Nhạc: Lm. Kim Long')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Phân loại' }))
    expect(await screen.findByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getByText('Mùa Chay')).toBeInTheDocument()
    expect(screen.getByText('Đáp ca')).toBeInTheDocument()
    expect(screen.getByText('Soprano ×1 (bắt buộc)')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa phân loại')).toHaveLength(4)

    fireEvent.click(await screen.findByRole('tab', { name: 'Tài liệu (2)' }))
    for (const kind of ['Bản nhạc', 'Lời bài hát', 'Audio mẫu', 'Tài liệu tập luyện']) {
      expect(await screen.findByRole('heading', { level: 2, name: kind })).toBeInTheDocument()
    }
    expect(screen.getByText('Bản nhạc SATB')).toBeInTheDocument()
    expect(screen.getByText('con-buoc_SATB.pdf · 2.4 MB · tải lên 12/08/2026')).toBeInTheDocument()
    expect(screen.getByText('Tenor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phát Audio mẫu bè Tenor' })).toBeInTheDocument()

    // Each file link names its material and says it opens a new tab; the accepted files are told before picking one.
    expect(screen.getByRole('link', { name: 'Xem/Tải xuống Bản nhạc SATB (mở tab mới)' })).toHaveAttribute('target', '_blank')
    expect(screen.getAllByText(/tối đa 20 MB/)).toHaveLength(4)
  })

  it('keeps the song visible when its materials cannot be loaded', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue(classification)
    vi.spyOn(songsApi, 'listMaterials').mockRejectedValue(new ApiError(403, undefined))
    renderDetail('materials')

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

    it('saves the whole set with the number of people, offering only instrument skills for instrument requirements', async () => {
      withSong()
      withLookups()
      const update = vi.spyOn(songsApi, 'updateSongClassification').mockResolvedValue(classification)
      renderDetail('classification')

      const dialog = await openEditor()
      fireEvent.click(within(dialog).getByRole('button', { name: /Thêm nhạc cụ/ }))
      fireEvent.mouseDown(await within(dialog).findByRole('combobox', { name: 'Yêu cầu nhạc cụ 1' }))
      expect(await screen.findByRole('option', { name: 'Organ' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Soprano' })).toBeNull()
      fireEvent.click(screen.getByTitle('Organ'))
      fireEvent.click(within(dialog).getAllByRole('checkbox', { name: 'Bắt buộc' })[1])
      fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'Số người yêu cầu nhạc cụ 1' }), { target: { value: '2' } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu phân loại' }))

      await waitFor(() =>
        expect(update).toHaveBeenCalledWith('s1', {
          // Deactivated seasons are no longer in the lookup, yet the song keeps them.
          liturgicalSeasonIds: ['season-5', 'season-3'],
          massTypeIds: [],
          ceremonyTypeIds: [],
          songThemeIds: [],
          // A slot no longer offered by the lookup is kept, like the seasons.
          liturgicalSlotIds: ['slot-2'],
          vocalRequirements: [{ skillId: 'sk1', isMandatory: true, requiredCount: 1 }],
          instrumentRequirements: [{ skillId: 'sk2', isMandatory: true, requiredCount: 2 }],
        }),
      )
    })

    it('explains a choice that was deactivated meanwhile and keeps the editor open', async () => {
      withSong()
      withLookups()
      vi.spyOn(songsApi, 'updateSongClassification').mockRejectedValue(
        new ApiError(400, { code: 'SONG_CLASSIFICATION_TARGET_INVALID' }),
      )
      renderDetail('classification')

      const dialog = await openEditor()
      fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu phân loại' }))

      expect(await screen.findByText(/đã bị tắt hoặc không còn tồn tại/)).toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: 'Lưu phân loại' })).toBeInTheDocument()
    })
  })

  it('asks for a title, then uploads the file into the chosen material kind', async () => {
    withSong()
    const upload = vi
      .spyOn(songsApi, 'uploadMaterial')
      .mockResolvedValue(material({ id: 'm3', kind: 'lyrics', title: 'Lời 2 bè', fileName: 'loi.docx' }))
    renderDetail('materials')

    const lyrics = (await screen.findByRole('heading', { level: 2, name: 'Lời bài hát' })).closest('section')!
    const input = lyrics.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.accept).toBe('.docx')
    const file = new File(['lời'], 'loi.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    fireEvent.change(input, { target: { files: [file] } })

    const dialog = await screen.findByRole('dialog')
    const title = within(dialog).getByRole('textbox', { name: 'Tiêu đề' })
    expect(title).toHaveValue('loi')
    fireEvent.change(title, { target: { value: 'Lời 2 bè' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tải lên' }))

    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith('s1', { kind: 'lyrics', file, title: 'Lời 2 bè', targetSkillId: undefined }),
    )
  })

  it('drafts the lyrics of a sheet with AI, then saves them as typed lyrics', async () => {
    withSong()
    vi.spyOn(songsApi, 'extractLyrics').mockResolvedValue('Con bước lên bàn thờ Chúa')
    const upload = vi
      .spyOn(songsApi, 'uploadMaterial')
      .mockResolvedValue(material({ id: 'm3', kind: 'lyrics', title: 'Lời', fileName: null, url: null, lyricsText: 'Con bước' }))
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Trích lời từ Bản nhạc SATB' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('textbox', { name: 'Lời bài hát' })).toHaveValue('Con bước lên bàn thờ Chúa')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu lời bài hát' }))

    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith('s1', {
        kind: 'lyrics',
        title: 'Lời Con Bước Lên Bàn Thờ',
        lyricsText: 'Con bước lên bàn thờ Chúa',
      }),
    )
    expect(await screen.findByText('Đã lưu lời bài hát.')).toBeInTheDocument()
  })

  it('refuses a file the backend would reject without uploading it', async () => {
    withSong()
    const upload = vi.spyOn(songsApi, 'uploadMaterial')
    renderDetail('materials')

    const audio = (await screen.findByRole('heading', { level: 2, name: 'Audio mẫu' })).closest('section')!
    const input = audio.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'ban-nhac.pdf', { type: 'application/pdf' })] } })

    expect(await screen.findByText('Audio mẫu chỉ nhận tệp .mp3, .m4a, .wav, .mid, .midi.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(upload).not.toHaveBeenCalled()
  })

  it('explains an upload the backend refuses and keeps the dialog open', async () => {
    withSong()
    vi.spyOn(songsApi, 'uploadMaterial').mockRejectedValue(new ApiError(413, { code: 'MATERIAL_FILE_TOO_LARGE' }))
    renderDetail('materials')

    const sheet = (await screen.findByRole('heading', { level: 2, name: 'Bản nhạc' })).closest('section')!
    const input = sheet.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'ban-nhac.pdf', { type: 'application/pdf' })] } })
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tải lên' }))

    expect(await screen.findByText('Tệp vượt quá 20 MB. Vui lòng chọn tệp nhỏ hơn.')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Tiêu đề' })).toHaveValue('ban-nhac')
  })

  it('deletes a material only after confirmation', async () => {
    withSong()
    const remove = vi.spyOn(songsApi, 'deleteMaterial').mockResolvedValue()
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Xoá Bản nhạc SATB' }))
    // The dialog names the material and focuses Cancel, so Enter does not delete.
    const confirm = (await screen.findAllByText('Xoá tài liệu “Bản nhạc SATB”?'))[0].closest('.ant-modal') as HTMLElement
    await waitFor(() => expect(within(confirm).getByRole('button', { name: 'Hủy' })).toHaveFocus())
    expect(remove).not.toHaveBeenCalled()

    fireEvent.click(within(confirm).getByRole('button', { name: 'Xoá tài liệu' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith('m1'))
  })

  it('replaces the file of a material, keeping what members marked unless asked', async () => {
    withSong()
    const replace = vi.spyOn(songsApi, 'replaceMaterialFile').mockResolvedValue(materials[1])
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Thay file Audio mẫu bè Tenor' }))
    const dialog = await screen.findByRole('dialog')
    const file = new File(['x'], 'audio-moi.mp3', { type: 'audio/mpeg' })
    fireEvent.change(dialog.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })
    expect(await within(dialog).findByText('File mới: audio-moi.mp3')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('checkbox'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thay file' }))

    await waitFor(() => expect(replace).toHaveBeenCalledWith('m2', file, true, undefined))
    expect(await screen.findByText('Đã thay file và xoá tiến độ học của ca viên.')).toBeInTheDocument()
  })

  it('edits the title of a material and makes it for the whole choir', async () => {
    withSong()
    const update = vi.spyOn(songsApi, 'updateMaterial').mockResolvedValue()
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Sửa Audio mẫu bè Tenor' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Tệp: audio-mau.mp3/)).toBeInTheDocument()
    const title = within(dialog).getByRole('textbox', { name: 'Tiêu đề' })
    expect(title).toHaveValue('Audio mẫu bè Tenor')
    fireEvent.change(title, { target: { value: ' Audio mẫu cả ca đoàn ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith('m2', { title: 'Audio mẫu cả ca đoàn', targetSkillId: undefined }))
  })

  it('shows who has learned a material, filtered by status', async () => {
    withSong()
    const progress = vi.spyOn(songsApi, 'listLearningProgress').mockResolvedValue({
      items: [{ memberId: 'u1', fullName: 'Giuse Vũ Đình Khôi', status: 'learned', updatedAt: '2026-10-01T02:00:00Z' }],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
    })
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Xem tiến độ học Bản nhạc SATB' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Giuse Vũ Đình Khôi')).toBeInTheDocument()
    expect(within(dialog).getAllByText('Đã thuộc').length).toBeGreaterThan(0)
    expect(progress).toHaveBeenCalledWith('m1', undefined, { pageNumber: 1, pageSize: 20 })

    fireEvent.click(within(dialog).getByText('Cần tập thêm'))
    await waitFor(() => expect(progress).toHaveBeenCalledWith('m1', 'needsPractice', { pageNumber: 1, pageSize: 20 }))
  })

  it('deletes the song after confirmation and returns to the library', async () => {
    withSong()
    const remove = vi.spyOn(songsApi, 'deleteSong').mockResolvedValue()
    renderDetail()

    fireEvent.click(await screen.findByRole('button', { name: /Xoá bài hát/ }))
    // Ant Design renders a confirm title twice; the first one sits in the visible dialog.
    const confirm = (await screen.findAllByText(/^Xoá bài hát “.+”?$/))[0].closest('.ant-modal') as HTMLElement
    expect(remove).not.toHaveBeenCalled()
    fireEvent.click(within(confirm).getByRole('button', { name: 'Xoá bài hát' }))

    await waitFor(() => expect(remove).toHaveBeenCalledWith('s1'))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/library')
  })

  it('explains that a song already used cannot be deleted', async () => {
    withSong()
    vi.spyOn(songsApi, 'deleteSong').mockRejectedValue(new ApiError(409, { code: 'SONG_IN_USE' }))
    renderDetail()

    fireEvent.click(await screen.findByRole('button', { name: /Xoá bài hát/ }))
    const confirm = (await screen.findAllByText(/^Xoá bài hát “.+”?$/))[0].closest('.ant-modal') as HTMLElement
    fireEvent.click(within(confirm).getByRole('button', { name: 'Xoá bài hát' }))

    expect(
      await screen.findByText('Bài hát đã được dùng trong danh sách bài hát, buổi tập hoặc bài tập nên không xoá được.'),
    ).toBeInTheDocument()
  })
})
