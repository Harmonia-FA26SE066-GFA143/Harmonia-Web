import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import { ApiError } from '@/lib/api/errors'
import * as rehearsalsApi from '../api/rehearsalsApi'
import type { RehearsalRecording } from '../types'
import { RecordingPanel } from './RecordingPanel'

const EMPTY_TITLE = 'Chưa có bản thu nào cho bài hát này'

const take = (id: string, songId: string, createdAt: string): RehearsalRecording => ({
  id,
  songId,
  fileSizeBytes: 1000,
  durationSeconds: 65,
  audioUrl: `https://files.example/${id}.webm`,
  createdAt,
})

/** `{ rehearsalId: undefined }` renders the demo room; a default parameter would turn `undefined` back into 'r1'. */
const renderPanel = ({ rehearsalId }: { rehearsalId?: string } = { rehearsalId: 'r1' }) =>
  render(
    <AppProviders>
      <RecordingPanel rehearsalId={rehearsalId} songId="s1" songTitle="Kyrie" />
    </AppProviders>,
  )

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RecordingPanel takes list (G4-15b)', () => {
  it('shows a skeleton while the takes load, never the empty state', async () => {
    vi.spyOn(rehearsalsApi, 'listRecordings').mockReturnValue(new Promise(() => {}))
    renderPanel()
    expect(await screen.findByRole('status', { name: 'Đang tải bản thu' })).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_TITLE)).toBeNull()
  })

  it('with no take of this song, says so and that members listen on the mobile app', async () => {
    // A take of another song does not count for this one.
    vi.spyOn(rehearsalsApi, 'listRecordings').mockResolvedValue([take('other', 's2', '2026-11-20T10:00:00Z')])
    renderPanel()
    expect(await screen.findByRole('heading', { name: EMPTY_TITLE, level: 3 })).toBeInTheDocument()
    expect(screen.getByText(/Ca viên của ca đoàn sẽ nghe lại các bản thu này trên ứng dụng di động/)).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Đang tải bản thu' })).toBeNull()
  })

  it('a failed read shows the error and a retry, not the empty state', async () => {
    vi.spyOn(rehearsalsApi, 'listRecordings').mockRejectedValue(new ApiError(403, { code: 'FORBIDDEN' }))
    renderPanel()
    expect(await screen.findByText('Không thể tải các bản thu.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_TITLE)).toBeNull()
    expect(screen.queryByRole('status', { name: 'Đang tải bản thu' })).toBeNull()
  })

  it('lists this song’s takes, newest first, without the empty state', async () => {
    vi.spyOn(rehearsalsApi, 'listRecordings').mockResolvedValue([
      take('old', 's1', '2026-11-19T10:00:00Z'),
      take('new', 's1', '2026-11-20T10:00:00Z'),
    ])
    renderPanel()
    const deletes = await screen.findAllByRole('button', { name: /^Xoá bản thu \d của Kyrie$/ })
    expect(deletes.map((button) => button.getAttribute('aria-label'))).toEqual(['Xoá bản thu 2 của Kyrie', 'Xoá bản thu 1 của Kyrie'])
    expect(screen.queryByText(EMPTY_TITLE)).toBeNull()
  })

  it('in the demo room (no rehearsal) nothing loads, and the empty state shows', async () => {
    const list = vi.spyOn(rehearsalsApi, 'listRecordings')
    renderPanel({ rehearsalId: undefined })
    expect(await screen.findByRole('heading', { name: EMPTY_TITLE, level: 3 })).toBeInTheDocument()
    await waitFor(() => expect(list).not.toHaveBeenCalled())
  })
})
