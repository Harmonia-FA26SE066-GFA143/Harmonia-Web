/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import { describe, expect, it } from 'vitest'
import { ScoreCredit } from './ScoreCredit'
import { VEROVIO_LICENSE_ID, VEROVIO_SOURCE_URL, VEROVIO_VERSION } from './verovioNotice'

const root = process.cwd()
const readText = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8')
const LICENSE_DIR = ['src', 'features', 'rehearsals', 'score', 'license']

// Without motion the dialog is gone as soon as it is closed: jsdom has no animation events to end the leave transition.
const renderCredit = () =>
  render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <ScoreCredit />
    </ConfigProvider>,
  )
// A real click focuses the button before it opens the dialog; fireEvent.click does not.
const open = () => {
  renderCredit()
  const trigger = screen.getByRole('button', { name: 'Giấy phép của Verovio' })
  act(() => trigger.focus())
  fireEvent.click(trigger)
  return trigger
}
const findDialog = () => screen.findByRole('dialog', { name: 'Giấy phép của Verovio' })

describe('ScoreCredit, the visible line', () => {
  it('says the sheet is engraved with Verovio and offers the licence, in Vietnamese', () => {
    renderCredit()
    expect(screen.getByText(/Bản nhạc được dựng bằng Verovio/)).toBeInTheDocument()
    // The visible text "Giấy phép" is the start of the accessible name (label in name).
    const trigger = screen.getByRole('button', { name: 'Giấy phép của Verovio' })
    expect(trigger).toHaveTextContent('Giấy phép')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('ScoreCredit, the licence dialog', () => {
  it('names the library, the version in use, the licence, the source, and says it is used unmodified in its own lazy chunk', async () => {
    open()
    const dialog = await findDialog()
    expect(dialog).toHaveTextContent('Verovio')
    expect(dialog).toHaveTextContent(`phiên bản ${VEROVIO_VERSION}`)
    expect(dialog).toHaveTextContent(VEROVIO_LICENSE_ID)
    expect(dialog).toHaveTextContent('GNU Lesser General Public License')
    const source = within(dialog).getByRole('link', { name: VEROVIO_SOURCE_URL })
    expect(source).toHaveAttribute('href', VEROVIO_SOURCE_URL)
    expect(source).toHaveAttribute('target', '_blank')
    expect(source).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(dialog).toHaveTextContent('nguyên bản')
    expect(dialog).toHaveTextContent('chưa sửa đổi')
    expect(dialog).toHaveTextContent('tệp riêng')
    expect(dialog).toHaveTextContent('chỉ tải khi')
  })

  it('states facts only: no legal conclusion', async () => {
    open()
    const text = (await findDialog()).textContent ?? ''
    // Words that would claim compliance or give advice; the dialog only reports library, licence and source.
    expect(text).not.toMatch(/tuân thủ|hợp pháp|đúng luật|tư vấn|được phép (?:sử dụng|dùng) miễn phí/i)
  })

  it('pins its facts to the installed package: version, licence and repository', () => {
    const app = JSON.parse(readText('package.json')) as { dependencies: Record<string, string> }
    const library = JSON.parse(readText('node_modules', 'verovio', 'package.json')) as { version: string; license: string; repository: { url: string } }
    expect(app.dependencies.verovio).toBe(VEROVIO_VERSION)
    expect(library.version).toBe(VEROVIO_VERSION)
    expect(library.license).toBe(VEROVIO_LICENSE_ID)
    expect(library.repository.url).toBe(`${VEROVIO_SOURCE_URL}.git`)
  })

  it('shows the full text of the LGPL-3.0 and of the GPL-3.0 it refers to, word for word', async () => {
    open()
    const dialog = await findDialog()
    const lgpl = readText(...LICENSE_DIR, 'lgpl-3.0.txt')
    const gpl = readText(...LICENSE_DIR, 'gpl-3.0.txt')
    expect(lgpl.startsWith('                   GNU LESSER GENERAL PUBLIC LICENSE')).toBe(true)
    expect(gpl.startsWith('                    GNU GENERAL PUBLIC LICENSE')).toBe(true)
    await waitFor(() => expect(dialog.querySelectorAll('pre')).toHaveLength(2))
    const [first, second] = [...dialog.querySelectorAll('pre')]
    expect(first.textContent).toBe(lgpl)
    expect(second.textContent).toBe(gpl)
    expect(within(dialog).getByRole('heading', { name: /^Bản văn LGPL-3\.0/ })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: /^Bản văn GPL-3\.0/ })).toBeInTheDocument()
  })

  it('has one scroll region, focusable by keyboard, and wraps the long text instead of scrolling it sideways', async () => {
    open()
    const dialog = await findDialog()
    await waitFor(() => expect(dialog.querySelectorAll('pre')).toHaveLength(2))
    const scrollers = [...dialog.querySelectorAll<HTMLElement>('*')].filter((element) => /overflow(?:-[xy])?:\s*(?:auto|scroll)/.test(element.getAttribute('style') ?? ''))
    expect(scrollers).toHaveLength(1)
    expect(scrollers[0]).toHaveAttribute('tabindex', '0')
    expect(scrollers[0]).toHaveAccessibleName('Nội dung giấy phép')
    for (const pre of dialog.querySelectorAll('pre')) expect(pre).toHaveStyle({ whiteSpace: 'pre-wrap' })
  })

  it('closes with its button and gives the focus back to the link that opened it', async () => {
    const trigger = open()
    const dialog = await findDialog()
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    fireEvent.click(screen.getByRole('button', { name: /Đóng/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes with Esc and gives the focus back too', async () => {
    const trigger = open()
    const dialog = await findDialog()
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    fireEvent.keyDown(document.activeElement ?? dialog,{ key: 'Escape', code: 'Escape', keyCode: 27 })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
