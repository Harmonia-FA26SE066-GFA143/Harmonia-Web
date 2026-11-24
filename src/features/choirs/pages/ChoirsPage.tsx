import { App, Button, Card, Flex, Table, Typography, type TableColumnsType } from 'antd'
import { useState, type CSSProperties } from 'react'
import { accountName, useActiveDirectors } from '@/features/users'
import { ApiError } from '@/lib/api/errors'
import {
  ACTIONS_COLUMN_TITLE,
  CHOIR_NAV_LABEL,
  EmptyCell,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  SectionSkeleton,
  StatusTag,
  UNKNOWN_METRIC_LABEL,
} from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { ChoirFormDrawer } from '../components/ChoirFormDrawer'
import { ChoirMembersDrawer } from '../components/ChoirMembersDrawer'
import { UnplacedMembersNotice } from '../components/UnplacedMembersNotice'
import { useChoirs, useMembersOfChoir, useSaveChoir } from '../hooks/useChoirs'
import type { Choir, ChoirValues } from '../types'

type FormState = { open: false } | { open: true; choir?: Choir }

const muted = { color: colors.textMuted }

/** The Admin's form: the directors list is an Admin endpoint, so it is loaded only here. */
function AdminChoirForm({ form, onClose }: Readonly<{ form: FormState; onClose: () => void }>) {
  const { message } = App.useApp()
  const save = useSaveChoir()
  const directors = useActiveDirectors()
  const [nameError, setNameError] = useState<string>()
  const editing = form.open ? form.choir : undefined

  const handleSubmit = (values: ChoirValues) => {
    if (save.isPending) return
    setNameError(undefined)
    save.mutate(
      { id: editing?.id, values },
      {
        onSuccess: () => {
          message.success(editing ? 'Đã lưu thay đổi ca đoàn.' : 'Đã thêm ca đoàn.')
          onClose()
        },
        onError: (error) => {
          const text = choirErrorMessage(error, 'Không thể lưu ca đoàn. Vui lòng thử lại.')
          // A taken name is shown under the name field, where it can be fixed.
          if (error instanceof ApiError && error.code === 'CHOIR_NAME_ALREADY_EXISTS') setNameError(text)
          else message.error(text)
        },
      },
    )
  }

  return (
    <ChoirFormDrawer
      open={form.open}
      choir={editing}
      nameError={nameError}
      saving={save.isPending}
      directors={(directors.data ?? []).map((account) => ({ value: account.id, label: accountName(account) }))}
      directorsLoading={directors.isPending}
      onSubmit={handleSubmit}
      onCancel={() => {
        setNameError(undefined)
        onClose()
      }}
    />
  )
}

/** `ChoirDto` carries no member count: each card reads its own `GET /api/choirs/{id}/members` (G2-10, R2.6). */
const countStyle = { color: colors.textBody, fontSize: 13, fontWeight: 600 }

/** The count the choir list already carries (ChoirDto.MemberCount); a choir read without it asks for its members. */
function MemberCount({ choir }: Readonly<{ choir: Choir }>) {
  if (choir.memberCount !== undefined) return <Typography.Text style={countStyle}>{choir.memberCount} ca viên</Typography.Text>
  return <FetchedMemberCount choirId={choir.id} />
}

function FetchedMemberCount({ choirId }: Readonly<{ choirId: string }>) {
  const members = useMembersOfChoir(choirId)
  let text: string
  if (members.isPending) text = 'Đang tải số ca viên…'
  else if (members.isError) text = UNKNOWN_METRIC_LABEL
  else text = `${members.data.length} ca viên`
  return (
    <Typography.Text style={members.isSuccess ? countStyle : { color: colors.textMuted, fontSize: 13 }}>
      {text}
    </Typography.Text>
  )
}

