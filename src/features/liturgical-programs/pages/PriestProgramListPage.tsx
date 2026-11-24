import { App, Button, Card, Flex } from 'antd'
import { useMemo, useState } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { vietnamToday } from '@/lib/api/dates'
import { CANCEL_LABEL, EmptyState, EmptyWeek, ErrorState, Icon, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { EventFilterBar } from '../components/EventFilterBar'
import { GenerateEventsButton } from '../components/GenerateEventsButton'
import { EventPreview } from '../components/EventPreview'
import { EventTable } from '../components/EventTable'
import { eventErrorMessage } from '../eventErrors'
import { useEventNames } from '../hooks/useEventNames'
import { useEvents, usePublishEvents } from '../hooks/useEvents'
import { formatProgramDate, hasActiveEventFilters, readEventListState, writeEventListState } from '../programFilters'
import type { EventFilters, LiturgicalEvent } from '../types'

const pageSize = 20

/** Priest: liturgical events of the parish (FE-15) on `GET /api/liturgical-events`, filtered on the server. */
export function PriestProgramListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, page } = useMemo(() => readEventListState(searchParams), [searchParams])
  const events = useEvents(filters, { pageNumber: page, pageSize })

  const { message, modal } = App.useApp()
  const { eventName } = useEventNames()
  const publish = usePublishEvents()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // Only what the backend would publish: an upcoming draft. Rows that left the page are no longer selected.
  const publishable = (event: LiturgicalEvent) => event.status === 'draft' && event.date >= vietnamToday()
  const selected = (events.data?.items ?? []).filter((event) => selectedIds.includes(event.id) && publishable(event))

  const confirmPublish = () =>
    modal.confirm({
      title: `Công bố ${selected.length} sự kiện đã chọn?`,
      content: 'Ca trưởng nhận thông báo, ca viên của các ca đoàn phục vụ được mời xác nhận tham gia, và các sự kiện hiện trong lịch.',
      okText: 'Công bố',
      cancelText: CANCEL_LABEL,
      onOk: async () => {
        const { published, notInvited, nobody, refused } = await publish.mutateAsync(selected)
        setSelectedIds(refused.map(({ event }) => event.id))
        if (refused.length === 0 && notInvited === 0 && nobody === 0) {
          message.success(`Đã công bố ${published} sự kiện.`)
          return
        }
        modal.warning({
          title: `Đã công bố ${published} trên ${selected.length} sự kiện`,
          content: (
            <>
              {notInvited > 0 && `${notInvited} sự kiện chưa gửi được lời mời cho ca viên; ca trưởng có thể gửi ở trang Xác nhận tham gia.`}
              {nobody > 0 && ` ${nobody} sự kiện chưa mời được ai vì các ca đoàn phục vụ chưa có ca viên.`}
              {refused.length > 0 && (
                <ul style={{ paddingInlineStart: spacing.lg }}>
                  {refused.map(({ event, error }) => (
                    <li key={event.id}>
                      {formatProgramDate(event.date)} · {event.time} · {eventName(event)}: {eventErrorMessage(error, 'Không thể công bố.')}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ),
        })
      },
    })

  const total = events.data?.totalCount ?? 0
  const filtered = hasActiveEventFilters(filters)
  // Filters and page are in the URL, so reload and the back button keep them.
  const changeFilters = (next: EventFilters) => setSearchParams(writeEventListState(next, 1), { replace: true })
  const setPage = (next: number) => setSearchParams(writeEventListState(filters, next), { replace: true })
  const resetFilters = () => changeFilters({})
  // The previewed event is kept in the URL beside the filters; the first row until one is picked (as for Ca trưởng).
  const items = events.data?.items ?? []
  const picked = items.find((event) => event.id === searchParams.get('program')) ?? items[0]
  const pick = (id: string) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('program', id)
        return next
      },
      { replace: true },
    )
  const openEvent = (id: string) => navigate(generatePath(paths.priest.programDetail, { programId: id }))

  const createButton = (
    <Button type="primary" icon={<Icon name="add" />} onClick={() => navigate(paths.priest.programCreate)}>
      Tạo chương trình
    </Button>
  )

  // SYS-06: with nothing to list, the empty state keeps the only create button.
  const empty = events.data !== undefined && total === 0 && !filtered

  return (
    <>
      <PageHeader
        title="Chương trình phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }]}
        extra={
          empty ? (
            <GenerateEventsButton />
          ) : (
            <Flex wrap gap={spacing.sm}>
              <GenerateEventsButton />
              {createButton}
            </Flex>
          )
        }
      />
      {events.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách chương trình" />}
      {events.isError && (
        <ErrorState title="Không thể tải danh sách chương trình" error={events.error} hasData={events.data !== undefined} onRetry={() => events.refetch()} retrying={events.isFetching} />
      )}
      {empty && (
        <EmptyState
          icon={<EmptyWeek />} title="Chưa có chương trình phụng vụ nào"
          description="Tạo sự kiện đầu tiên, rồi công bố để Ca trưởng bắt đầu chuẩn bị."
          action={createButton}
        />
      )}
      {events.data !== undefined && (total > 0 || filtered) && (
        <>
        <EventFilterBar
          value={filters}
          onChange={changeFilters}
          onReset={resetFilters}
          resultCount={total}
          error={events.isError}
          style={{ marginBottom: spacing.lg }}
        />
        <div className="hm-split">
        <Card styles={{ body: { padding: 0 } }}>
          {total === 0 ? (
            <div style={{ padding: spacing.lg }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <>
              {selected.length > 0 && (
                <Flex style={{ padding: `0 ${spacing.md}px ${spacing.sm}px` }}>
                  <Button type="primary" onClick={confirmPublish}>
                    Công bố {selected.length} sự kiện đã chọn
                  </Button>
                </Flex>
              )}
              <EventTable
                selection={{ selectedIds, onChange: setSelectedIds, selectable: publishable }}
                events={events.data.items}
                loading={events.isPlaceholderData}
                pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
                onOpen={(event) => openEvent(event.id)}
                pickedId={picked?.id}
                onPick={(event) => pick(event.id)}
              />
            </>
          )}
        </Card>
        {picked && (
          <EventPreview
            event={picked}
            onOpen={() => openEvent(picked.id)}
            onReview={() => navigate(generatePath(paths.priest.songListReview, { programId: picked.id }))}
          />
        )}
        </div>
        </>
      )}
    </>
  )
}
