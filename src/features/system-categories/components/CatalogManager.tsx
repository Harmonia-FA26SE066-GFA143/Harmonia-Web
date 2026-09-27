import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { App } from 'antd'
import { useState } from 'react'
import type { SaveCatalogItem } from '../hooks/useCatalogs'
import type { CatalogItem } from '../types'
import { CatalogItemModal } from './CatalogItemModal'
import { CatalogTable, type CatalogLabels } from './CatalogTable'

export interface CatalogManagerProps {
  labels: CatalogLabels
  /** Title of the add/edit modal, e.g. { create: 'Thêm kỹ năng', edit: 'Chỉnh sửa kỹ năng' }. */
  modalTitles: { create: string; edit: string }
  query: UseQueryResult<CatalogItem[]>
  save: UseMutationResult<CatalogItem, Error, SaveCatalogItem>
}

type ModalState = { open: false } | { open: true; item?: CatalogItem }

/** List + add/edit flow shared by the skill (FE-49) and liturgical (FE-50) catalogs. */
export function CatalogManager({ labels, modalTitles, query, save }: CatalogManagerProps) {
  const { message } = App.useApp()
  const [modal, setModal] = useState<ModalState>({ open: false })
  const editing = modal.open ? modal.item : undefined

  const close = () => setModal({ open: false })

  return (
    <>
      <CatalogTable
        labels={labels}
        items={query.data}
        loading={query.isPending}
        error={query.isError}
        retrying={query.isFetching}
        onRetry={() => query.refetch()}
        onAdd={() => setModal({ open: true })}
        onEdit={(item) => setModal({ open: true, item })}
      />
      <CatalogItemModal
        open={modal.open}
        item={editing}
        titles={modalTitles}
        nameLabel={labels.nameColumn}
        saving={save.isPending}
        onCancel={close}
        onSubmit={(values) =>
          save.mutate(
            { id: editing?.id, values },
            {
              onSuccess: () => {
                message.success(editing ? 'Đã lưu thay đổi.' : `Đã thêm ${labels.noun}.`)
                close()
              },
              // The modal stays open so the entered values are not lost.
              onError: () => message.error(`Không thể lưu ${labels.noun}. Vui lòng thử lại.`),
            },
          )
        }
      />
    </>
  )
}
