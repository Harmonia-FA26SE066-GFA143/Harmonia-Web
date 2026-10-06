import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useState, type ReactNode } from 'react'
import { ApiContractMissingError, ApiError } from '@/lib/api/errors'
import { theme } from './theme'

// Vietnamese month/day names for Ant Design date pickers and dayjs formatting.
dayjs.locale('vi')

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // A 4xx answer (validation, permission, not found) or a missing contract would fail the same way again;
        // retry only the rest.
        defaultOptions: {
          queries: {
            retry: (failures, error) =>
              failures < 3 &&
              !(error instanceof ApiContractMissingError) &&
              !(error instanceof ApiError && error.status < 500),
          },
        },
      }),
  )

  return (
    <ConfigProvider theme={theme} locale={viVN}>
      {/* AntApp gives message/notification/modal access to theme context */}
      <AntApp>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  )
}
