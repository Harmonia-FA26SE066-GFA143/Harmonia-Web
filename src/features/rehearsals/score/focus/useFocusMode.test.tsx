import { StrictMode, useEffect, useRef, useState } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFocusMode } from './useFocusMode'

/**
 * Page: <div id="app"><header/><aside/><main><div id="room"><button id="toggle"/>…</div><footer/></main></div> and a
 * portal-like <div id="portal"> next to #app, the way an Ant Design popup sits next to #root.
 */
function setup({ mounted = true }: { mounted?: boolean } = {}) {
  const portal = document.createElement('div')
  portal.id = 'portal'
  const app = document.createElement('div')
  app.id = 'app'
  app.innerHTML = `
    <header id="header"></header>
    <aside id="sider"></aside>
    <main id="main">
      <div id="room" data-testid="room" tabindex="-1">
        <button id="toggle">Chế độ tập trung</button>
        <div id="sheet" tabindex="0" role="group"></div>
        <input id="field" />
        <textarea id="area"></textarea>
        <select id="choice"><option>a</option></select>
        <div id="rich" contenteditable="true"><span id="rich-child"></span></div>
        <div id="combo" role="combobox" aria-expanded="false" tabindex="0"></div>
        <div id="open-combo" role="combobox" aria-expanded="true" tabindex="0"></div>
      </div>
      <footer id="footer"></footer>
    </main>`
  document.body.append(app, portal)
  const on = (selector: string) => document.querySelector<HTMLElement>(selector)!
  const room = on('#room')
  const toggle = on('#toggle')

  const latest = { current: undefined as unknown as ReturnType<typeof useFocusMode> }
  function Harness() {
    const [root, setRoot] = useState<HTMLElement | null>(mounted ? room : null)
    const returnTo = useRef<HTMLElement | null>(toggle)
    const result = useFocusMode(root, returnTo)
    useEffect(() => {
      latest.current = result
    })
    return <button onClick={() => setRoot(null)}>unmount-root</button>
  }
  const view = render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  )
  return { on, room, toggle, view, hook: () => latest.current, app, portal }
}

afterEach(() => {
  document.body.replaceChildren()
  document.body.removeAttribute('style')
})

