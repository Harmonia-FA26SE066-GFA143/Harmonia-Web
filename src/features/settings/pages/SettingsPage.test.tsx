import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderPage } from '@/test/renderPage'
import { SettingsPage } from './SettingsPage'

describe('SettingsPage', () => {
  it('states that no setting is defined yet and links to the catalogs', async () => {
    renderPage(<SettingsPage />, '/admin/settings')

    expect(screen.getByRole('heading', { name: 'Chưa có mục cấu hình nào được xác định' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Danh mục phụng vụ' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/admin/liturgical-categories')
  })
})
