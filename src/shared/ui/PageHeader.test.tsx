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
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Tài khoản' }, { title: 'Chi tiết' }]}
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

  it("omits the breadcrumb on a section's own page, which the running head already names", () => {
    const { container } = render(<PageHeader title="Tổng quan" breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Tổng quan' }]} />)
    expect(container.querySelector('.ant-breadcrumb')).toBeNull()
  })

  it('decouples Breadcrumb onto Row 1 above h1 and places Incipit on the h1 row (G3-05b)', () => {
    const { container } = render(
      <PageHeader
        title="Phòng luyện tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Lịch tập' }, { title: 'Phòng luyện tập' }]}
      />,
    )
    const nav = container.querySelector('.ant-breadcrumb')
    const incipit = container.querySelector('.hm-incipit')
    const heading = screen.getByRole('heading', { level: 1, name: 'Phòng luyện tập' })
    expect(nav).not.toBeNull()
    expect(incipit).not.toBeNull()
    expect(incipit).toHaveAttribute('aria-hidden', 'true')
    expect(nav!.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(heading.compareDocumentPosition(incipit!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('allows showing a 2-item breadcrumb when showBreadcrumb is true', () => {
    const { container } = render(
      <PageHeader title="Đổi mật khẩu" showBreadcrumb breadcrumb={[{ title: 'Hồ sơ cá nhân' }, { title: 'Đổi mật khẩu' }]} />,
    )
    expect(container.querySelector('.ant-breadcrumb')).not.toBeNull()
    expect(screen.getByText('Hồ sơ cá nhân')).toBeInTheDocument()
  })
})
