import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import { clearSession } from '@/lib/auth/session'
import { useBackgroundTasks, type TaskOutcome } from '@/shared/tasks/BackgroundTasks'
import { TaskCenter } from './TaskCenter'

let finish: (outcome: TaskOutcome) => void
let fail: (error: Error) => void
const run = vi.fn(
  () =>
    new Promise<TaskOutcome>((resolve, reject) => {
      finish = resolve
      fail = reject
    }),
)

function Starter() {
  const { start } = useBackgroundTasks()
  const { pathname } = useLocation()
  return (
    <>
      <p>Trang {pathname}</p>
      <button
        type="button"
        onClick={() =>
          start({ type: 'extract-lyrics', key: 'extract-lyrics:m1', title: 'Trích lời từ Bản nhạc SATB', sourcePath: '/a', run, errorMessage: (error) => error.message })
        }
      >
        Bắt đầu
      </button>
    </>
  )
}

function renderCenter() {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <TaskCenter />
            <Starter />
          </>
        ),
        children: [{ path: '*' }],
      },
    ],
    { initialEntries: ['/a'] },
  )
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}

afterEach(() => {
  run.mockClear()
})

describe('TaskCenter', () => {
  it('keeps one task per key running across pages, then announces it with its action', async () => {
    const router = renderCenter()
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    expect(run).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '1 tác vụ đang chạy. Mở danh sách tác vụ' })).toBeInTheDocument()

    await act(() => router.navigate('/b'))
    expect(screen.getByText('Trang /b')).toBeInTheDocument()
    act(() => finish({ summary: 'Đã trích lời từ Bản nhạc SATB.', action: { label: 'Mở bản nháp', to: '/a?draft=m1' } }))

    expect(await screen.findByText('Đã trích lời từ Bản nhạc SATB.')).toBeInTheDocument()
    expect(screen.getByText('Trang /b')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mở bản nháp' }))
    await waitFor(() => expect(router.state.location.search).toBe('?draft=m1'))
    expect(screen.getByRole('button', { name: 'Mở danh sách tác vụ' })).toBeInTheDocument()
  })

  it('offers a retry when a task fails', async () => {
    renderCenter()
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    act(() => fail(new Error('Không thể trích lời lúc này.')))

    expect(await screen.findByText('Không thể trích lời lúc này.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(run).toHaveBeenCalledTimes(2)
    expect(await screen.findByRole('button', { name: '1 tác vụ đang chạy. Mở danh sách tác vụ' })).toBeInTheDocument()
  })

  it('drops every task when the session ends, and ignores a run that finishes afterwards', async () => {
    renderCenter()
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    await screen.findByRole('button', { name: /tác vụ đang chạy/ })

    act(() => clearSession())
    expect(screen.queryByRole('button', { name: /tác vụ/ })).toBeNull()
    act(() => finish({ summary: 'Đã trích lời từ Bản nhạc SATB.' }))
    await act(async () => {})
    expect(screen.queryByText('Đã trích lời từ Bản nhạc SATB.')).toBeNull()
  })
})
