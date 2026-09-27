import { render, screen } from '@testing-library/react'
import { Button } from 'antd'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders the title as the page heading with breadcrumb, description and actions', () => {
    render(
      <PageHeader
        title="Tài khoản"
        description="Quản lý tài khoản người dùng."
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Tài khoản' }]}
        extra={<Button type="primary">Tạo tài khoản</Button>}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Tài khoản' })).toBeInTheDocument()
    expect(screen.getByText('Quản lý tài khoản người dùng.')).toBeInTheDocument()
    expect(screen.getByText('Quản trị hệ thống')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tạo tài khoản' })).toBeInTheDocument()
  })

  it('omits the breadcrumb when none is given', () => {
    const { container } = render(<PageHeader title="Tổng quan" />)
    expect(container.querySelector('.ant-breadcrumb')).toBeNull()
  })
})
