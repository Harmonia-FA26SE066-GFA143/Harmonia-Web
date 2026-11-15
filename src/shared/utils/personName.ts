/** "Giuse Nguyễn Văn An": the saint name (tên thánh, BE afbf4c3) goes before the full name when there is one. */
export const personName = (fullName: string, saintName?: string | null) => [saintName?.trim(), fullName].filter(Boolean).join(' ')

/** The avatar letter: the first letter of the given name, which a Vietnamese full name ends with. */
export const nameInitial = (fullName: string) => fullName.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase() ?? '?'

/** Rule shared by every form that edits a saint name: optional, ≤ 50 (Harmonia-BE *Validator, `SaintName.MaximumLength(50)`). */
export const saintNameRules = [{ max: 50, message: 'Tên thánh tối đa 50 ký tự.' }]

/** `Gender` of Harmonia-BE (BE d743688), sent by name. Required when a registration or an account is created. */
export type Gender = 'Male' | 'Female'

export const genderOptions: { value: Gender; label: string }[] = [
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
]

export const genderLabel = (gender?: Gender | null) => genderOptions.find((option) => option.value === gender)?.label