/** A Director's choir as a sheet with its name in the serif (artifact ChoirsPage). */
function DirectorChoirCard({ choir, index, onOpenMembers }: Readonly<{ choir: Choir; index: number; onOpenMembers: (choir: Choir) => void }>) {
  return (
    <li className="ct-choir hm-lift" style={{ '--i': index } as CSSProperties}>
      <Flex align="flex-start" justify="space-between" gap={spacing.sm}>
        <h2 className="ct-choir__name">{choir.name}</h2>
        <StatusTag color={choir.isActive ? 'green' : 'default'} mark={choir.isActive ? undefined : 'draft'} style={{ marginInlineEnd: 0 }}>
          {choir.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </StatusTag>
      </Flex>
      <MemberCount choir={choir} />
      <Typography.Paragraph style={{ ...(choir.description ? {} : muted), margin: 0, flex: 1 }}>
        {choir.description ?? 'Chưa có mô tả'}
      </Typography.Paragraph>
      <Button icon={<Icon name="choir" />} onClick={() => onOpenMembers(choir)} aria-label={`Ca viên của ${choir.name}`} style={{ alignSelf: 'flex-start' }}>
        Ca viên
      </Button>
    </li>
  )
}

/**
 * The choirs of the parish (D7, D8, `/api/choirs`). Admin: every choir, add, rename, switch off, choose its Choir
 * Director, and its members. Choir Director: their own choirs and their members. Both add members from the whole
 * parish.
 */
export function ChoirsPage({ role }: Readonly<{ role: 'admin' | 'director' }>) {
  const admin = role === 'admin'
  const choirs = useChoirs()
  const [form, setForm] = useState<FormState>({ open: false })
  const [membersOf, setMembersOf] = useState<Choir>()

  const addButton = admin && (
    <Button type="primary" icon={<Icon name="add" />} onClick={() => setForm({ open: true })}>
      Thêm ca đoàn
    </Button>
  )

  const columns: TableColumnsType<Choir> = [
    {
      key: 'name',
      title: 'Ca đoàn',
      render: (_, choir) => (
        <Flex vertical>
          <Typography.Text strong>{choir.name}</Typography.Text>
          <Typography.Text style={{ ...muted, maxWidth: 480 }}>{choir.description ?? 'Chưa có mô tả'}</Typography.Text>
        </Flex>
      ),
    },
    ...(admin
      ? [
          {
            key: 'director',
            title: 'Ca trưởng phụ trách',
            render: (_: unknown, choir: Choir) => choir.directorName ?? <EmptyCell text="Chưa có" />,
          },
          {
            key: 'members',
            title: 'Ca viên',
            render: (_: unknown, choir: Choir) => <MemberCount choir={choir} />,
          },
        ]
      : []),
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, choir) => (
        <StatusTag color={choir.isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
          {choir.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </StatusTag>
      ),
    },
    {
      key: 'actions',
      title: ACTIONS_COLUMN_TITLE,
      align: 'center',
      width: admin ? 184 : 120,
      fixed: 'right',
      render: (_, choir) => (
        <Flex justify="center" gap={4}>
          <Button icon={<Icon name="choir" />} onClick={() => setMembersOf(choir)} aria-label={`Ca viên của ${choir.name}`}>
            Ca viên
          </Button>
          {admin && (
            <Button
              type="text"
              icon={<Icon name="edit" />}
              onClick={() => setForm({ open: true, choir })}
              aria-label={`Chỉnh sửa ${choir.name}`}
            />
          )}
        </Flex>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={admin ? 'Ca đoàn' : 'Ca đoàn của tôi'}
        breadcrumb={admin ? [{ title: 'Quản trị hệ thống' }, { title: 'Ca đoàn' }] : [{ title: 'Ca trưởng' }, { title: CHOIR_NAV_LABEL }]}
        description={
          admin
            ? 'Ca đoàn của giáo xứ và ca trưởng phụ trách. Một ca viên có thể thuộc nhiều ca đoàn.'
            : 'Ca đoàn bạn phụ trách. Một ca viên có thể thuộc nhiều ca đoàn.'
        }
        // The Admin's empty state carries the only "Thêm ca đoàn" (SYS-06).
        extra={admin && choirs.isSuccess && choirs.data.length === 0 ? undefined : addButton}
      />
      {choirs.isPending && <SectionSkeleton rows={4} label="Đang tải ca đoàn" />}
      {choirs.isError && (
        <ErrorState title="Không thể tải ca đoàn" error={choirs.error} hasData={choirs.data !== undefined} onRetry={() => choirs.refetch()} retrying={choirs.isFetching} />
      )}
      {choirs.isSuccess && choirs.data.length === 0 && (
        <EmptyState
          title={admin ? 'Chưa có ca đoàn nào' : 'Bạn chưa phụ trách ca đoàn nào'}
          description={
            admin
              ? 'Thêm ca đoàn đầu tiên rồi chọn ca trưởng phụ trách.'
              : 'Quản trị viên chọn ca trưởng phụ trách cho từng ca đoàn. Liên hệ quản trị viên để được giao ca đoàn.'
          }
          action={addButton || undefined}
        />
      )}
      {admin && choirs.isSuccess && choirs.data.length > 0 && <UnplacedMembersNotice choirs={choirs.data} />}
      {/* A Director leads one to a few choirs, so one member request per card stays small. */}
      {!admin && choirs.isSuccess && choirs.data.length > 0 && (
        <ul className="ct-choirs hm-stagger" aria-label="Ca đoàn bạn phụ trách">
          {choirs.data.map((choir, index) => (
            <DirectorChoirCard key={choir.id} choir={choir} index={index} onOpenMembers={setMembersOf} />
          ))}
        </ul>
      )}
      {admin && choirs.isSuccess && choirs.data.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <Table<Choir> rowKey="id" pagination={false} dataSource={choirs.data} scroll={{ x: 'max-content' }} columns={columns} />
        </Card>
      )}
      {admin && <AdminChoirForm form={form} onClose={() => setForm({ open: false })} />}
      <ChoirMembersDrawer choir={membersOf} onClose={() => setMembersOf(undefined)} />
    </>
  )
}

export const AdminChoirsPage = () => <ChoirsPage role="admin" />

export const DirectorChoirsPage = () => <ChoirsPage role="director" />
