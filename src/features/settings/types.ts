/** `SettingDataType` of Harmonia-BE: how the text `value` of a setting is read. */
export type SettingDataType = 'string' | 'int' | 'bool' | 'json'

/**
 * One system setting (`SystemSettingDto`, FE-51). The set of keys is fixed by the backend (`SystemSettingKeys`): the
 * Admin edits values only. `value` is always text ("42", "true").
 */
export interface SystemSetting {
  id: string
  key: string
  value: string
  dataType: SettingDataType
  /** English, written for developers; the page shows its own wording for known keys. */
  description?: string
  isPublic: boolean
  minValue?: number
  maxValue?: number
}

/** The settings every signed-in role reads (`GET /api/system-settings/public`). */
export interface PublicSettings {
  parishName?: string
  choirName?: string
  /** Shown to every user; absent when empty. */
  announcement?: string
}
