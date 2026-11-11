import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api/errors'
import { BackgroundTaskProvider } from '@/shared/tasks/BackgroundTasks'
import { NeumeSpinner } from '@/shared/ui'
import { theme } from './theme'

// Vietnamese month/day names for Ant Design date pickers and dayjs formatting.
dayjs.locale('vi')

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // A 4xx answer (validation, permission, not found) would fail the same way again; retry only the rest.
        defaultOptions: {
          queries: {
            retry: (failures, error) =>
              failures < 3 &&
              !(error instanceof ApiError && error.status < 500),
          },
        },
      }),
  )

  return (
    // The neume ring replaces Ant Design's spinning circle in buttons and loading areas (owner 2026-11-04).
    <ConfigProvider
      theme={theme}
      locale={viVN}
      button={{ loadingIcon: <NeumeSpinner size={14} /> }}
      spin={{ indicator: <NeumeSpinner size={24} /> }}
    >
      {/* AntApp gives message/notification/modal access to theme context */}
      <AntApp>
        <QueryClientProvider client={queryClient}>
          {/* Above the router: a task keeps running and keeps its result while pages change. */}
          <BackgroundTaskProvider>{children}</BackgroundTaskProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  )
}
