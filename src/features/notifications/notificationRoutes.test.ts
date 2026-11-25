import { describe, expect, it } from 'vitest'
import { notificationPath } from './notificationRoutes'

const base = { id: 'n1', title: 't', content: 'c', createdAt: '2026-11-25T00:00:00Z', isRead: false }

describe('notificationPath', () => {
  it('opens an event the Choir Director can read, but the program list for a cancelled one (no detail page)', () => {
    const event = { ...base, referenceType: 'LiturgicalEvent', referenceId: 'e1' }
    expect(notificationPath({ ...event, type: 'EventPublished' }, 'ChoirDirector')).toBe('/director/programs/e1')
    expect(notificationPath({ ...event, type: 'EventCancelled' }, 'ChoirDirector')).toBe('/director/programs')
    // The Priest reads cancelled events on their detail page.
    expect(notificationPath({ ...event, type: 'EventCancelled' }, 'ParishPriest')).toBe('/priest/programs/e1')
  })
})
