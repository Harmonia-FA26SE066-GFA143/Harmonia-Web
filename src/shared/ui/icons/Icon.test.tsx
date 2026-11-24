import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon, ICON_NAMES, VoicePartIcon, type IconSize } from '.'

describe('Icon', () => {
  it.each(ICON_NAMES)('draws %s on the shared 24 grid with a 1.5 round stroke', (name) => {
    const { container } = render(<Icon name={name} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('stroke-width', '1.5')
    expect(svg).toHaveAttribute('stroke-linecap', 'round')
    expect(svg).toHaveAttribute('stroke-linejoin', 'round')
    expect(svg?.childElementCount).toBeGreaterThan(0)
  })

  it('hides a decorative icon and names a standalone one', () => {
    const { container, getByText } = render(
      <>
        <Icon name="search" />
        <Icon name="warning" label="Cảnh báo" />
      </>,
    )
    const icons = container.querySelectorAll('.hm-icon')
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
    expect(icons[0]).not.toHaveAttribute('role')
    expect(icons[1]).not.toHaveAttribute('aria-hidden')
    expect(getByText('Cảnh báo')).toBeInTheDocument()
  })

  it('has its own drawing for every name', () => {
    expect(ICON_NAMES).toHaveLength(85)
    expect(ICON_NAMES).toEqual(expect.arrayContaining(['song', 'assignment', 'tasks', 'roles', 'workspace-switch']))
    const drawings = ICON_NAMES.map((name) => render(<Icon name={name} />).container.querySelector('svg')?.innerHTML ?? '')
    const owners = new Map<string, string[]>()
    drawings.forEach((drawing, i) => owners.set(drawing, [...(owners.get(drawing) ?? []), ICON_NAMES[i]]))
    // No two names share a drawing: any duplicate is listed by name.
    expect([...owners.values()].filter((names) => names.length > 1)).toEqual([])
    expect(owners.size).toBe(85)
  })

  it.each<[IconSize | undefined, string]>([
    ['xxs', '9px'],
    ['xs', '12px'],
    ['sm', '14px'],
    ['md', '16px'],
    ['lg', '20px'],
    ['xl', '24px'],
    [18, '18px'],
    [undefined, '1em'],
  ])('resolves size %s to %s', (size, fontSize) => {
    const { container } = render(<Icon name="add" size={size} />)
    expect(container.querySelector<HTMLElement>('.hm-icon')?.style.fontSize).toBe(fontSize)
  })
})

describe('VoicePartIcon', () => {
  it.each([
    ['Soprano', 'M15 9.2'],
    ['Nữ cao', 'M15 9.2'],
    ['Nữ trầm'.normalize('NFD'), 'm8 17'],
    ['Tenor', 'M7.8 7.5'],
    ['Nam cao', 'M7.8 7.5'],
    ['Bass', 'M9 12h3.3'],
    ['Nam trầm', 'M9 12h3.3'],
  ])('draws the voice part of %s', (name, path) => {
    const { container } = render(<VoicePartIcon name={name} />)
    expect(container.querySelector('.hm-icon')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('path')?.getAttribute('d')?.startsWith(path)).toBe(true)
  })

  it.each(['Double bass', 'Bass guitar', 'Contralto', 'Guitar', ''])('draws nothing for %j', (name) => {
    const { container } = render(<VoicePartIcon name={name} />)
    expect(container).toBeEmptyDOMElement()
  })
})
