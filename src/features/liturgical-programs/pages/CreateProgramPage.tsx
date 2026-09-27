import { App, Modal } from 'antd'
import { useRef, useState } from 'react'
import { generatePath, useBeforeUnload, useBlocker, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { PageHeader } from '@/shared/ui'
import { ProgramForm } from '../components/ProgramForm'
import { useCreateProgram } from '../hooks/usePrograms'
import type { ProgramFormValues } from '../types'

/**
 * Priest: create a liturgical program with the FE-16 event fields (FE-15–FE-16).
 * `?date=YYYY-MM-DD` preselects the date (from the calendar). Leaving with unsaved input asks for confirmation.
 * Not built (team decision 2026-09-26): duplicate-program warning; no Draft/Published state.
 */
export function CreateProgramPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const create = useCreateProgram()
  const [dirty, setDirty] = useState(false)
  // Set once the program is saved; read at navigation time so the redirect to the new program is not blocked.
  const saved = useRef(false)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saved.current && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload((event) => {
    if (dirty && !saved.current) event.preventDefault()
  })

  const initialDate = searchParams.get('date') ?? undefined

  const handleSubmit = (values: ProgramFormValues) =>
    create.mutate(values, {
      onSuccess: (program) => {
        message.success('Đã tạo chương trình phụng vụ.')
        saved.current = true
        navigate(generatePath(paths.priest.programDetail, { programId: program.id }))
      },
      // The form keeps its values so nothing is lost.
      onError: () => message.error('Không thể lưu chương trình. Vui lòng thử lại.'),
    })

  return (
    <>
      <PageHeader
        title="Tạo chương trình phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }, { title: 'Tạo chương trình' }]}
        description="Nhập thông tin sự kiện phụng vụ: tên, ngày, mùa phụng vụ, loại Thánh lễ, loại nghi thức và yêu cầu đặc biệt."
      />
      <ProgramForm
        initialDate={initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : undefined}
        saving={create.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate(paths.priest.programs)}
        onDirty={() => setDirty(true)}
      />
      <Modal
        open={blocker.state === 'blocked'}
        title="Rời khỏi trang tạo chương trình?"
        okText="Rời khỏi trang"
        cancelText="Ở lại"
        okButtonProps={{ danger: true }}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Thông tin bạn vừa nhập sẽ không được lưu nếu rời khỏi trang lúc này.
      </Modal>
    </>
  )
}
