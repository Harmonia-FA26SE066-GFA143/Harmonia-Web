import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { App, type TableColumnsType } from 'antd'
import { useState, type ReactNode } from 'react'
import { catalogErrorMessage, nameConflictMessage } from '../catalogErrors'
import type { SaveCatalogEntry } from '../hooks/useCatalogs'
import type { CatalogEntry } from '../types'
import { CatalogItemModal } from './CatalogItemModal'
import { CatalogTable, type CatalogLabels } from './CatalogTable'

export interface CatalogManagerProps<T extends CatalogEntry, V> {
  /** Lower-case noun the wording is built from, e.g. "kỹ năng", "mùa phụng vụ". */
  noun: string
  query: UseQueryResult<T[]>
  save: UseMutationResult<T, Error, SaveCatalogEntry<V>>
  /** Table columns between the name and the status. */
  columns: TableColumnsType<T>
  /** Form fields between the name and the status switch. */
  fields: ReactNode
  nameMax?: number
}

type ModalState<T> = { open: false } | { open: true; item?: T }

const labelsFor = (noun: string): CatalogLabels => ({
  noun,
  nameColumn: `Tên ${noun}`,
  addLabel: `Thêm ${noun}`,
  emptyTitle: `Chưa có ${noun} nào`,
  emptyDescription: `Thêm mục đầu tiên cho danh mục ${noun}.`,
  errorTitle: `Không thể tải danh mục ${noun}`,
})

/** List + add/edit flow shared by the skill (FE-49) and liturgical (FE-50) catalogs. */
export function CatalogManager<T extends CatalogEntry, V extends { name: string }>({
  noun,
  query,
  save,
  columns,
  fields,
  nameMax = 50,
}: CatalogManagerProps<T, V>) {
  const labels = labelsFor(noun)
  const { message } = App.useApp()
  const [modal, setModal] = useState<ModalState<T>>({ open: false })
  const [nameError, setNameError] = useState<string>()
  const editing = modal.open ? modal.item : undefined

  const open = (item?: T) => {
    setNameError(undefined)
    setModal({ open: true, item })
  }
  const close = () => setModal({ open: false })

  return (
    <>
      <CatalogTable
        labels={labels}
        columns={columns}
        items={query.data}
        loading={query.isPending}
        error={query.isError}
        retrying={query.isFetching}
        onRetry={() => query.refetch()}
        onAdd={() => open()}
        onEdit={open}
      />
      <CatalogItemModal<T, V>
        open={modal.open}
        item={editing}
        titles={{ create: `Thêm ${noun}`, edit: `Chỉnh sửa ${noun}` }}
        nameLabel={labels.nameColumn}
        nameMax={nameMax}
        nameError={nameError}
        fields={fields}
        saving={save.isPending}
        onCancel={close}
        onSubmit={(values) => {
          setNameError(undefined)
          save.mutate(
            { id: editing?.id, values },
            {
              onSuccess: () => {
                message.success(editing ? 'Đã lưu thay đổi.' : `Đã thêm ${labels.noun}.`)
                close()
              },
              // The modal stays open so the entered values are not lost.
              onError: (error) => {
                const conflict = nameConflictMessage(error)
                if (conflict) setNameError(conflict)
                else message.error(catalogErrorMessage(error, `Không thể lưu ${labels.noun}. Vui lòng thử lại.`))
              },
            },
          )
        }}
      />
    </>
  )
}