describe('useFocusMode, entering and leaving', () => {
  it('f on the section turns it on and f again turns it off', () => {
    const { on, hook } = setup()
    expect(hook().active).toBe(false)
    fireEvent.keyDown(on('#sheet'), { key: 'f' })
    expect(hook().active).toBe(true)
    fireEvent.keyDown(on('#sheet'), { key: 'f' })
    expect(hook().active).toBe(false)
  })

  it('also hears a capital F (caps lock) but not Shift+F, other modifiers or a held key', () => {
    const { on, hook } = setup()
    fireEvent.keyDown(on('#sheet'), { key: 'F' })
    expect(hook().active).toBe(true)
    fireEvent.keyDown(on('#sheet'), { key: 'f' })
    for (const modifier of [{ shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { repeat: true }]) {
      fireEvent.keyDown(on('#sheet'), { key: 'f', ...modifier })
    }
    expect(hook().active).toBe(false)
  })

  it('does not hear f outside the section', () => {
    const { on, hook } = setup()
    fireEvent.keyDown(on('#header'), { key: 'f' })
    fireEvent.keyDown(document.body, { key: 'f' })
    expect(hook().active).toBe(false)
  })

  it.each([
    ['an input', '#field'],
    ['a textarea', '#area'],
    ['a select', '#choice'],
    ['rich text', '#rich-child'],
  ])('f typed in %s is the field\'s own', (_name, selector) => {
    const { on, hook } = setup()
    fireEvent.keyDown(on(selector), { key: 'f' })
    expect(hook().active).toBe(false)
  })

  it('f while composing (Telex, IME) is not a shortcut', () => {
    const { on, hook } = setup()
    fireEvent.keyDown(on('#sheet'), { key: 'f', isComposing: true })
    expect(hook().active).toBe(false)
  })

  it('f already handled by something else is left alone', () => {
    const { on, hook, room } = setup()
    room.addEventListener('keydown', (event) => event.preventDefault(), { capture: true })
    fireEvent.keyDown(on('#sheet'), { key: 'f' })
    expect(hook().active).toBe(false)
  })

  it('Esc leaves, but only while on, and never types its way out of a field', () => {
    const { on, hook } = setup()
    fireEvent.keyDown(on('#sheet'), { key: 'Escape' })
    expect(hook().active).toBe(false)
    act(() => hook().toggle())
    expect(hook().active).toBe(true)
    fireEvent.keyDown(on('#field'), { key: 'Escape' })
    expect(hook().active).toBe(false)
  })

  it('Esc closes an open popup first: the combobox that is expanded keeps focus mode on', () => {
    const { on, hook } = setup()
    act(() => hook().toggle())
    fireEvent.keyDown(on('#open-combo'), { key: 'Escape' })
    expect(hook().active).toBe(true)
    fireEvent.keyDown(on('#combo'), { key: 'Escape' })
    expect(hook().active).toBe(false)
  })

  it('Esc while composing or with a modifier does not leave', () => {
    const { on, hook } = setup()
    act(() => hook().toggle())
    fireEvent.keyDown(on('#sheet'), { key: 'Escape', isComposing: true })
    fireEvent.keyDown(on('#sheet'), { key: 'Escape', ctrlKey: true })
    expect(hook().active).toBe(true)
  })

  it('without a section nothing can be on', () => {
    const { hook } = setup({ mounted: false })
    act(() => hook().toggle())
    expect(hook().active).toBe(false)
  })
})

describe('useFocusMode, the focus', () => {
  it('moves the focus to the section when it turns on', () => {
    const { room, hook } = setup()
    act(() => hook().toggle())
    expect(document.activeElement).toBe(room)
  })

  it('gives it back to the toggle button when it turns off, by Esc, by f or by the button', () => {
    const { on, toggle, hook } = setup()
    for (const leave of [
      () => fireEvent.keyDown(on('#sheet'), { key: 'Escape' }),
      () => fireEvent.keyDown(on('#sheet'), { key: 'f' }),
      () => act(() => hook().exit()),
    ]) {
      act(() => hook().toggle())
      on('#sheet').focus()
      leave()
      expect(hook().active).toBe(false)
      expect(document.activeElement).toBe(toggle)
    }
  })

  it('does not steal the focus when the section goes away with the mode on', () => {
    const { hook, view, room } = setup()
    act(() => hook().toggle())
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    room.remove() // the section and its button leave the page
    fireEvent.click(view.getByText('unmount-root'))
    expect(hook().active).toBe(false)
    expect(document.activeElement).toBe(outside)
  })
})

describe('useFocusMode, the page behind', () => {
  const OTHERS = ['#header', '#sider', '#footer']

  it('makes everything beside the section inert while on, and nothing else', () => {
    const { on, hook, portal } = setup()
    act(() => hook().toggle())
    for (const selector of OTHERS) expect(on(selector)).toHaveAttribute('inert')
    for (const selector of ['#main', '#app', '#room', '#sheet', '#toggle']) expect(on(selector)).not.toHaveAttribute('inert')
    // a popup next to the app root (an Ant Design dropdown) stays usable
    expect(portal).not.toHaveAttribute('inert')
  })

  it('holds the page scroll while on and puts back what the body had', () => {
    document.body.style.overflow = 'scroll'
    const { hook } = setup()
    act(() => hook().toggle())
    expect(document.body.style.overflow).toBe('hidden')
    act(() => hook().toggle())
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('leaves nothing behind after leaving: no class, no inert, no style', () => {
    const htmlClass = document.documentElement.className
    const { on, hook } = setup()
    act(() => hook().toggle())
    act(() => hook().toggle())
    expect(document.body.className).toBe('')
    expect(document.documentElement.className).toBe(htmlClass)
    expect(document.body.getAttribute('style') ?? '').toBe('')
    for (const selector of OTHERS) expect(on(selector)).not.toHaveAttribute('inert')
  })

  it('keeps an element that was inert before, inert after', () => {
    const { on, hook } = setup()
    on('#sider').setAttribute('inert', '')
    act(() => hook().toggle())
    act(() => hook().toggle())
    expect(on('#sider')).toHaveAttribute('inert')
    expect(on('#header')).not.toHaveAttribute('inert')
  })

  it('leaves nothing behind when the section goes away with the mode on', () => {
    const { on, hook, view } = setup()
    act(() => hook().toggle())
    fireEvent.click(view.getByText('unmount-root'))
    expect(document.body.getAttribute('style') ?? '').toBe('')
    for (const selector of OTHERS) expect(on(selector)).not.toHaveAttribute('inert')
  })

  it('leaves nothing behind when the component unmounts with the mode on', () => {
    const { on, hook, view } = setup()
    act(() => hook().toggle())
    view.unmount()
    expect(document.body.getAttribute('style') ?? '').toBe('')
    for (const selector of OTHERS) expect(on(selector)).not.toHaveAttribute('inert')
  })
})

describe('useFocusMode, listeners', () => {
  it('binds one keydown listener per section and removes every one it added', () => {
    const add = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
    const { hook, view, room } = setup()
    act(() => hook().toggle())
    act(() => hook().toggle())
    view.unmount()
    const onRoom = (spy: typeof add) => spy.mock.calls.filter(([type], index) => type === 'keydown' && spy.mock.contexts[index] === room)
    const added = onRoom(add)
    const removed = onRoom(remove)
    expect(added.length).toBeGreaterThan(0)
    expect(removed.length).toBe(added.length)
    for (const [, listener] of added) expect(removed.some(([, gone]) => gone === listener)).toBe(true)
    add.mockRestore()
    remove.mockRestore()
  })
})
