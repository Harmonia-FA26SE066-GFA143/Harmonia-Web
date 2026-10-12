import { ApiError } from '@/lib/api/errors'

/** Refusals of PUT /api/system-settings/{id} (Harmonia-BE SystemSettingService, SystemSetting.SetValue). */
const messages: Record<string, string> = {
  SETTING_NOT_FOUND: 'Thiết lập không còn tồn tại. Vui lòng tải lại trang.',
  SETTING_VALUE_TYPE_MISMATCH: 'Giá trị không đúng kiểu của thiết lập.',
  SETTING_VALUE_OUT_OF_RANGE: 'Giá trị nằm ngoài khoảng cho phép.',
}

export function settingErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
