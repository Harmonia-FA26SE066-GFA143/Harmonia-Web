import { apiRequest } from '@/lib/api/client'
import type { PublicSettings, SettingDataType, SystemSetting } from '../types'

// `/api/system-settings` (Harmonia-BE SystemSettingsController): the Admin lists and edits every setting; every
// signed-in role reads the public ones.

type ApiDataType = 'String' | 'Int' | 'Bool' | 'Json'

const dataTypeByApi: Record<ApiDataType, SettingDataType> = { String: 'string', Int: 'int', Bool: 'bool', Json: 'json' }

interface SystemSettingDto {
  id: string
  key: string
  value: string
  dataType: ApiDataType
  description: string | null
  isPublic: boolean
  minValue: number | null
  maxValue: number | null
}

const toSetting = (dto: SystemSettingDto): SystemSetting => ({
  id: dto.id,
  key: dto.key,
  value: dto.value,
  dataType: dataTypeByApi[dto.dataType],
  description: dto.description ?? undefined,
  isPublic: dto.isPublic,
  minValue: dto.minValue ?? undefined,
  maxValue: dto.maxValue ?? undefined,
})

/** Admin only; sorted by key on the server. */
export async function listSettings(): Promise<SystemSetting[]> {
  return (await apiRequest<SystemSettingDto[]>('/api/system-settings')).map(toSetting)
}

/** Admin only. `value` is the text form: "42" for Int, "true" / "false" for Bool. */
export async function updateSetting(id: string, value: string): Promise<void> {
  await apiRequest<unknown>(`/api/system-settings/${id}`, { method: 'PUT', body: JSON.stringify({ value }) })
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const rows = await apiRequest<SystemSettingDto[]>('/api/system-settings/public')
  const value = (key: string) => rows.find((row) => row.key === key)?.value.trim() || undefined
  return { parishName: value('Parish.Name'), choirName: value('Choir.Name'), announcement: value('System.Announcement') }
}
