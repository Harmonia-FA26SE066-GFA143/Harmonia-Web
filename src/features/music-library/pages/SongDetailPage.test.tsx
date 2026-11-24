import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as practiceApi from '@/features/practice/api/practiceApi'
import * as rehearsalsApi from '@/features/rehearsals/api/rehearsalsApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import * as client from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as songsApi from '../api/songsApi'
import { readLyricsDraft, saveLyricsDraft } from '../lyricsDraft'
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
  fileSizeBytes: null, fileRevision: 1,
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
  vi.spyOn(songsApi, 'getLatestLyricsExtraction').mockResolvedValue(null)
}

describe('SongDetailPage timed lyrics', () => {
  const lyrics = material({ id: 'l1', kind: 'lyrics', title: 'Lời', fileName: null, url: null, lyricsText: 'Dòng một\nDòng hai' })
  const openDrawer = async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue(classification)
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([...materials, lyrics])
    vi.spyOn(songsApi, 'getTimedLyrics').mockResolvedValue(null)
    renderDetail('materials')
    fireEvent.click(await screen.findByRole('button', { name: 'Soạn lời theo thời gian cho Audio mẫu bè Tenor' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Điền dòng từ lời đã chọn' }))
    await screen.findByLabelText('Lời dòng 2')
  }
  const setSeconds = (label: string, value: string) => {
    const input = screen.getByLabelText(label)
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
  }

  it('shows what to fix on the row and saves nothing', async () => {
    const save = vi.spyOn(songsApi, 'saveTimedLyrics')
    await openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu mốc thời gian' }))

    expect(await screen.findAllByText('Vui lòng nhập giây bắt đầu.')).toHaveLength(2)
    expect(save).not.toHaveBeenCalled()
  }, 30_000)
  it('sends the lines in order and reports a line past the audio', async () => {
    const save = vi.spyOn(songsApi, 'saveTimedLyrics').mockRejectedValue(new ApiError(400, { code: 'TIMED_LYRICS_EXCEEDS_DURATION' }))
    await openDrawer()
    setSeconds('Giây bắt đầu dòng 1', '0')
    setSeconds('Giây kết thúc dòng 1', '4')
    setSeconds('Giây bắt đầu dòng 2', '4')
    setSeconds('Giây kết thúc dòng 2', '9')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu mốc thời gian' }))

    await waitFor(() => expect(save).toHaveBeenCalledWith('m2', {
      lyricsMaterialId: 'l1',
      lines: [
        { order: 1, text: 'Dòng một', startSeconds: 0, endSeconds: 4 },
        { order: 2, text: 'Dòng hai', startSeconds: 4, endSeconds: 9 },
      ],
    }))
    expect(await screen.findByText(/kết thúc sau khi âm thanh đã hết/)).toBeInTheDocument()
  }, 30_000)
  it('asks before closing once the lines were changed, even by a button that fills them', async () => {
    await openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

    expect((await screen.findAllByText('Bỏ các mốc thời gian chưa lưu?')).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục sửa' }))
    expect(screen.getByLabelText('Lời dòng 2')).toHaveValue('Dòng hai')
  }, 30_000)
})

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
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
    // Key metadata stands under the title.
    expect(screen.getByText('Giọng Rê trưởng · Nhạc: Lm. Kim Long')).toBeInTheDocument()

    // Classification and materials sit beside the facts, no tab to pick.
    expect(await screen.findByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getByText('Mùa Chay')).toBeInTheDocument()
    expect(screen.getByText('Đáp ca')).toBeInTheDocument()
    expect(screen.getByText('Nữ cao ×1 (bắt buộc)')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa phân loại')).toHaveLength(4)

    for (const kind of ['Bản nhạc', 'Lời bài hát', 'Audio mẫu', 'Tài liệu tập luyện']) {
      expect(await screen.findByRole('heading', { level: 2, name: kind })).toBeInTheDocument()
    }
    expect(screen.getByText('Bản nhạc SATB')).toBeInTheDocument()
    expect(screen.getByText('con-buoc_SATB.pdf · 2.4 MB · tải lên 12/08/2026')).toBeInTheDocument()
    expect(screen.getByText('Tenor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phát Audio mẫu bè Tenor' })).toBeInTheDocument()

    // Each file link names its material and says it opens a new tab; the accepted files are told before picking one.
    expect(screen.getByRole('link', { name: 'Xem/Tải xuống Bản nhạc SATB (mở tab mới)' })).toHaveAttribute('target', '_blank')
    // One hint per kind, the interactive score included (BE d550665).
    expect(screen.getAllByText(/tối đa 20 MB/)).toHaveLength(5)
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
      fireEvent.click(await screen.findByRole('button', { name: /Sửa phân loại/ }))
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

  it('reads the lyrics of a sheet with AI as a server job and keeps the draft for "Mở bản nháp"', async () => {
    withSong()
    let answer!: (job: songsApi.LyricsExtractionJob) => void
    const start = vi.spyOn(songsApi, 'startLyricsExtraction').mockReturnValue(new Promise((resolve) => (answer = resolve)))
    renderDetail('materials')

    const extract = await screen.findByRole('button', { name: 'Trích lời từ Bản nhạc SATB' })
    fireEvent.click(extract)
    expect(await screen.findByText(/Đang trích lời. Bạn có thể chuyển trang hoặc tải lại trang/)).toBeInTheDocument()
    // One run per sheet: a second click while it reads starts nothing.
    fireEvent.click(extract)
    expect(start).toHaveBeenCalledTimes(1)

    answer({ id: 'j1', status: 'Succeeded', lyricsText: 'Con bước lên bàn thờ Chúa', errorCode: null })
    await waitFor(() => expect(readLyricsDraft('s1', 'm1')).toBe('Con bước lên bàn thờ Chúa'))
    // The form waits for the Director: the notification opens it.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens a kept draft from ?draft=, saves it as typed lyrics and forgets it', async () => {
    withSong()
    saveLyricsDraft('s1', 'm1', 'Con bước lên bàn thờ Chúa')
    const upload = vi
      .spyOn(songsApi, 'uploadMaterial')
      .mockResolvedValue(material({ id: 'm3', kind: 'lyrics', title: 'Lời', fileName: null, url: null, lyricsText: 'Con bước' }))
    renderPage(<SongDetailPage />, '/director/library/:songId', '/director/library/s1?tab=materials&draft=m1')

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
    expect(readLyricsDraft('s1', 'm1')).toBeUndefined()
  })

  it('keeps no draft when the AI finds no lyrics on the sheet', async () => {
    withSong()
    const start = vi.spyOn(songsApi, 'startLyricsExtraction').mockResolvedValue({ id: 'j1', status: 'Succeeded', lyricsText: '', errorCode: null })
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Trích lời từ Bản nhạc SATB' }))

    await waitFor(() => expect(start).toHaveBeenCalledWith('m1'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Trích lời từ Bản nhạc SATB' })).not.toHaveClass('ant-btn-loading'))
    expect(readLyricsDraft('s1', 'm1')).toBeUndefined()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('picks up a job that finished while the page was closed, without starting another', async () => {
    withSong()
    vi.spyOn(songsApi, 'getLatestLyricsExtraction').mockResolvedValue({ id: 'j9', status: 'Succeeded', lyricsText: 'Lời đã trích', errorCode: null })
    vi.spyOn(songsApi, 'getLyricsExtraction').mockResolvedValue({ id: 'j9', status: 'Succeeded', lyricsText: 'Lời đã trích', errorCode: null })
    const start = vi.spyOn(songsApi, 'startLyricsExtraction')
    renderDetail('materials')

    await waitFor(() => expect(readLyricsDraft('s1', 'm1')).toBe('Lời đã trích'))
    expect(songsApi.getLyricsExtraction).toHaveBeenCalledWith('m1', 'j9')
    expect(start).not.toHaveBeenCalled()
  })

  it('says the draft is gone when ?draft= names none', async () => {
    withSong()
    renderPage(<SongDetailPage />, '/director/library/:songId', '/director/library/s1?tab=materials&draft=m1')

    expect(await screen.findByText('Bản nháp lời đã hết hạn hoặc không còn. Bạn có thể trích lời lại.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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

  it('uploads a MusicXML score as an interactive score, with the instrument its playback is rendered with', async () => {
    withSong()
    const upload = vi
      .spyOn(songsApi, 'uploadMaterial')
      .mockResolvedValue(material({ id: 'm4', kind: 'interactiveScore', title: 'Bản tương tác', fileName: 'satb.mxl' }))
    renderDetail('materials')

    const score = (await screen.findByRole('heading', { level: 2, name: 'Bản nhạc tương tác' })).closest('section')!
    const input = score.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.accept).toBe('.musicxml,.mxl')
    const file = new File(['<score-partwise/>'], 'satb.mxl', { type: 'application/vnd.recordare.musicxml' })
    fireEvent.change(input, { target: { files: [file] } })

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Nhạc cụ phát')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tải lên' }))

    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith('s1', { kind: 'interactiveScore', file, title: 'satb', targetSkillId: undefined, instrument: 'piano' }),
    )
  })

  it('explains a MusicXML score the backend cannot play', async () => {
    withSong()
    vi.spyOn(songsApi, 'uploadMaterial').mockRejectedValue(new ApiError(422, { code: 'MATERIAL_SCORE_UNSUPPORTED' }))
    renderDetail('materials')

    const score = (await screen.findByRole('heading', { level: 2, name: 'Bản nhạc tương tác' })).closest('section')!
    const input = score.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['<x/>'], 'satb.musicxml', { type: 'application/xml' })] } })
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tải lên' }))

    expect(await screen.findByText(/Bản nhạc MusicXML này chưa phát được/)).toBeInTheDocument()
  })

  it('explains a MusicXML score that is damaged', async () => {
    withSong()
    vi.spyOn(songsApi, 'uploadMaterial').mockRejectedValue(new ApiError(422, { code: 'MATERIAL_SCORE_INVALID' }))
    renderDetail('materials')

    const score = (await screen.findByRole('heading', { level: 2, name: 'Bản nhạc tương tác' })).closest('section')!
    const input = score.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['<x/>'], 'satb.mxl')] } })
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tải lên' }))

    expect(await screen.findByText(/Tệp MusicXML bị hỏng/)).toBeInTheDocument()
  })

  it('downloads MIDI and MusicXML files instead of opening them in a tab', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue(classification)
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([
      ...materials,
      material({ id: 'm4', kind: 'interactiveScore', title: 'Bản tương tác', fileName: 'satb.mxl' }),
      material({ id: 'm5', kind: 'rehearsalMaterial', title: 'Nốt tập', fileName: 'tap.mid' }),
    ])
    renderDetail('materials')

    for (const title of ['Bản tương tác', 'Nốt tập']) {
      const download = await screen.findByRole('link', { name: `Tải xuống ${title}` })
      expect(download).toHaveAttribute('href', expect.stringContaining('https://files.example/'))
      expect(download).not.toHaveAttribute('target')
    }
    expect(screen.getByRole('link', { name: 'Xem/Tải xuống Bản nhạc SATB (mở tab mới)' })).toHaveAttribute('target', '_blank')
  })

  it('replaces a MusicXML score with the instrument its playback is rendered with', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue(classification)
    const score = material({ id: 'm4', kind: 'interactiveScore', title: 'Bản tương tác', fileName: 'satb.mxl' })
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([score])
    const replace = vi.spyOn(songsApi, 'replaceMaterialFile').mockResolvedValue(score)
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Thay file Bản tương tác' }))
    const dialog = await screen.findByRole('dialog')
    const file = new File(['<score-partwise/>'], 'moi.musicxml')
    fireEvent.change(dialog.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })
    expect(await within(dialog).findByText('Nhạc cụ phát trong phòng tập và ứng dụng di động')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thay file' }))

    await waitFor(() => expect(replace).toHaveBeenCalledWith('m4', file, false, 'piano'))
  })

  it('sends no instrument when a MIDI file is replaced by a file that is not rendered', async () => {
    vi.spyOn(songsApi, 'getSong').mockResolvedValue(song)
    vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue(classification)
    const midi = material({ id: 'm5', kind: 'rehearsalMaterial', title: 'Nốt tập', fileName: 'tap.mid' })
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([midi])
    const replace = vi.spyOn(songsApi, 'replaceMaterialFile').mockResolvedValue(midi)
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Thay file Nốt tập' }))
    const dialog = await screen.findByRole('dialog')
    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['m'], 'moi.mid')] } })
    expect(await within(dialog).findByText('Nhạc cụ phát trong phòng tập và ứng dụng di động')).toBeInTheDocument()
    const mp3 = new File(['a'], 'moi.mp3', { type: 'audio/mpeg' })
    // The upload field is remounted after each pick.
    fireEvent.change(dialog.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [mp3] } })
    await waitFor(() => expect(within(dialog).queryByText('Nhạc cụ phát trong phòng tập và ứng dụng di động')).toBeNull())
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thay file' }))

    await waitFor(() => expect(replace).toHaveBeenCalledWith('m5', mp3, false, undefined))
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

  it('opens the assignment form for this song, not the practice tab redirect', async () => {
    withSong()
    // A local probe that also shows the query, so the shared renderPage stays pathname-only.
    function SearchProbe() {
      const location = useLocation()
      return <p data-testid="location">{`${location.pathname}${location.search}`}</p>
    }
    const router = createMemoryRouter(
      [
        { path: '/director/library/:songId', element: <SongDetailPage /> },
        { path: '*', element: <SearchProbe /> },
      ],
      { initialEntries: ['/director/library/s1'] },
    )
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /Giao bài tập/ }))
    expect(await screen.findByTestId('location')).toHaveTextContent(/^\/director\/practice\/new\?songId=s1$/)
  })

  it('shows raw note URLs as safe links in clean paragraphs, never a javascript: link (G3-01)', async () => {
    withSong()
    vi.spyOn(songsApi, 'getSong').mockResolvedValue({
      ...song,
      notes: 'Nguồn: https://www.example.org/bai-hat.html).\n\n-----\n\n\n\njavascript:alert(1) và <b>đậm</b>',
    })
    renderDetail()

    const link = await screen.findByRole('link', { name: 'Liên kết tham khảo (example.org)' })
    expect(link).toHaveAttribute('href', 'https://www.example.org/bai-hat.html')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(document.querySelector('a[href^="javascript"]')).toBeNull()
    expect(document.querySelector('.ct-facts b')).toBeNull()
    expect(screen.getByText('javascript:alert(1) và <b>đậm</b>')).toBeInTheDocument()
    expect(screen.queryByText('-----')).not.toBeInTheDocument()
  })

  it('shows where the song is used from Choir Director endpoints only, never the Priest usage report', async () => {
    withSong()
    vi.spyOn(songsApi, 'getSong').mockResolvedValue({ ...song, timesUsed: 3, lastUsedDate: '2026-11-08' })
    const request = vi.spyOn(client, 'apiRequest')
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue({
      items: [{
        id: 'e1', eventName: 'Chúa Nhật I Mùa Vọng', date: '2099-11-29', time: '08:00', locationName: 'Nhà thờ chính',
        status: 'published', songListStatus: 'approved', songListDueDate: '2099-11-22', isSongListOverdue: false,
      }],
      pageNumber: 1, pageSize: 100, totalCount: 1, totalPages: 1,
    })
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({
      id: 'l1', eventId: 'e1', version: 1, status: 'approved', reviews: [],
      items: [{ id: 'i1', songId: 's1', songTitle: song.title, slotId: 'slot-1', slotName: 'Ca nhập lễ', displayOrder: 1 }],
    })
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue({
      items: [
        { id: 'r1', startAt: '2099-11-25T12:00:00Z', endAt: '2099-11-25T14:00:00Z', locationName: 'Phòng hát', songs: [{ songId: 's1', songTitle: song.title }] },
        { id: 'r2', startAt: '2099-11-26T12:00:00Z', endAt: '2099-11-26T14:00:00Z', songs: [{ songId: 'other', songTitle: 'Bài khác' }] },
      ],
      pageNumber: 1, pageSize: 100, totalCount: 2, totalPages: 1,
    })
    vi.spyOn(practiceApi, 'listAssignments').mockResolvedValue({
      items: [
        { id: 'a1', songId: 's1', title: 'Tập điệp khúc', scope: 'all', dueDate: '2099-11-27T16:00:00Z', skillIds: [], memberIds: [] },
        { id: 'a2', songId: 'other', title: 'Bài tập khác', scope: 'all', dueDate: '2099-11-27T16:00:00Z', skillIds: [], memberIds: [] },
      ],
      pageNumber: 1, pageSize: 100, totalCount: 2, totalPages: 1,
    })
    renderDetail()

    const usage = (await screen.findByRole('heading', { name: 'Nơi bài hát được dùng' })).closest('section') as HTMLElement
    expect(within(usage).getByText('Đã dùng 3 lần')).toBeInTheDocument()
    expect(within(usage).getByText(/Gần nhất: 08\/11\/2026/)).toBeInTheDocument()
    expect(await within(usage).findByRole('link', { name: /Chúa Nhật I Mùa Vọng/ })).toHaveAttribute('href', '/director/programs/e1')
    expect(within(usage).getByText(/Ca nhập lễ/)).toBeInTheDocument()

    const rehearsal = await within(usage).findByRole('link', { name: /Phòng hát/ })
    expect(rehearsal).toHaveAttribute('href', '/director/rehearsals/r1')
    // A rehearsal link is named by its date and time; r2 (26/11, another song) must not be listed.
    expect(within(usage).queryByRole('link', { name: /26\/11\/2099/ })).toBeNull()
    expect(within(usage).getAllByRole('link', { name: /Hạn/ })).toHaveLength(1)
    expect(within(usage).getByText('Tập điệp khúc')).toBeInTheDocument()
    expect(within(usage).queryByText('Bài tập khác')).not.toBeInTheDocument()
    expect(within(usage).getByRole('link', { name: /Giao bài tập/ })).toHaveAttribute('href', '/director/practice/new?songId=s1')

    expect(request.mock.calls.some(([path]) => path.includes('/api/reports/song-usage'))).toBe(false)
  })

  it('says a song never used and with no rehearsal or assignment honestly', async () => {
    withSong()
    vi.spyOn(songsApi, 'getSong').mockResolvedValue({ ...song, timesUsed: 0 })
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
    vi.spyOn(practiceApi, 'listAssignments').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
    renderDetail()

    expect(await screen.findByText('Chưa dùng trong Thánh lễ đã công bố nào')).toBeInTheDocument()
    expect(await screen.findByText('Chưa có buổi tập nào chọn bài này')).toBeInTheDocument()
    expect(await screen.findByText('Chưa có bài tập nào cho bài này')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Thánh lễ sắp tới' })).not.toBeInTheDocument()
  })

  it('finds an assignment of the song past the first 100, reading every page', async () => {
    withSong()
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
    const other = { songId: 'other', title: 'Bài tập khác', scope: 'all' as const, dueDate: '2099-11-27T16:00:00Z', skillIds: [], memberIds: [] }
    const list = vi.spyOn(practiceApi, 'listAssignments').mockImplementation(async (_eventId, page) =>
      page.pageNumber === 1
        ? { items: Array.from({ length: 100 }, (_, index) => ({ ...other, id: `o${index}` })), pageNumber: 1, pageSize: 100, totalCount: 101, totalPages: 2 }
        : { items: [{ ...other, id: 'a101', songId: 's1', title: 'Tập lại đoạn kết' }], pageNumber: 2, pageSize: 100, totalCount: 101, totalPages: 2 },
    )
    renderDetail()

    expect(await screen.findByText('Tập lại đoạn kết')).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith(undefined, { pageNumber: 2, pageSize: 100 })
    expect(screen.queryByText('Bài tập khác')).not.toBeInTheDocument()
  })

  it('shows a recoverable error for each usage group that cannot be loaded', async () => {
    withSong()
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
    // A 4xx is not retried, so both groups fail at once.
    vi.spyOn(rehearsalsApi, 'listRehearsals').mockRejectedValue(new ApiError(403, undefined))
    vi.spyOn(practiceApi, 'listAssignments').mockRejectedValue(new ApiError(403, undefined))
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không thể tải buổi tập' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Không thể tải bài tập' })).toBeInTheDocument()
    // The link to give an assignment stays usable.
    expect(screen.getByRole('link', { name: /Giao bài tập/ })).toHaveAttribute('href', '/director/practice/new?songId=s1')
  })

  it('focuses the title when editing and offers placeholders for the optional fields (G3-13)', async () => {
    withSong()
    renderDetail()

    fireEvent.click(await screen.findByRole('button', { name: /Chỉnh sửa$/ }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(within(dialog).getByRole('textbox', { name: 'Tên bài hát' })).toHaveFocus())
    expect(within(dialog).getByRole('textbox', { name: 'Người viết lời' })).toHaveAttribute('placeholder', 'Ví dụ: Xuân Tường')
  })

  it('names every classification select and keeps its list inside the drawer (G3-12)', async () => {
    withSong()
    // Nothing chosen yet, so every placeholder shows.
    vi.spyOn(songsApi, 'getSongClassification').mockResolvedValue({ ...classification, liturgicalSeasons: [], liturgicalSlots: [] })
    vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([{ id: 'season-5', name: 'Mùa Thường Niên' }])
    renderDetail('classification')

    fireEvent.click(await screen.findByRole('button', { name: /Sửa phân loại/ }))
    const dialog = await screen.findByRole('dialog')
    for (const placeholder of ['Chọn mùa phụng vụ', 'Chọn loại Thánh lễ', 'Chọn loại nghi thức', 'Chọn phần phụng vụ', 'Chọn chủ đề']) {
      expect(within(dialog).getByText(placeholder)).toBeInTheDocument()
    }
    // All fields are optional: no required asterisk.
    expect(dialog.querySelector('.ant-form-item-required')).toBeNull()
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Mùa phụng vụ' }))
    await waitFor(() => expect(dialog.querySelector('.ant-select-dropdown')).not.toBeNull())
  })

  it('shows learning progress in a "Tiến độ học" drawer with a muted placeholder for a missing date', async () => {
    withSong()
    vi.spyOn(songsApi, 'listLearningProgress').mockResolvedValue({
      items: [{ memberId: 'u1', fullName: 'Maria Trần Thị Hoa', status: 'notStarted', updatedAt: null }],
      pageNumber: 1, pageSize: 20, totalCount: 1, totalPages: 1,
    })
    renderDetail('materials')

    const opener = await screen.findByRole('button', { name: 'Xem tiến độ học Bản nhạc SATB' })
    expect(opener).toHaveTextContent('Tiến độ học')
    expect(opener).not.toHaveTextContent('Xem tiến độ học')
    fireEvent.click(opener)
    const dialog = await screen.findByRole('dialog', { name: 'Tiến độ học' })
    expect(within(dialog).getByRole('heading', { name: 'Bản nhạc SATB' })).toBeInTheDocument()
    expect(await within(dialog).findByText('Maria Trần Thị Hoa')).toBeInTheDocument()
    expect(within(dialog).queryByText('—')).not.toBeInTheDocument()
  })

  it('opens the timed lyrics editor at the 720px drawer tier, its select list inside the drawer', async () => {
    const lyrics = material({ id: 'l1', kind: 'lyrics', title: 'Lời', fileName: null, url: null, lyricsText: 'Dòng một' })
    withSong()
    vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([...materials, lyrics])
    vi.spyOn(songsApi, 'getTimedLyrics').mockResolvedValue(null)
    renderDetail('materials')

    fireEvent.click(await screen.findByRole('button', { name: 'Soạn lời theo thời gian cho Audio mẫu bè Tenor' }))
    const dialog = await screen.findByRole('dialog')
    const select = await within(dialog).findByRole('combobox', { name: 'Tài liệu lời' })
    expect((dialog.closest('.ant-drawer-content-wrapper') as HTMLElement).style.width).toBe('720px')
    fireEvent.mouseDown(select)
    await waitFor(() => expect(dialog.querySelector('.ant-select-dropdown')).not.toBeNull())
  }, 30_000)
})
