import { describe, expect, it } from 'vitest'
import { getPopupContainer, getSectionPopupContainer, SELECT_POPUP_PROPS } from './popupContainer'

describe('popupContainer', () => {
  it('falls back to document.body when trigger is omitted or has no container ancestor', () => {
    expect(getPopupContainer()).toBe(document.body)
    const orphan = document.createElement('button')
    document.body.appendChild(orphan)
    expect(getPopupContainer(orphan)).toBe(document.body)
    orphan.remove()
  })

  it('returns the nearest unclipped drawer/head/section container and skips overflow:hidden boxes', () => {
    const drawerBody = document.createElement('div')
    drawerBody.className = 'ant-drawer-body'
    const btnInDrawer = document.createElement('button')
    drawerBody.appendChild(btnInDrawer)
    document.body.appendChild(drawerBody)
    expect(getSectionPopupContainer(btnInDrawer)).toBe(drawerBody)

    const clippedSection = document.createElement('section')
    clippedSection.className = 'hm-sheet-section'
    clippedSection.style.overflow = 'hidden'
    const main = document.createElement('main')
    main.className = 'hm-main'
    const btnInClipped = document.createElement('button')
    clippedSection.appendChild(btnInClipped)
    main.appendChild(clippedSection)
    document.body.appendChild(main)
    expect(getPopupContainer(btnInClipped)).toBe(main)

    drawerBody.remove()
    main.remove()
  })

  it('provides SELECT_POPUP_PROPS with placement bottomLeft', () => {
    expect(SELECT_POPUP_PROPS.placement).toBe('bottomLeft')
    expect(SELECT_POPUP_PROPS.getPopupContainer).toBe(getPopupContainer)
  })
})
